'use strict';

const {google} = require('googleapis');

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
var Member = require('../models/member');

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const jwt = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    SCOPES
);

jwt.authorize((err, response) => {
    updateSheet(jwt);
});

function updateSheet (auth) {
    const sheets = google.sheets({version: 'v4', auth});

    sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Points!A3:A'
    }, (err, res) => {
        if (err)
            console.log(err);
        else {
            const rows = res.data.values;
            if (!rows)
                console.log("No data found");
            else {
                var id = [];
                rows.forEach(function(row) {
                    id.push(row[0]);
                });

                var fQ = {
                    user_id: 1,
                    email: 1,
                    grade: 1,
                    points: 1,
                    key: 1,
                    _id: 0
                };
                var mQ = Member.find({user_id: {$in: id}}).select(fQ).lean();
                mQ.exec(function(errQ, mqObj) {
                    if (errQ)
                        console.log(errQ);
                    else {
                        var updM = new Array(id.length);
                        var updIn = new Array(id.length);

                        mqObj.forEach(function(m) {
                            updM[id.indexOf(m['user_id'])] = [m['email'], m['grade'], m['points']];
                            updIn[id.indexOf(m['user_id'])] = (m['key'] == process.env.SIGNIN_KEY) ? [5] : [''];
                        });
                        console.log(updM);
                        console.log(updIn);

                        const rM = {
                            values: updM
                        };
                        sheets.spreadsheets.values.update({
                            spreadsheetId: process.env.SHEET_ID,
                            range: 'Points!C3:E',
                            valueInputOption: 'RAW',
                            resource: rM
                        }, (err, res) => {
                            if (err)
                                console.log(err);
                            else
                                console.log("%d cells updated.", res.data.updatedCells);
                        });

                        const rIn = {
                            values: updIn
                        };
                        sheets.spreadsheets.values.update({
                            spreadsheetId: process.env.SHEET_ID,
                            range: 'Points!' + process.env.SHEET_NXTCOL + '3:Z',
                            valueInputOption: 'RAW',
                            resource: rIn
                        }, (err2, res2) => {
                            if (err2)
                                console.log(err2);
                            else
                                console.log("%d cells updated.", res2.data.updatedCells);
                        });
                    }
                });
            }
        }
    });

    var fA = {
        user_id: 1,
        name: 1,
        email: 1,
        grade: 1,
        points: 1,
        _id: 0
    };
    var mA = Member.find({first: true}).select(fA).lean();
    mA.exec(function(errA, maObj) {
        if (errA)
            console.log(errA);
        else {
            if (maObj.length) {
                const data = maObj.map(row => Object.values(row));
                const resource = {
                    values: data
                };
                sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.SHEET_ID,
                    range: 'Points!A3',
                    valueInputOption: 'RAW',
                    resource: resource
                }, (err, res) => {
                    if (err)
                        console.log(err);
                    else {
                        console.log("%d cells updated.", res.data.updates.updatedCells);
                        const r2 = {
                            values: new Array(data.length).fill(new Array(1).fill(5))
                        };
                        var range = res.data.updates.updatedRange;
                        range = range.replace('A', process.env.SHEET_NXTCOL);
                        range = range.replace('E', process.env.SHEET_NXTCOL);
                        console.log(range);

                        sheets.spreadsheets.values.update({
                            spreadsheetId: process.env.SHEET_ID,
                            range: range,
                            valueInputOption: 'RAW',
                            resource: r2
                        }, (err2, res2) => {
                            if (err2)
                                console.log(err2);
                            else
                                console.log("%d cells updated.", res2.data.updatedCells);
                        });
                    }
                });
                Member.updateMany({first: true}, {first: false}, function(errF, docsF) {
                    if (errF)
                        console.log("Error updating member");
                    else
                        console.log("Updated");
                });
            }
        }
    });
}

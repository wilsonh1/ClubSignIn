'use strict';

const {google} = require('googleapis');

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
var Member = require('./models/member');

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

function updateSheet(auth) {
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
                var ind = {};
                var cnt = 0;
                rows.forEach(function(row) {
                    ind[row[0]] = cnt;
                    cnt++;
                });

                var fQ = {
                    user_id: 1,
                    email: 1,
                    grade: 1,
                    points: 1,
                    key: 1,
                    _id: 0
                };
                var mQ = Member.find({first: false}).select(fQ).lean();
                mQ.exec(function(errQ, docsQ) {
                    if (errQ)
                        console.log(errQ);
                    else {
                        var updM = new Array(cnt);
                        var updIn = new Array(cnt);

                        var mObj = JSON.parse(JSON.stringify(docsQ));
                        mObj.forEach(function(m) {
                            updM[ind[m['user_id']]] = [m['email'], m['grade'], m['points']];
                            updIn[ind[m['user_id']]] = (m['key'] == process.env.SIGNIN_KEY) ? [5] : [0];
                            /*const resource = {
                                values: [[m['email'], m['grade'], m['points']]]
                            };
                            console.log(resource.values);
                            console.log('Points!C' + ind[m['user_id']] + ':E' + ind[m['user_id']]);
                            sheets.spreadsheets.values.update({
                                spreadsheetId: process.env.SHEET_ID,
                                range: 'Points!C' + ind[m['user_id']] + ':E' + ind[m['user_id']],
                                valueInputOption: 'RAW',
                                resource: resource
                            }, (err, res) => {
                                if (err)
                                    console.log(err);
                                else
                                    console.log("%d cells updated.", res.data.updatedCells);
                            });

                            if (m['key'] == process.env.SIGNIN_KEY) {
                                const r2 = {
                                    values: [[5]]
                                };
                                sheets.spreadsheets.values.update({
                                    spreadsheetId: process.env.SHEET_ID,
                                    range: 'Points!' + process.env.SHEET_NXTCOL + ind[m['user_id']] + ':Z' + ind[m['user_id']],
                                    valueInputOption: 'RAW',
                                    resource: r2
                                }, (err2, res2) => {
                                    if (err2)
                                        console.log(err2);
                                    else
                                        console.log("%d cells updated.", res2.data.updatedCells);
                                });
                            }*/
                        });
                        console.log(updM);
                        console.log(updIn);
                    }
                });
            }
        }
    });

    var fields = {
        user_id: 1,
        name: 1,
        email: 1,
        grade: 1,
        points: 1,
        _id: 0
    };
    var mA = Member.find({first: true}).select(fields).lean();
    mA.exec(function(errA, docsA) {
        if (errA)
            console.log(errA);
        else {
            var mObj = JSON.parse(JSON.stringify(docsA));
            if (mObj.length) {
                const data = mObj.map(row => Object.values(row));
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

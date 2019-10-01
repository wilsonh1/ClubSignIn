'use strict';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
var Member = require('./models/member');

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), updateSheet);
});

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function updateSheet(auth) {
  /*const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1vxTdHjnw58ji-yeZ-KStYa4xDj58cEcR1s1ya2Lhyig',
    range: 'Sheet1!A2:E'
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:');
      rows.map((row) => {
        console.log(`${row[0]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
});*/
    /*const sheets = google.sheets({version: 'v4', auth});
    var mQ = Member.find({}).select(fields).lean();
    mQ.exec(function(errQ, docsQ) {
        if (errQ)
            console.log(errQ);
        else {
            var mObj = JSON.parse(JSON.stringify(docsQ));
            const data = mObj.map(row => Object.values(row));
            //console.log(data);
            const resource = {
                values: data
            };
            sheets.spreadsheets.values.update({
                spreadsheetId: '1vxTdHjnw58ji-yeZ-KStYa4xDj58cEcR1s1ya2Lhyig',
                range: 'Sheet1!A2:E',
                valueInputOption: 'RAW',
                resource: resource
            }, (err, res) => {
                if (err)
                    console.log(err);
                else
                    console.log("%d cells updated.", res.data.updatedCells);
            });
        }
    });*/
    const sheets = google.sheets({version: 'v4', auth});
    const sheetId = '1vxTdHjnw58ji-yeZ-KStYa4xDj58cEcR1s1ya2Lhyig';

    sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A2:A'
    }, (err, res) => {
        if (err)
            console.log(err);
        else {
            const rows = res.data.values;
            if (rows.length) {
                var ind = {};
                var i = "2";
                rows.forEach(function(row) {
                    ind[row[0]] = i;
                    i++;
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
                        var mObj = JSON.parse(JSON.stringify(docsQ));
                        mObj.forEach(function(m) {
                            const resource = {
                                values: [[m['email'], m['grade'], m['points']]]
                            };
                            console.log(resource.values);
                            console.log('Sheet1!C' + ind[m['user_id']] + ':E' + ind[m['user_id']]);
                            sheets.spreadsheets.values.update({
                                spreadsheetId: sheetId,
                                range: 'Sheet1!C' + ind[m['user_id']] + ':E' + ind[m['user_id']],
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
                                    values: [[1]]
                                };
                                sheets.spreadsheets.values.update({
                                    spreadsheetId: sheetId,
                                    range: 'Sheet1!' + process.env.SHEETS_NXTCOL + ind[m['user_id']] + ':Z' + ind[m['user_id']],
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
                    }
                });
            }
            else
                console.log("No data found");
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
            const data = mObj.map(row => Object.values(row));
            const resource = {
                values: data
            };
            sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'Sheet1!A2',
                valueInputOption: 'RAW',
                resource: resource
            }, (err, res) => {
                if (err)
                    console.log(err);
                else {
                    console.log("%d cells updated.", res.data.updates.updatedCells);
                    const r2 = {
                        values: new Array(data.length).fill(new Array(1).fill(1))
                    };
                    var range = res.data.updates.updatedRange;
                    range = range.replace('A', process.env.SHEETS_NXTCOL);
                    range = range.replace('E', process.env.SHEETS_NXTCOL);
                    console.log(range);
                    sheets.spreadsheets.values.update({
                        spreadsheetId: sheetId,
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
                if (errU)
                    console.log("Error updating member");
                else
                    console.log("Updated");
            });
        }
    });
}

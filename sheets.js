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
    var fields = {
        user_id: 1,
        name: 1,
        email: 1,
        grade: 1,
        points: 1,
        _id: 0
    };
    var mQ = Member.find({}).select(fields).sort({user_id: 1}).lean();
    mQ.exec(function(errQ, docsQ) {
        if (errQ)
            console.log(errQ);
        else {
            var mObj = JSON.parse(JSON.stringify(docsQ));
            const data = mObj.map(row => Object.values(row));
            //console.log(data);
            const sheets = google.sheets({version: 'v4', auth});
            const resource = {
                values: data
            };
            sheets.spreadsheets.values.update({
                spreadsheetId: '1vxTdHjnw58ji-yeZ-KStYa4xDj58cEcR1s1ya2Lhyig',
                range: 'Sheet1!A2:E',
                valueInputOption: 'RAW',
                resource: resource
            }, (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(res);
                    console.log("%d cells updated.", res.data.updatedCells);
                }
            });
        }
    });
}

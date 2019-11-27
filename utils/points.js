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
    updateDB(jwt);
});

function updateDB (auth) {
    const sheets = google.sheets({version: 'v4', auth});

    sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GSHEET_ID,
        range: 'Points!A3:D'
    }, (err2, res2) => {
        const rows = res2.data.values;
        rows.forEach(function(row) {
            if (!row[0])
                return;
            console.log(row);

            var query = {
                user_id: row[0],
                points: {$lt: row[3]}
            };
            var update = {points: row[3]};

            var mQ = Member.updateOne(query, update, function(errU, docsU) {
                if (errU)
                    console.log("Error updating member");
                else if (docsU.n)
                    console.log("Updated " + row[0] + " " + row[1]);
            });
        });
    });
}

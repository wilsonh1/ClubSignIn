'use strict';

const {google} = require('googleapis');

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
var Member = require('./models/member');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const key = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDExU6Jsdy6G7TH\nLuebzZp/fknAePwlh6fy8GRwCuBTwQzKrpmBNPFcuVc/V4HiOkNP4d36gQnqi9dF\n2psRpx09rW9LAyrQCtDUG6PhZXVXJDb3NLiQNSYA4FCCDFKsPTqK49oEk85y5cvj\nwpaSp3pLXP0fzMp6qpOVe5gkOVkdfH1wz1ILvD9XrgSSn3P3lJnvFEKkaylAnyCc\nDUji+8e0/XhZL2BBAzwIZcqSzkCAgXnwrlAtsm+ievPJS0S+uezQ3KjP7kK1hcbc\nCHmDsHxDaZ3ZjTmfgeOZWzvM6C/ASVkRjB8dSoyt9Q9DAOnAPQcu6Vi2PciCcjg7\nyx/G8RmRAgMBAAECggEAFe9HOiEAQaRTRoVvZt44b+gqbUjnVcEtqw6aaaWCvH9n\nj0P/o2g9FCiqhcp51XfId2QOsE04Z2OblaNA+EqsXyrhXket+vdLsGtc3URHvHUy\nZeQEA3pTQFOBEgAw6pegOimcbPhzkfoVHJB9Y7+E6dgFtQjplNtFPKuEihw094zu\nIA0jaZFB+ijqulOxbP3bvLVAEDaZ3MKewAhxxAaMXXAzQWkUn22k8/r6lLEFC0nk\nmgB6TeJ1fvNlhYEpOzHMojw6bI5YgY+j6/Sv4dCWuTlSNBvj+mLo6VaodMO3clSc\nhV23cxNzoXHn9EbV+8cwzpIOHAAX5ZAiL5rRYahniQKBgQDrUCfj35+TehTSI7rH\nkMaIXaV+yxnw4jFDwqTRxxij0BQaG/UIw4veu1v1kuQzcYP7o7IU+YhJo45nlwv8\nSR0ep6I9NxttbwcsL0mG6OV3qQKmOdPTnCTOqaqWjbmbaVxwPvCLfCNKR+oT5EIE\nIuugDs1u9FnbPRAeOUZEqrraeQKBgQDWEbwRErAUoSI3sanIIEYkt0hFbeIPwZoA\nYD7Leyvt+pvXPgkD65Ml02zHPonkrhFRSyorL5UfAzdKyBrAtrfyU7iJrcuSrYrE\nwZm8IxDoKi4maUDYDOPao/RD530rjPqx2iV+SamfvnblThl98dT7DF40j22ItInD\npEiThXLx2QKBgQCZPKudc2UBrwCcD/R0PU1sRD+foDeWbFZUoA6hJZxgIQLWNdqO\nCHmvZCdwdmXxMj0Ww/UWP6GHAuGbh/ugISS7b8LxRk+wJhtvpKOnHUdBc2hsQ0A0\nj3xQsKCMRmLWV/iAiBwxWXfJyacfqQdslikHJFyXorxZTxyN8hJWaTAhUQKBgQCd\n+paNDvqNLuEesul2PIMnY29ddZtIP3sUXfLZnfusc68AqNJkZzy/xIjZfYisD93N\n3aewGTx2l5v9fzFnGTElD633RSAgDhyD2dBHrKU0gLRwOmrVRqX829RPLI4OTstP\n54qV6WzZ6+i4jut3K7oez2DSbyrJoVqt3BaHcAuE+QKBgFlzi/X1u4jysqo8tX3c\naYTW5iCXXqyU2j3HMm11V8MDek7JF8c/8d4dV4ewkMtobQaQC6MwmUvQaky/Bsd8\nSJC4JY1tAUum7Wh20+86xqX9HMNi7BIWWwicWL1o7N8ZoiF8QHscgm4IT/iC3E+Y\nteIqmT73XrT87UKoAOR0iorj\n-----END PRIVATE KEY-----\n"

const jwt = new google.auth.JWT(process.env.CLIENT_EMAIL, null, key, SCOPES);

jwt.authorize((err, response) => {
    const sheets = google.sheets({version: 'v4', jwt});

    sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Sheet1!A2:A'
    }, (err, res) => {
        if (err)
            console.log(err);
        else {
            const rows = res.data.values;
            if (!rows)
                console.log("No data found");
            else {
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
                                spreadsheetId: process.env.SHEET_ID,
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
                                    spreadsheetId: process.env.SHEET_ID,
                                    range: 'Sheet1!' + process.env.SHEET_NXTCOL + ind[m['user_id']] + ':Z' + ind[m['user_id']],
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
});

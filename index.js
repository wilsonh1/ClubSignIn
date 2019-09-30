'use strict';

const
    request = require('request'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json());

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
var Member = require('./models/member');

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            entry.messaging.forEach(function(event) {
                if (event.message)
                    processMessage(event);
            });
        });
        res.status(200).send('EVENT_RECEIVED');
    }
    else {
        res.sendStatus(404);
    }
});

app.get("/", function (req, res) {
  res.send("Deployed!");
});

app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFICATION_TOKEN;

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        }
        else {
            res.sendStatus(403);
        }
    }
});

function processMessage (event) {
    if (!event.message.is_echo) {
        var senderId = event.sender.id;
        var message = event.message;
        var sent = event.timestamp;

        console.log("Received message from senderId: " + senderId);
        console.log("Message is: " + JSON.stringify(message));
        console.log("Message sent at: " + sent);

        //sendMessage(senderId, {text: message['text']});
        var str = message.text.split(" ");
        if (message.text == "sign in " + process.env.SIGNIN_KEY)
            updateMember(senderId);
        else if (str[0] == "update") {
            if (str[1] == "email")
                updateEmail(senderId, str[2]);
            else if (str[1] == "grade")
                updateGrade(senderId, str[2]);
        }
    }
}

function updateMember (senderId) {
    Member.create({user_id: senderId, points: 1, key: process.env.SIGNIN_KEY, first: true}, function(err, docs) {
        if (err) {
            var query = {user_id: senderId};
            var update = {
                $inc: {points: 1},
                key: process.env.SIGNIN_KEY,
                first: false
            }
            var mQ = Member.find({user_id: senderId}).select({"key": 1, "_id": 0}).lean();
            mQ.exec(function(errQ, docsQ) {
                if (errQ)
                    console.log(errQ);
                else {
                    var mObj = JSON.parse(JSON.stringify(docsQ));
                    if (mObj[0]['key'] == process.env.SIGNIN_KEY)
                        sendMessage(senderId, {text: "Already signed in for this week."});
                    else {
                        Member.updateOne(query, update, function(errU, docsU) {
                            if (errU)
                                console.log("Error updating member");
                            else {
                                sendMessage(senderId, {text: "(Y)"});
                                console.log("Updated " + senderId + " with " + process.env.SIGNIN_KEY);
                            }
                        });
                    }
                }
            });
        }
        else {
            setName(senderId);
            sendMessage(senderId, {text: "This is your first time signing in. Send \"update email [address]\" and \"update grade [#]\" to set your email address and grade level. These can be updated at any time."});
        }
    });
}

function setName (senderId) {
    request({
        url: "https://graph.facebook.com/v2.6/" + senderId,
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            fields: "name"
        },
        method: "GET"
    }, function (err, response, body) {
        if (err)
            console.log("Error getting user's name: " +  err);
        else {
            var bodyObj = JSON.parse(body);
            var name = bodyObj.name;
            Member.updateOne({user_id: senderId}, {name: name}, function(errU, docsU) {
                if (errU)
                    console.log("Error setting name: " + errU);
                else
                    console.log("Name " + senderId + " set to " + name);
            });
        }
    });
}

function updateEmail (senderId, email) {
    Member.updateOne({user_id: senderId}, {email: email}, function(errU, docsU) {
        if (errU)
            console.log("Error updating email: " + errU);
        else {
            sendMessage(senderId, {text: "Email updated."});
        }
    });
}

function updateGrade (senderId, grade) {
    Member.updateOne({user_id: senderId}, {grade: grade}, function(errU, docsU) {
        if (errU)
            console.log("Error updating grade: " + errU);
        else {
            sendMessage(senderId, {text: "Grade updated."});
        }
    });
}

function sendMessage (recipientId, message) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function (err, response, body) {
        if (err)
            console.log("Error sending messages: " + err);
    });
}

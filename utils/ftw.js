'use strict';

const request = require('request');

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
var Player = require('../models/player');
var Problem = require('../models/problem');

function getProblem (senderId) {
    Problem.estimatedDocumentCount(function(err, res) {
        if (err)
            console.log(err);
        else {
            if (!res) {
                sendMessage(senderId, {text: "No problems found."});
                return;
            }
            var rand = Math.floor(Math.random() * res);

            var pQ = Problem.findOne({p_id: rand}).select({statement: 1, image: 1, _id: 0}).lean();
            pQ.exec(function(errP, pObj) {
                if (errP)
                    console.log(errP);
                else {
                    sendMessage(senderId, {text: pObj['statement']}, function() {
                        var date = new Date().getTime();

                        Player.updateOne({user_id: senderId}, {p_id: rand, unix: date}, {upsert: true}, function(errU, docsU) {
                            if (errU)
                                console.log(errU);
                            else
                                console.log("Updated ftw player: " + senderId + " " + rand + " " + date);
                        });
                    });

                    if (pObj['image']) {
                        sendMessage(senderId, {
                            attachment: {
                                type: "image",
                                payload: {
                                    url: pObj['image'],
                                    is_reusable: true
                                }
                            }
                        });
                    }
                }
            });
        }
    });
}

function getAnswer (senderId, answer, sent) {
    var uQ = Player.findOne({user_id: senderId}).select({p_id: 1, unix: 1, _id: 0}).lean();
    uQ.exec(function(err, uObj) {
        if (err)
            console.log(err);
        else {
            if (!uObj || uObj['p_id'] == -1) {
                sendMessage(senderId, {text: "Next problem."});
                return;
            }

            if (!uObj['unix'] || sent < uObj['unix']) {
                sendMessage(senderId, {text: "Wait for problem statement."});
                return;
            }
            var diff = (sent - uObj['unix'])/1000;

            var pQ = Problem.findOne({p_id: uObj['p_id']}).select({answer: 1, _id: 0}).lean();
            pQ.exec(function(err2, pObj) {
                if (err2)
                    console.log(err2);
                else {
                    var upd = (pObj['answer'] == answer);
                    if (upd)
                        sendMessage(senderId, {text: "Correct ! " + diff + "s"});
                    else
                        sendMessage(senderId, {text: "Incorrect " + diff + "s"});

                    Player.updateOne({user_id: senderId}, {p_id: -1, unix: 0, $inc: {count: 1, correct: upd, time: diff}}, function(errU, docsU) {
                        if (errU)
                            console.log("Error updating player");
                        else
                            console.log("Updated player " + senderId + " " + upd);
                    });
                }
            });
        }
    });
}

function getStats (senderId) {
    var uQ = Player.findOne({user_id: senderId}).select({count: 1, correct: 1, time: 1, _id: 0}).lean();
    uQ.exec(function(err, uObj) {
        if (err)
            console.log(err);
        else {
            if (!uObj || !uObj['count'])
                sendMessage(senderId, {text: "Not found."});
            else {
                sendMessage(senderId, {text: "Number of questions answered: " + uObj['count']});
                sendMessage(senderId, {text: "Accuracy: " + ((uObj['correct']/uObj['count'])*100).toFixed(2) + "\%"});
                sendMessage(senderId, {text: "Average time: " + (uObj['time']/uObj['count']).toFixed(3) + "s"});
            }
        }
    });
}

function resetStats (senderId) {
    Player.deleteOne({user_id: senderId}, function(err, docs) {
        if (err)
            console.log(err);
        else {
            if (!docs.n)
                sendMessage(senderId, {text: "Not found."});
            else
                sendMessage(senderId, {text: "Reset FTW stats."});
        }
    });
}

function sendMessage (recipientId, message, callback) {
    request({
        url: "https://graph.facebook.com/v4.0/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message
        }
    }, function (err, response, body) {
        if (err)
            console.log("Error sending messages: " + err);
        else if (callback)
            callback();
    });
}

module.exports = {
    getProblem,
    getAnswer,
    getStats,
    resetStats
};

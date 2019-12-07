'use strict';

const request = require('request');

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
var Player = require('../models/player');
var Problem = require('../models/problem');
var Countdown = require('../models/countdown');

const inf = 1e18;

function getProblem (senderId) {
    var uQ = Player.findOne({user_id: senderId}).select({game_id: 1, _id: 0}).lean();
    uQ.exec(function(err, uObj) {
        if (err)
            console.log(err);
        else {
            if (uObj) {
                sendMessage(senderId, {text: "Currently in game."});
                return;
            }
            else {
                Problem.estimatedDocumentCount(function(err, res) {
                    if (err)
                        console.log(err);
                    else {
                        if (!res) {
                            sendMessage(senderId, {text: "No problems found."});
                            return;
                        }
                        var rand = Math.floor(Math.random() * res);
                        sendProblem(senderId, rand);
                    }
                });
            }
        }
    });
}

function sendProblem (senderId, pid) {
    var pQ = Problem.findOne({p_id: pid}).select({statement: 1, image: 1, _id: 0}).lean();
    pQ.exec(function(errP, pObj) {
        if (errP)
            console.log(errP);
        else {
            sendMessage(senderId, {text: pObj['statement']}, function() {
                var date = new Date().getTime();

                var update = {
                    p_id: pid,
                    unix: date
                };
                Player.updateOne({user_id: senderId}, update, {upsert: true}, function(errU, docsU) {
                    if (errU)
                        console.log(errU);
                    else
                        console.log("Updated ftw player: " + senderId + " " + pid + " " + date);
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

function getAnswer (senderId, answer, sent) {
    var uQ = Player.findOne({user_id: senderId}).select({p_id: 1, game_id: 1, unix: 1, _id: 0}).lean();
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
                    if (uObj['game_id'])
                        updateCowndown(uObj['game_id'], senderId, upd, diff);
                    else {
                        if (upd)
                            sendMessage(senderId, {text: "Correct ! " + diff + "s"});
                        else
                            sendMessage(senderId, {text: "Incorrect " + diff + "s"});
                    }

                    var update = {
                        p_id: -1,
                        unix: 0,
                        $inc: {count: 1, correct: upd, time: diff}
                    };
                    Player.updateOne({user_id: senderId}, update, function(errU, docsU) {
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

function deleteCountdown (id) {
    Countdown.deleteMany({game_id: {$in: id}}, function(errC, docsC) {
        if (err)
            console.log(err);
    });

    Player.updateMany({game_id: {$in: id}}, {game_id: -1}, function(errP, docsP) {
        if (err)
            console.log(err);
    });
}

function createCountdown (senderId, pcnt, tpp) {
    var date = new Date().getTime();
    var cQ = Countdown.find({created: {$lt: date - 24*60*60*1000}}).select({game_id: 1, _id: 0}).lean();
    cQ.exec(function(errF, gObj) {
        if (errF)
            console.log(errF);
        else {
            var id = gObj.map(row => Object.values(row)[0]);
            if (id.length) {
                console.log("Deleting " + id.length + " expired games");
                deleteCountdown(id);
            }
        }
    });

    if (tpp < 10) {
        sendMessage(senderId, {text: "Invalid time per problem (minimum 10 seconds)."});
        return;
    }
    Problem.estimatedDocumentCount(function(err, res) {
        if (err)
            console.log(err);
        else {
            if (!res || res < pcnt) {
                sendMessage(senderId, {text: "Invalid problem count (maximum " + res + ")."});
                return;
            }
            var plist = [];
            while (plist.length < pcnt) {
                var rand = Math.floor(Math.random() * res);
                if (plist.indexOf(rand) ==  -1)
                    plist.push(rand);
            }

            var cObj = {
                game_id: "",
                created: date,
                users: [senderId],
                problems: plist,
                tpp: tpp,
                unix: inf
            }
            setGameID(cObj, senderId);
        }
    })
}

function setGameID (cObj, senderId) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var gameId = "";
    for (var i = 0; i < 5; i++)
        gameId += chars[Math.floor(Math.random() * chars.length)];

    cObj['game_id'] = gameId;
    Countdown.create(cObj, function(errC, docsC) {
        if (errC)
            setGameID(cObj, senderId);
        else {
            console.log("Created game " + JSON.stringify(cObj));

            sendMessage(senderId, {text: "Game ID: " + cObj['game_id']});
            sendMessage(senderId, {text: "Problem count: " + cObj['problems'].length});
            sendMessage(senderId, {text: "Time per problem: " + cObj['tpp']});

            var update = {
                game_id: cObj['game_id'],
                points: 0
            }
            Player.updateOne({user_id: senderId}, update, {upsert: true}, function(errU, docsU) {
                if (errU)
                    console.log(errU);
            });
        }
    });
}

function joinCountdown (senderId, gameId) {
    console.log(senderId + " " + gameId);
    Countdown.updateOne({game_id: gameId}, {$addToSet: {users: senderId}}, function(err, docs) {
        if (err)
            console.log(err);
        else if (!docs.n)
            sendMessage(senderId, {text: "Game not found."});
        else {
            var update = {
                game_id: gameId,
                points: 0
            }
            Player.findOneAndUpdate({user_id: senderId}, update, {upsert: true}, function(errU, docsU) {
                if (errU)
                    console.log(errU);
                else {
                    if (docsU && docsU['game_id'] && docsU['game_id'] != -1)
                        sendMessage(senderId, {text: "Left game: " + docsU['game_id']});
                    sendMessage(senderId, {text: "Joined game: " + gameId});
                }
            });
        }
    });
}

function leaveCountdown (senderId) {
    Player.findOneAndUpdate({user_id: senderId}, {game_id: -1}, function(errU, uObj) {
        if (errU)
            console.log(errU);
        else {
            if (!uObj || !uObj['game_id'] || uObj['game_id'] == -1)
                sendMessage(senderId, {text: "Game not found."});
            else {
                Countdown.updateOne({game_id: uObj['game_id']}, {$pull: {users: senderId}}, function(errD, docsD){
                    if (errD)
                        console.log(errD);
                    else
                        sendMessage(senderId, {text: "Left game: " + uObj['game_id']});
                });
            }
        }
    });
}

function getCountdown (senderId) {
    var uQ = Player.findOne({user_id: senderId}).select({game_id: 1, _id: 0}).lean();
    uQ.exec(function(err, uObj) {
        if (err)
            console.log(err);
        else {
            if (!uObj || !uObj['game_id'] || uObj['game_id'] == -1)
                sendMessage(senderId, {text: "Game not found."});
            else {
                var cQ = Countdown.findOne({game_id: uObj['game_id']}).select({users: 1, problems: 1, tpp: 1, _id: 0}).lean();
                cQ.exec(function(errC, cObj) {
                    if (errC)
                        console.log(errC);
                    else {
                        sendMessage(senderId, {text: "Game ID: " + uObj['game_id']});
                        sendMessage(senderId, {text: "Problem count: " + cObj['problems'].length});
                        sendMessage(senderId, {text: "Time per problem: " + cObj['tpp']});
                        sendMessage(senderId, {text: "Players: " + cObj['users'].length});
                    }
                });
            }
        }
    });
}

function startCountdown (senderId) {
    var uQ = Player.findOne({user_id: senderId}).select({game_id: 1, _id: 0}).lean();
    uQ.exec(function(err, uObj) {
        if (err)
            console.log(err);
        else {
            if (!uObj || !uObj['game_id'] || uObj['game_id'] == -1)
                sendMessage(senderId, {text: "Game not found."});
            else
                setTimeout(function(){startQuestion(uObj['game_id'], 0);}, 3000);
        }
    });
}

function startQuestion (gameId, pind) {
    var cQ = Countdown.findOne({game_id: gameId}).select({users: 1, problems: 1, tpp: 1, _id: 0}).lean();
    cQ.exec(function(err, cObj) {
        if (err)
            console.log(err);
        else {
            console.log(gameId);
            console.log(JSON.stringify(cObj));
            if (!cObj['users'].length) {
                deleteCountdown([gameId]);
                return;
            }
            if (pind == cObj['problems'].length)
                endCountdown(gameId);
            else {
                cObj['users'].forEach(function(u) {
                    sendProblem(u, cObj['problems'][pind]);
                });
                setTimeout(function(){ endQuestion(gameId, pind); }, cObj['tpp'] * 1000);
            }
        }
    });
}

function endQuestion (gameId, pind) {
    Countdown.findOneAndUpdate({game_id: gameId}, {unix: inf}, function(err, cObj) {
        if (err)
            console.log(err);
        else {
            if (!cObj['users'].length) {
                deleteCountdown([gameId]);
                return;
            }

            Player.updateMany({user_id: {$in: cObj['users']}}, {p_id: -1, unix: 0}, function(errU, docsU) {
                if (errU)
                    console.log(errU);
            })

            cObj['users'].forEach(function(u) {
                sendMessage(u, {text: "Time up !"});
            });
            setTimeout(function(){ startQuestion(uObj['game_id'], pind + 1); }, 3000);
        }
    });
}

function endCountdown (gameId) {
    var uQ = Player.find({game_id: gameId}).sort({points: 1}).select({user_id: 1, points: 1, _id: 0}).lean();
    uQ.exec(function(err, uObj) {
        if (err)
            console.log(err);
        else {
            var rank = 0;
            uObj.forEach(function(u) {
                while (u['points'] < uObj[rank]['points'])
                    rank++;
                sendMessage(u['user_id'], {text: "Rank " + (rank + 1) + "with " + u['points'] + " points."});
            });

            deleteCountdown([gameId]);
        }
    });
}

function updateCountdown (gameId, senderId, upd, diff) {
    if (!upd) {
        sendMessage(senderId, {text: "Incorrect"  + diff + "s +0"});
        return;
    }

    var cQ = Countdown.findOne({game_id: gameId}).select({unix: 1, best: 1, _id: 0}).lean();
    cQ.exec(function(err, cObj) {
        if (err)
            console.log(err);
        else {
            if (cObj['unix'] <= diff) {
                sendMessage(senderId, {text: "Correct ! " + diff + "s +0"});
                sendMessage(senderId, {text: "Problem already answered " + (diff - cObj['unix']) + "s"});
            }
            else {
                if (cObj['unix'] != inf) {
                    sendMessage(cObj['best'], {text: "Sniped " + (cObj['unix'] - diff) + "s -1"});
                    Player.updateOne({user_id: cObj['best']}, {$inc: {points: -1}}, function(errU, docsU) {
                        if (errU)
                            console.log(errU);
                    });
                }

                sendMessage(senderId, {text: "Correct ! " + diff + "s +1"});
                Player.updateOne({user_id: senderId}, {$inc: {points: 1}}, function(errU, docsU) {
                    if (errU)
                        console.log(errU);
                });
                Countdown.updateOne({game_id: gameId}, {unix: diff, best: senderId}, function(errC, docsC) {
                    if (errC)
                        console.log(errC);
                });
            }
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
    createCountdown,
    joinCountdown,
    leaveCountdown,
    getCountdown,
    startCountdown,
    getStats,
    resetStats
};

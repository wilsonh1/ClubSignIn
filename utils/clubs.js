'use strict';

const request = require('request');

const mongoose = require('mongoose');
var db = mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const Club = require('../model/club');
const Member = require('../model/member');
const ftw = require('./ftw');

function callName (senderId, callback) {
    request({
        url: "https://graph.facebook.com/v4.0/" + senderId,
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
            callback(senderId, name);
        }
    });
}

// only person who can modify club metadata is club owner e.g. owner's sender id
function addClub(senderId) {
    // we will authenticate this club through previous approval on google sheets
    // confirmValidClub(senderId)

    callName(senderId, function (id, clubName) {
	Club.create({club_id: senderId, club_name: clubName}, function (err, res) { 
    	    if (err) console.log(err);
        });
    }
}

// operation is a callback which will allow operations for a select db
function grantAdminPermissions(senderId, operation) {
    Club.findOne({club_id: senderId}, function (err, doc) {
        if (err) console.log(err);
	else if (!doc) {
	    ftw.sendMessage(senderId, "You have not created club");
	} else {
	    operation(doc);
	}
    });
}

function setClubName(senderId, newName) {
    grantAdminPermissions(senderId, function (doc) {
        doc.club_name = newName;
        saveDoc(doc);
    });
}

function changeKey(senderId, newKey) {
   
}

function signInMember(senderId, key) {
    Club.findOne({key: key}, function (err, doc) {
    	if (err) console.log(err);
	else if (!doc) ftw.sendMessage(senderId, {text: "Please try again. No club has the key you just entered."});
	else {
	    User.findOne({user_id: senderId}, function (err, user) { 
	    	if (err) console.log(err);
		else {
		    if (!user.pointsPerClub.get(doc.club_name)) user.pointsPerClub.set(doc.club_name, 0);
		    user.pointsPerClub.set(doc.club_name, user.pointsPerClub.get(doc.club_name) + 5);
		    saveDoc(user);
		}
	    });
	}
    });    
}

function saveDoc(doc, callback = undefined) {
    doc.save(function (err, product) {
    	if (err) console.log(err);
	else if (callback) callback(doc);
    });
}

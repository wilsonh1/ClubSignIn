var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClubSchema = new Schema({
    // actual club name
    club_name: {type: String, unique: true},
    // club_id would be the sender id of club's facebook account, effectively an owner
    club_id: {type: String, unique: true},
    // will store an array of sender ids, use Member database to find corresponding info
    members: {type: [String]},
    // value is the sign in code for that particular week
    signinkeys: {type: String, default: "KEY"},
    // records the last sign in time
    lastUpdateTime: {type: Number, default: 0} 
});

module.exports = mongoose.model("Club", ClubSchema);

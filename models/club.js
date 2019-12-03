var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClubSchema = new Schema({
    // club_id would be the sender id of club's facebook account
    club_id: {type: String, unique: true},
    // will store an array of sender ids, use Member database to find corresponding info
    members: {type: [String]},
    // is a list of sign in keys, the key is the timestamp which it was updated converted into string
    // value is the sign in code for that particular week
    signinkeys: {type: Map, of: String},
    // records the last sign in time
    lastUpdateTime: {type: Number, default: 0} 
});

module.exports = mongoose.model("Club", ClubSchema);

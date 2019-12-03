var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MemberSchema = new Schema({
    user_id: {type: String, unique: true},
    name: String,
    email: String,
    grade: Number,
    points: Number,
    pointsPerClub: {type: Map, of: Number},
    key: String,
    first: Boolean
});

module.exports = mongoose.model("Member", MemberSchema);

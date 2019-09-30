var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MemberSchema = new Schema({
    user_id: {type: String, unique: true},
    name: String,
    email: String,
    grade: Number,
    points: Number
});

module.exports = mongoose.model("Member", MemberSchema);

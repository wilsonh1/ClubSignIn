var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
    user_id: {type: String, unique: true},
    p_id: Number,
    game_id: String,
    unix: Number,
    count: Number,
    correct: Number,
    time: Number,
    points: Number
});

module.exports = mongoose.model("Player", PlayerSchema);

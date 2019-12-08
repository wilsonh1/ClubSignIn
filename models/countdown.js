var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CountdownSchema = new Schema({
    game_id: {type: String, unique: true},
    created: Number,
    users: [String],
    problems: [Number],
    tpp: Number,
    launched: Boolean,
    unix: Number,
    best: String
});

module.exports = mongoose.model("Countdown", CountdownSchema);

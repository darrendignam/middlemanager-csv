var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var quote = new mongoose.Schema({
    created: { type: Date, default: Date.now },
    updated: Date,

    expires: { type: Date, default: () => Date.now() + (24*60*60*1000 * 5 )}, //default expirtion 5 days

    site:{type: String, trim: true},
    sizecode:{type: String, trim: true},

    pricePerMonth: Number,
    pricePerWeek: Number,

    terms:{type: String, trim: true},
});

module.exports = mongoose.model('quote', quote);

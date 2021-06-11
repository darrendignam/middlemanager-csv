var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var order = new mongoose.Schema({
    created: { type: Date, default: Date.now },
    updated: Date,

    OrderID:{type: String, trim: true},
    order:{},

    site:{type: String, trim: true},
    sizecode:{type: String, trim: true},

    pricePerMonth: Number,
    pricePerWeek: Number,

    owner_id: Schema.ObjectId,

    terms:{type: String, trim: true},
});

module.exports = mongoose.model('order', order);

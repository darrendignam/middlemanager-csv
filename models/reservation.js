var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reservation = new mongoose.Schema({
    created: { type: Date, default: Date.now },
    updated: Date,

    ReservationID : {type: String, trim: true},
    reservation:{},

    site:{type: String, trim: true},
    sizecode:{type: String, trim: true},

    pricePerMonth: Number,
    pricePerWeek: Number,

    owner_id: Schema.ObjectId,

    terms:{type: String, trim: true},
});

module.exports = mongoose.model('reservation', reservation);

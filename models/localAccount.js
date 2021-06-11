var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var LocalAccount = new Schema({

    spacemanager: {},
    CustomerID : {type: String, trim: true, default:''},

    oauthID: String,   /* used for social media logins */
    oauthProvider: String,
    username:
    {type: String, lowercase: true, trim: true, required: true, unique: true, minlength:5,maxlength:100,
        match : [
            new RegExp('^[a-z0-9_.-]+$', 'i'),
            '{PATH} \'{VALUE}\' is not valid. Use only letters, numbers, underscore or dot.'
        ]
    },
    password: {type: String, trim: true, minlength:5},
    email: {type: String, lowercase: true, trim: true, required: true, unique: true, minlength:5,maxlength:100,
        match : [
            new RegExp('[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,20}', 'i'),
            '{PATH} \'{VALUE}\' is not a valid email address.'
        ]
    },

    role:String, //should default to user, not admin

    nickname: {type: String, trim: true},
    name: {type: String, trim: true},
    surname: {type: String, trim: true},
    salt:String,
    hash:String,
    created: Date,
    updated:{ type: Date, default: Date.now },

    profile_pic:{type: String, trim: true, default:'/img/blankavatar.png'},

    address1:{type: String, trim: true},
    address2:{type: String, trim: true},
    address3:{type: String, trim: true},
    address4:{type: String, trim: true},
    addressZip:{type: String, trim: true},
    phonenumber:{type: String, trim: true},
    terms:{type: String, trim: true}, /*  Terms and conditions they agreed to  */
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    oauthProfile: {},


    // ref to an array of orders
    quotes:[{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'quote' 
    }],
    reservations:[{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'reservation' 
    }],
    orders:[{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'order' 
    }],
    
    stripeResponse: {},//store the complete stripe user object here

});

LocalAccount.plugin(passportLocalMongoose);

module.exports = mongoose.model('LocalAccount', LocalAccount);

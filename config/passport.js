var LocalStrategy = require('passport-local').Strategy;
var LocalAccount = require('../models/localAccount');

// load the auth variables
// var configAuth = require('./auth');//put the google / facebook keys and tokens in auth.js
// var sendgridEmail = require('./sendgrid_email');

module.exports = function(passport) {

  passport.use(new LocalStrategy(LocalAccount.authenticate()));
  // serialize and deserialize users 
  passport.serializeUser(function(user, done) {
    //console.log('serializeUser: ' + user._id);
    done(null, user._id);
  });
  passport.deserializeUser(function(id, done) {
    //console.log("=+= deserialize");
    LocalAccount.findById(id, function(err, user){
      //console.log("=+= deserialize USER: "+user);
        if(!err) done(null, user);
        else done(err, null);
      });
  });


}; //module exports
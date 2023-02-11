//jshint esversion:6
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passpotLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');


mongoose.set('strictQuery', true);

const app = express();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false

}));

//Passport initialization
app.use(passport.initialize());
//Telling passport to use session module
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secrets:[String]
});

//Add the passpotLocalMongoose module as a plugin to the schema
userSchema.plugin(passpotLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

//Establish a link between passport and the authentication fields in the schema
passport.use(User.createStrategy()); 

passport.serializeUser(function(user, cb) {

    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {

    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//-------------------------------------------POST-------------------------------------------
app.post("/register", (req, res)=>{

    User.register({username:req.body.username, active: false}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate('local')(req, res, function() {
              res.redirect('/secrets');
            });
        }
    });
});

app.post("/login", (req, res)=>{

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //passport.authenticate() middleware invokes req.login() automatically.
    //This function is primarily used when users sign up, during which req.login() can be invoked to automatically log in the newly registered user.
    passport.authenticate('local', { failureRedirect: '/register' })(req, res, function() {
        res.redirect('/secrets');
    });

});

app.post("/submit", (req, res)=>{
  const secret = req.body.secret;

  User.updateOne({ username: req.user.username }, 
    { $push: {secrets: secret} }, function(err){
      if(!err){
        console.log("A new secret has been saved!");
        res.redirect("/secrets");
      }else{
        console.log("Failed to save the secret");
       
      }
  });
});

//-------------------------------------------GET-------------------------------------------
app.get("/", (req, res)=>{
    res.render("home");
});


//The first call passport.authenticate is to initiate the OpenID authentication 
//(which is what passport-google uses under the hood) and the second call (for the return URL) 
//is used by the OpenID Provider to respond to the prior authentication request. 
//The Passport Strategy reads the relevant assertion from the second request and processes it accordingly -- 
//eventually leading to either a redirection to /login if the assertion failed or a redirection to / if the 
//assertion succeeded.

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
  });

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }
        res.redirect("/");
    });
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/secrets", (req, res)=>{
  
    if(req.isAuthenticated()){
        User.findOne({username: req.user.username}, (err, foundUser)=>{
          if(err){
            console.log(err);
          }else{
            res.render("secrets", {h_secrets: foundUser.secrets});
          }
        }); 
    }else{
        res.redirect("/");
    }
});

app.get("/submit", (req, res)=>{
  if(req.isAuthenticated()){
      res.render("submit");
  }else{
      res.redirect("/");
  }
});




app.listen(process.env.port, ()=>{
    console.log("Server started on port 3000");
});
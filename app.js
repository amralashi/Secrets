//jshint esversion:6
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passpotLocalMongoose = require("passport-local-mongoose");


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
    email: String,
    password: String
});

//Add the passpotLocalMongoose module as a plugin to the schema
userSchema.plugin(passpotLocalMongoose);

const userModel = mongoose.model('User', userSchema);

//Establish a link between passport and the authentication fields in the schema
passport.use(userModel.createStrategy()); 

//Generates a function that is used by Passport to serialize users into the session
passport.serializeUser(userModel.serializeUser());
//Generates a function that is used by Passport to deserialize users into the session
passport.deserializeUser(userModel.deserializeUser());
//-------------------------------------------POST-------------------------------------------
app.post("/register", (req, res)=>{

    userModel.register({username:req.body.username, active: false}, req.body.password, function(err, user) {
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

    const user = new userModel({
        username: req.body.username,
        password: req.body.password
    });

    //passport.authenticate() middleware invokes req.login() automatically.
    //This function is primarily used when users sign up, during which req.login() can be invoked to automatically log in the newly registered user.
    passport.authenticate('local', { failureRedirect: '/register' })(req, res, function() {
        res.redirect('/secrets');
    });

});

//-------------------------------------------GET-------------------------------------------
app.get("/", (req, res)=>{
    res.render("home");
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
        res.render("secrets");
    }else{
        res.redirect("/");
    }
});




app.listen(process.env.port, ()=>{
    console.log("Server started on port 3000");
});
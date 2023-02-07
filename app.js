//jshint esversion:6
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

var md5 = require('md5');

mongoose.set('strictQuery', true);

const app = express();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



const userModel = mongoose.model('User', userSchema);

//-------------------------------------------POST-------------------------------------------
app.post("/register", (req, res)=>{
    const newUser = new userModel({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save((err)=>{
        if(!err){
            console.log('User has been added!');
            res.render('secrets');
        }else{
            console.log(err);
        }
    });
});

app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = md5(req.body.password);

    userModel.findOne(
        {email: username}, (err, foundUser)=>{
            if(foundUser){

                if(foundUser.password === password){
                    res.render('secrets');
                }else{
                    res.send("Wrong password!");
                }
                
            }else{
                res.send("This user is not registered!");
            }
         });
});


//-------------------------------------------GET-------------------------------------------
app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});




app.listen(process.env.port, ()=>{
    console.log("Server started on port 3000");
});
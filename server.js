'use strict';
require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var validUrl = require('valid-url');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
var connection = mongoose.createConnection(process.env.MONGO_URI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

// Auto Increment
const autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(connection);

// Setting up Schema and Model
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  url: {type: String, required: true},  
});
urlSchema.plugin(autoIncrement.plugin, 'Url');
var Url = connection.model('Url', urlSchema);

// My Endpoint
app.post("/api/shorturl/new", async function(req, res) {
  // Validate URL
  if (validUrl.isUri(req.body.url)) {
    // Check if request url already exists in DB
    let result = await Url.findOne({url: req.body.url}, function(err, data) {
      if (err) return console.error(err);
      return data;
    });
    // If url is found in DB do not create a new one, return the existing one
    if (result !== null) {
      res.json({original_url: result.url, short_url: result._id});
    } else {
      // Create URL document when req.url does not exist in DB
      let myUrl = new Url({url: req.body.url});
      myUrl.save(function(err, data) {
        if (err) return console.error(err);    
        res.json({original_url: data.url, short_url: data._id});      
      });
    }  
  } else {
    res.json({error: "invalid URL"});
  }  
});
  
// GET URL
app.get("/api/shorturl/:url", function (req, res) {
  Url.findById(req.params.url, function(err, data) {
    if (err) return console.error(err);
    res.redirect(data.url);
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
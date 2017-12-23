//Checks to see whether /new/ is included in the path
function checkNew(param) {
  var arr = param.split("/");
  if(arr[0] == "new") {  
    arr.shift();
  }
  return arr.join("/");
}
//Determines whether a string is a URL
function isURL(str) {
  var bool = false;
  var regex = /https\:\/\/|http\:\/\//;
  if(str.search(regex) == 0 ) {
    var arr = str.split("/");
    if(arr[2].search(/\./g) > -1 ) {
      bool = true;      
    }
  }
  return bool;
}
//Determines whether an integer string is a shortCode
function isShortCode(code) {
  var bool = false;
  var int = parseInt(code);
  if( !isNaN(int)) {
    if( int >= 1000 && int <= 9999 ) {
       bool = true; 
    }
  }
  return bool;
}
//Inserts the new URL into the databse with a new random (and unique) shortCode
function updateDb(output,req,res){
  mongo.connect(dbURL, function(err,db) {
    if(err) {  res.send(err); }
    
    var code = getShortCode();
    var doc = { shortCode : code, url: output.origin_url };
    
    db.collection("urls").insertOne(doc).then(function (result) {
      output.short_url = req.protocol + "://" + req.get("host") + "/" + code.toString();
      res.send(output);
      db.close();
    }).catch( function(err) {
      res.send(err);
      db.close();
    });
    
    function getShortCode() {
      var code = Math.floor(Math.random() * 8999 + 1000);
      var dbResults = db.collection("urls").find( { shortUrl: code } ).toArray();
      
      if(dbResults.length > 0 ) {
        return getShortCode(); 
      }
      else {
        return code; 
      }
    }
  });
}
//Retrieves URL based on Code from dbase
//Redirects the browser to the url
function retrieveURLFromCode(code,req,res) {
  mongo.connect(dbURL, function(err,db) {
    if(err) { res.send(err); }
    
    db.collection("urls").find( 
      { shortCode : code} 
      ).toArray( function (err, results) {
      if(err) { res.send(err);}
      
      if(results.length > 0 ) {
         res.redirect(results[0].url); 
      } else {
        res.send("No URL found.");
      }
      db.close();
    });
  });
}

var express = require('express');
var app = express();
var url = require("url");
var mongo = require("mongodb").MongoClient;
var dbURL = "mongodb://short-url-microservice:c4rr07qu33n@ds163796.mlab.com:63796/short-url"

app.use(express.static('public'));


app.get("/*", function (req,res) {
    if(req.params[0].length >= 1 ) {
      if( isURL(checkNew(req.params[0]))) {        
        var longURL = checkNew(req.params[0]);
        var shortCode = 0;
        var result = {"origin_url": longURL,"short_url": 0 };
        
        updateDb(result,req,res);
        
      } else if ( isShortCode(req.params[0]) ) {
       
        retrieveURLFromCode(parseInt(req.params[0]),req,res);
        
      } else {
        res.send("Either your input url is invalid or the short-url code is not between 1000-9999"); 
      }
    } else {
      res.sendFile(__dirname + "/views/index.html"); 
    }
});

/*
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});
*/

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

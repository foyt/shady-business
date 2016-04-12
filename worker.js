var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var config = require('./config.json');

var foursquare = require('node-foursquare')({
  'secrets' : {
    'clientId' : config.foursquareClientId,
    'clientSecret' : config.foursquareClientSecret,
    'redirectUrl' : 'REDIRECT_URL'
  }
});

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);

  var app = require('express')();
  app.set('view engine', 'jade');
  app.set('views', './views');
  app.use(serveStatic(path.resolve(__dirname, 'public')));

  var httpServer = worker.httpServer;
  var scServer = worker.scServer;
  
  app.get('/', function(req, res) {
    res.render('index', { 
      googleMapsApiKey: config.googleMapsApiKey
    });
  });

  httpServer.on('request', app);

  scServer.on('connection', function (socket) {
    socket.on('searchPlaces', function (data) {
      foursquare.Venues.search(data.latitude, data.longitude, null, {}, null, function (err, results) {
        if (err) {
          // todo: handle err
        } else {
          socket.emit('discoveredPlaces', results);
        }
      });
      
    });
    
  });
};

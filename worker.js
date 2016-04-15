var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var config = require('./config.json');
var places = require('./places/places.js');

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
      places.search(data.latitude, data.longitude, function (err, places) {
        if (err) {
          // todo: handle err
        } else {
          console.log(JSON.stringify(places));
          socket.emit('discoveredPlaces', places);
        }
      });
    });
    
  });
};

var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var config = require(__dirname + '/config.json');
var Places = require(__dirname + '/places/places.js');
var Scanner = require(__dirname + '/scanner/scanner.js');
var PlacePersister = require(__dirname + '/places/persister.js');
var PlaceIndexer = require(__dirname + '/places/indexer.js');
var Logger = require(__dirname + '/logger/logger.js');
  
module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);

  var app = require('express')();
  app.set('view engine', 'jade');
  app.set('views', './views');
  app.use(serveStatic(path.resolve(__dirname, 'public')));

  var httpServer = worker.httpServer;
  var scServer = worker.scServer;
  var scanner = new Scanner();
  var placePersister = new PlacePersister();
  var placeIndexer = new PlaceIndexer();
  var places = new Places();
  
  app.get('/', function(req, res) {
    res.render('index', { 
    });
  });

  httpServer.on('request', app);

  scServer.on('connection', function (socket) {
    
    socket.on('player:screen-move', function (data) {
      places.search(data.topLeft, data.bottomRight, function (err, places) {
        if (err) {
          // todo: handle err
          console.error(err);
        } else {
          socket.emit('places:near', { places: places } );
        }
      });
    });
    
  });
};

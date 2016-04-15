(function() {
  'use strict';
  var config = require('../config.json');
  var _ = require("underscore");
  var async = require('async');

  var elasticsearch = require('elasticsearch');
  var client = new elasticsearch.Client({
    host: config.elasticSearchHost,
    log: 'trace'
  });
  
  function indexPlaces(places, mainCallback) {
    var calls = _.map(places, function (place) {
      return function (callback) {
        indexPlace(place, callback);
      };
    });
    
    async.parallel(calls, mainCallback);
  }
  
  function indexPlace(place, callback) {
    client.index({
      index: 'shadybussiness',
      type: 'place',
      id: place.source + '-' + place.id,
      body: place
    }, function (err, response) {
      callback(err, response);
    });
  }
  
  module.exports = {
    indexPlace: indexPlace,
    indexPlaces: indexPlaces
  };
  
}).call(this);
(function() {
  'use strict';
  var config = require('../config.json');
  var _ = require("underscore");
  var async = require('async');

  var elasticsearch = require('elasticsearch');
  var client = new elasticsearch.Client({
    host: config.elasticSearchHost
  });
  
  function indexExists(callback) {
    client.indices.exists({
      index: 'shadybussiness'
    }, callback);
  }
  
  function createIndex(callback) {
    client.indices.create({
      index: 'shadybussiness'
    }, callback);
  }
  
  function updateMapping() {
    client.indices.putMapping({
      index: 'shadybussiness',
      type: 'place',
      body : {
        properties : {
          location: {
            type : "geo_point"
          }
        }
      }
    });
  }
  
  function prepareIndex() {
    indexExists(function (err, exists) {
      if (err) {
        console.err(err);
      } else {
        if (!exists) {
          createIndex(function () {
            updateMapping();
          });
        } else {
          updateMapping();
        }
      }
    });
  }
  
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
      body: {
        name: place.name,
        description: place.description,
        tags: place.tags,
        location: [place.location.latitude, place.location.longitude]
      }
    }, function (err, response) {
      callback(err, response);
    });
  }
  
  prepareIndex();
  
  module.exports = {
    indexPlace: indexPlace,
    indexPlaces: indexPlaces
  };
  
}).call(this);
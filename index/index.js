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
            type : "geo_point",
            "fielddata" : {
              "precision" : "1m"
            }
          }
        }
      }
    });
  }
  
  function prepareIndex() {
    indexExists(function (err, exists) {
      if (err) {
        console.error(err);
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
      id: place.id,
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
  
  function searchPlacesNear(latitude, longitude, callback) {
    client.search({
      index: 'shadybussiness',
      type: 'place',
      body: {
        query: {
          filtered: {
            filter: {
              geo_distance: {
                "distance": '10km',
                "location": [latitude, longitude]
              }
            }
          }
        }
      }
    }).then(function (response) {
      callback(null, response);
    }).catch(function (error) {
      callback(error);
    });
  }
  
  prepareIndex();
  
  module.exports = {
    indexPlace: indexPlace,
    indexPlaces: indexPlaces,
    searchPlacesNear: searchPlacesNear
  };
  
}).call(this);
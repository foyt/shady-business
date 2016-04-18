(function() {
  'use strict';
  
  var _ = require("underscore");
  var async = require("async");
  var db = require(__dirname + "/../db/db.js");
  var index = require(__dirname + "/../index/index.js");
  var FoursquarePlaceProvider = require(__dirname + '/foursquare/foursquareplaceprovider.js');
  
  var placeProviders = [
    new FoursquarePlaceProvider()
  ];

  class Places {
    
    constructor() {
      
    }
    
    _searchFromIndex (latitude, longitude, callback) {
      index.searchPlacesNear(latitude, longitude, function (err, response) {
        if (err) {
          callback(err);
        } else {
          if (response && response.hits) {
            var ids =_.pluck(response.hits.hits, '_id');
            db.Places.load(ids, function (err, places) {
              callback(err, places);
            });
          }
        }
      });
    }
    
    _searchFromProviders (latitude, longitude, callback) {
      var calls = _.map(placeProviders, function (placeProvider) {
        return function (providerPallback) {
          placeProvider.search(latitude, longitude, providerPallback);
        }
      });
      
      async.parallel(calls, function (err, results) {
        if (err) {
          callback(err);
        } else {
          callback(null, _.flatten(results, true));
        }
      });
    }
    
    search (latitude, longitude, mainCallback) {
      this._searchFromIndex(latitude, longitude, function (indexErr, searchResults) {
        if (indexErr) {
          mainCallback(indexErr);
        } else {
          if (searchResults && searchResults.length) {
            mainCallback(null, searchResults);
          } else {
            this._searchFromProviders(latitude, longitude, function (providerErr, providerResults) {
              if (providerErr) {
                mainCallback(providerErr);
              } else {
                mainCallback(null, providerResults);
              }
            });
          }
        }
      }.bind(this));
    }
    
  };
  
  module.exports = new Places();

}).call(this);
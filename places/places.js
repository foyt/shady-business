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
    
    _searchFromIndex (topLeft, bottomRight, callback) {
      index.searchPlaces(topLeft, bottomRight, function (err, response) {
        if (err) {
          callback(err);
        } else {
          if (response && response.hits) {
            var ids = _.pluck(response.hits.hits, '_id');
            db.Places.load(ids, function (err, places) {
              callback(err, places);
            });
          } else {
            callback(null, []);
          }
        }
      });
    }
    
    _searchFromProviders (topLeft, bottomRight, callback) {
      var calls = _.map(placeProviders, function (placeProvider) {
        return function (providerPallback) {
          placeProvider.search(topLeft, bottomRight, providerPallback);
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
    
    search (topLeft, bottomRight, mainCallback) {
      this._searchFromIndex(topLeft, bottomRight, function (indexErr, searchResults) {
        if (indexErr) {
          mainCallback(indexErr);
        } else {
          if (searchResults && searchResults.length) {
            mainCallback(null, searchResults);
          } else {
            this._searchFromProviders(topLeft, bottomRight, function (providerErr, providerResults) {
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
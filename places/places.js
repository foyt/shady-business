(function() {
  'use strict';
  
  var _ = require("underscore");
  var async = require("async");
  var db = require(__dirname + "/../db/db.js");
  var index = require(__dirname + "/../index/index.js");

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
    
    search (topLeft, bottomRight, mainCallback) {
      this._searchFromIndex(topLeft, bottomRight, function (indexErr, searchResults) {
        if (indexErr) {
          mainCallback(indexErr);
        } else {
          if (searchResults && searchResults.length) {
            mainCallback(null, searchResults);
          } else {
            mainCallback(null, []);
          }
        }
      }.bind(this));
    }
    
  };
  
  module.exports = Places;

}).call(this);
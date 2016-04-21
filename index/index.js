(function() {
  'use strict';
  
  var config = require('../config.json');
  var _ = require("underscore");
  var async = require('async');
  var elasticsearch = require('elasticsearch');

  var Index = class {
    
    constructor() {
      this._client = new elasticsearch.Client({
        host: config.elasticSearchHost
      });
      
      this._prepareIndex();
    }
    
    _indexExists (callback) {
      this._client.indices.exists({
        index: 'shadybusiness'
      }, callback);
    } 
    
    _createIndex(callback) {
      this._client.indices.create({
        index: 'shadybusiness'
      }, callback);
    }
    
    _updateMapping() {
      this._client.indices.putMapping({
        index: 'shadybusiness',
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
    
    _prepareIndex() {
      this._indexExists(function (err, exists) {
        if (err) {
          console.error(err);
        } else {
          if (!exists) {
            this._createIndex(function () {
              this._updateMapping();
            }.bind(this));
          } else {
            this._updateMapping();
          }
        }
      }.bind(this));
    }
    
    indexPlaces(places, mainCallback) {
      var calls = _.map(places, function (place) {
        return function (callback) {
          this.indexPlace(place, callback);
        }.bind(this);
      }.bind(this));
      
      async.parallel(calls, mainCallback);
    }
    
    indexPlace(place, callback) {
      this._client.index({
        index: 'shadybusiness',
        type: 'place',
        id: place.id,
        body: {
          name: place.name,
          description: place.description,
          tags: place.tags,
          location: [place.location.latitude, place.location.longitude]
        }
      }, function (err, response) {
        callback(err, {
          place: place,
          response: response 
        });
      });
    }
    
    searchPlacesNear(latitude, longitude, callback) {
      this._client.search({
        index: 'shadybusiness',
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
    
    searchPlaces(topLeft, bottomRight, callback) {
      this._client.search({
        index: 'shadybusiness',
        type: 'place',
        body: {
          "query": {
            "filtered": {
              "filter": {
                "geo_bounding_box": {
                  "location": {
                    "top_left" : [topLeft.latitude, topLeft.longitude],
                    "bottom_right" : [bottomRight.latitude, bottomRight.longitude]
                  }
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
  }
  
  module.exports = new Index();
  
}).call(this);
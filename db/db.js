(function() {
  'use strict';

  var cassandra = require('cassandra-driver');
  var async = require('async');
  var util = require('util');
  var config = require('../config.json');
  var _ = require("underscore");
  var client = new cassandra.Client({contactPoints: config.cassandraContactPoints, keyspace: config.cassandraKeyspace });
  
  var findCategory = function (source, id, callback) {
    client.execute(util.format("select * from Category WHERE source='%s' and id='%s'", source, id), function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows.length > 0 ? result.rows[0] : null);
      }
    });
  };
  
  var createCategory = function (source, id, name, icon, callback) {
    var query = util.format("insert into Category (uuid, source, id, name, icon) values (uuid(), ?, ?, ?, ?)");
    client.execute(query, [source, id, name, icon], callback);
  };

  var updateCategory = function (source, id, name, icon, callback) {
    var query = util.format("update Category set name = ?, icon = ? where source = ? and id = ?");
    client.execute(query, [name, icon, source, id], callback);
  };
  
  var findPlace = function (source, id, callback) {
    client.execute(util.format("select * from Place WHERE source = ? and id = ?"), [source, id], function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows.length > 0 ? result.rows[0] : null);
      }
    });
  };
  
  var loadCategoryUuid = function (source, id, callback) {
    client.execute(util.format("select uuid from Category WHERE source = ? and id = ?"), [source, id], function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows.length > 0 ? result.rows[0].uuid : null);
      }
    });
  }
  
  var createPlace = function (source, id, name, url, description, categories, tags, locationLatitude, locationLongitude, 
      locationAccurate, locationStreetAddress, locationCrossStreet, locationCity, locationState, 
      locationPostalCode, locationCountry, priceLevel, priceMessage, mainCallback) {
    
    var categoryLoads = _.map(categories, function (category) {
      return function (callback) {
        loadCategoryUuid(category.source, category.id, callback);
      };
    });
    
    async.parallel(categoryLoads, function (err, categoryUuids) {
      if (err) {
        callback(err);
      } else {
        var data = {
          id: id,
          source: source,
          name: name,
          description: description,
          url: url,
          categories: categoryUuids,
          tags: tags,
          locationLatitude: locationLatitude,
          locationLongitude: locationLongitude,
          locationAccurate: locationAccurate,
          locationStreetAddress: locationStreetAddress,
          locationCrossStreet: locationCrossStreet,
          locationCity: locationCity,
          locationState: locationState,
          locationPostalCode: locationPostalCode,
          locationCountry: locationCountry,
          priceLevel: priceLevel,
          priceMessage: priceMessage,
        };
        
        var columns = _.keys(data);
        var query = util.format('insert into Place (uuid, %s) values (uuid(), %s)', columns, _.times(columns.length, function () { return '?'; }).join(','));

        client.execute(query, _.values(data), mainCallback);
      }
    });
  };
  
  var updatePlace = function (source, id, name, url, description, categories, tags, locationLatitude, locationLongitude, 
      locationAccurate, locationStreetAddress, locationCrossStreet, locationCity, locationState, 
      locationPostalCode, locationCountry, priceLevel, priceMessage, mainCallback) {
    
    var categoryLoads = _.map(categories, function (category) {
      return function (callback) {
        loadCategoryUuid(category.source, category.id, callback);
      };
    });
    
    async.parallel(categoryLoads, function (err, categoryUuids) {
      if (err) {
        callback(err);
      } else {
        var data = {
          name: name,
          description: description,
          url: url,
          categories: categoryUuids,
          tags: tags,
          locationLatitude: locationLatitude,
          locationLongitude: locationLongitude,
          locationAccurate: locationAccurate,
          locationStreetAddress: locationStreetAddress,
          locationCrossStreet: locationCrossStreet,
          locationCity: locationCity,
          locationState: locationState,
          locationPostalCode: locationPostalCode,
          locationCountry: locationCountry,
          priceLevel: priceLevel,
          priceMessage: priceMessage,
        };
        
        var columns = _.map(_.keys(data), function (key) {
          return key + ' = ?';
        });
        
        var query = util.format('update Place set (%s) where source = ? and id = ?', columns.join(','));

        client.execute(query, _.union(_.values(data), [source, id]), mainCallback);
      }
    });
  };
  
  module.exports = {
    persistPlaces: function (places, mainCallback) {
      var categories = _.flatten(_.map(places, function (place) {
        return place.categories;
      }), true);
      
      this.persistCategories(categories, function (err) {
        if (err) {
          mainCallback(err);
        } else {
          var operations = _.map(places||[], function (place) {
            return function (callback) {
              findPlace(place.source, place.id, function (err, row) {
                if (err) {
                  callback(err);
                } else {
                  if (row) {
                    updatePlace(place.source, place.id, place.name, place.url, place.description, place.categories, place.tags, 
                        place.location.latitude, place.location.longitude, place.location.accurate, 
                        place.location.streetAddress, place.location.crossStreet, place.location.city, 
                        place.location.state, place.location.postalCode, place.location.country, 
                        place.location.priceLevel, place.location.priceMessage, callback);
                  } else {
                    createPlace(place.source, place.id, place.name, place.url, place.description, place.categories, place.tags, 
                        place.location.latitude, place.location.longitude, place.location.accurate, 
                        place.location.streetAddress, place.location.crossStreet, place.location.city, 
                        place.location.state, place.location.postalCode, place.location.country, 
                        place.location.priceLevel, place.location.priceMessage, callback);
                  }
                }
              });
            };
          });
          
          async.parallel(operations, function (err, results) {
            mainCallback(err, results);
          });
        }
      });
    },
      
    persistCategories: function (categories, mainCallback) {
      var operations = _.map(categories||[], function (category) {
        return function (callback) {
          findCategory(category.source, category.id, function (err, row) {
            if (err) {
              callback(err);
            } else {
              if (row) {
                updateCategory(category.source, category.id, category.name, category.icon, callback);
              } else {
                createCategory(category.source, category.id, category.name, category.icon, callback);
              }
            }
          });
        };
      });
      
      async.parallel(operations, mainCallback);
    }
  
  };
  
}).call(this);
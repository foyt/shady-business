(function() {
  'use strict';

  var cassandra = require('cassandra-driver');
  var async = require('async');
  var util = require('util');
  var config = require('../config.json');
  var _ = require("underscore");
  var client = new cassandra.Client({contactPoints: config.cassandraContactPoints, keyspace: config.cassandraKeyspace });
  
  var loadCategoryBySourceAndId = function (source, id, callback) {
    client.execute(util.format("select * from Category WHERE source='%s' and id='%s'", source, id), function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows.length > 0 ? result.rows[0] : null);
      }
    });
  };
  
  var createCategory = function (source, id, name, icon, callback) {
    var query = util.format("insert into Category (source, id, name, icon) values ('%s', '%s', '%s', '%s')", source, id, name, icon);
    console.log("Create: " + query);
    client.execute(query, callback);
  };

  var updateCategory = function (source, id, name, icon, callback) {
    var query = util.format("update Category set name = '%s', icon = '%s' where source = '%s' and id = '%s'", name, icon, source, id);
    console.log("Update: " + query);
    client.execute(query, callback);
  };

  module.exports = {
    persistCategories: function (categories, mainCallback) {
      var operations = _.map(categories||[], function (category) {
        return function (callback) {
          loadCategoryBySourceAndId(category.source, category.id, function (err, row) {
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
(function() {
  'use strict';
  
  var _ = require("underscore");
  var async = require("async");
  var FoursquarePlaceProvider = require(__dirname + '/foursquare/foursquareplaceprovider.js');
  
  var placeProviders = [
    new FoursquarePlaceProvider()
  ];

  class Places {
    
    constructor() {
      
    }
    
    search (latitude, longitude, mainCallback) {
      var calls = _.map(placeProviders, function (placeProvider) {
        return function (providerPallback) {
	      placeProvider.search(latitude, longitude, providerPallback);
        }
      });
      
      async.parallel(calls, function (err, results) {
        if (err) {
          mainCallback(err);
        } else {
          mainCallback(null, _.flatten(results, true));
        }
      });
    }
    
  };
  
  module.exports = new Places();

}).call(this);
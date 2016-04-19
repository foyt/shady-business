(function() {
  'use strict';

  var _ = require("underscore");
  var config = require(__dirname + '/../../config.json');
  var db = require(__dirname + '/../../db/db.js');
  var index = require(__dirname + '/../../index/index.js');
  var model = require(__dirname + '/../../model/model.js');
  var PlaceProvider = require(__dirname + '/../placeprovider.js');
  
  var foursquare = require('node-foursquare')({
    'secrets' : {
      'clientId' : config.foursquareClientId,
      'clientSecret' : config.foursquareClientSecret,
      'redirectUrl' : 'REDIRECT_URL'
    }
  });
  
  class FoursquarePlaceProvider extends PlaceProvider {
     
    search (topLeft, bottomRight, callback) {
      foursquare.Venues.search(null, null, null, {
        limit: 50,
        intent: 'browse',
        sw: [bottomRight.latitude, topLeft.longitude].join(','),
        ne: [topLeft.latitude,  bottomRight.longitude].join(',')
      }, null, function (err, results) {
        if (err) {
          callback(err);
        } else {
          var places = _.map(results.venues, function (venue) {
            if (venue && venue.location) {
              var categories = _.map(venue.categories, function (category) {
                return new model.Category('foursquare-' + category.id, category.name, category.icon.prefix + 'bg_32' + category.icon.suffix);
              });
              
              var location = new model.Location(
                  venue.location.lat, 
                  venue.location.lng, 
                  !venue.location.isFuzzed, 
                  venue.location.address, 
                  venue.location.crossStreet, 
                  venue.location.city, 
                  venue.location.state, 
                  venue.location.postalCode, 
                  venue.location.country);
                  
              var priceLevel = null;
              if (venue.price && venue.price.tier) {
                switch (venue.price.tier) {
                  case 1: 
                    priceLevel = 'CHEAP';
                  break;
                  case 2: 
                    priceLevel = 'MID';
                  break;
                  case 3: 
                    priceLevel = 'PRICY';
                  break;
                  case 4: 
                    priceLevel = 'LUXURY';
                  break;
                }
              }
              
              return new model.Place('foursquare-' + venue.id, 
                  venue.name, 
                  venue.description, 
                  venue.tags, 
                  categories, 
                  venue.url, 
                  location, 
                  priceLevel,
                  venue.price ? venue.price.message : null
              );
            } else {
              return null;
            }
          });
        
          db.Places.persist(places, function (err, places) { 
            if (err) {
              console.error(err);
            } else {
              index.indexPlaces(places);
            }
          });
          
          callback(null, places);
        }
      })
    }
  }

  module.exports = FoursquarePlaceProvider;

}).call(this);
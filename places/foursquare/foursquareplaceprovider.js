(function() {
  'use strict';

  var _ = require("underscore");
  var config = require(__dirname + '/../../config.json');
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

    search (latitude, longitude, callback) {
      
      foursquare.Venues.search(latitude, longitude, null, {}, null, function (err, results) {
        if (err) {
          callback(err);
        } else {
          callback(null, _.map(results.venues, function (venue) {
            if (venue && venue.location) {
              var categories = _.map(venue.categories, function (category) {
                return new model.Category('foursquare', category.id, category.name, category.icon.prefix + 'bg_32' + category.icon.suffix);
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
              
              return new model.Place('foursquare', 
                  venue.id, 
                  venue.name, 
                  venue.description, 
                  venue.tags, 
                  categories, 
                  venue.url, 
                  location, 
                  venue.price ? venue.price.tier : null,
                  venue.price ? venue.price.message : null
              );
            } else {
              return null;
            }
          }));
        }
      })
    }
  }

  module.exports = FoursquarePlaceProvider;

}).call(this);
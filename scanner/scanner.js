(function() {
  'use strict';

  var _ = require("underscore");
  var WorldScanner = require('worldscanner');
  var model = require(__dirname + '/../model/model.js');
  var config = require(__dirname + '/../config.json');
  var ServerEvents = require(__dirname + '/../serverevents/serverevents.js');
    
  var Scanner = class {
    
    constructor() {
      this._serverEvents = new ServerEvents(); 
    
      this._worldScanner = new WorldScanner({
	    client_id: config.foursquareClientId,
	    client_secret: config.foursquareClientSecret
	  });
	  
	  this._worldScanner.on('error', this._onError.bind(this));
      this._worldScanner.on('scannerPaused', this._onScannerPaused.bind(this));
      this._worldScanner.on('scannerResumed', this._onScannerResumed.bind(this));
      this._worldScanner.on('areaScanned', this._onAreaScanned.bind(this));
      this._worldScanner.on('areaSplit', this._onAreaSplit.bind(this));
      this._worldScanner.on('venueDiscovered', this._onVenueDiscovered.bind(this));
      
      this._worldScanner.scan({ lat: 69, lng: 31 }, { lat: 60, lng: 20 }, 1);
    }
   
    _onError(err) {
      this._serverEvents.trigger("world-scanner:error", err);
    } 
     
    _onScannerPaused (resumes) {
      this._serverEvents.trigger("world-scanner:paused", {
        resumes: resumes
      });
    }
    
    _onScannerResumed () {
      this._serverEvents.trigger("world-scanner:resumed", {
      });
    }
    
    _onAreaScanned (area) {
      this._serverEvents.trigger("world-scanner:area-scanned", {
        area: area
      });
    }
    
    _onAreaSplit (newSize) {
      this._serverEvents.trigger("world-scanner:area-split", {
        newSize: newSize
      });
    }
    
    _onVenueDiscovered (venue) {
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
	    
	    var place = new model.Place('foursquare-' + venue.id, 
          venue.name, 
          venue.description, 
          venue.tags, 
          categories, 
          venue.url, 
          location, 
          priceLevel,
          venue.price ? venue.price.message : null
        );
    
        this._serverEvents.trigger("world-scanner:place-discovered", {
          original: venue,
          place: place
        });
      }
    }
  
  }
  
  module.exports = Scanner;

}).call(this);
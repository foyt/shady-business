(function() {
  'use strict';

  var util = require('util');
  var ServerEvents = require(__dirname + '/../serverevents/serverevents.js');
    
  var Logger = class {
    
    constructor() {
      this._serverEvents = new ServerEvents(); 
      
      this._serverEvents.on("place-persister:error", this._onPlacePersisterError.bind(this));
      this._serverEvents.on("place-indexer:error", this._onPlaceIndexerError.bind(this));
    }
    
    _onPlacePersisterError (event, data) {
      console.error(data.err, util.format("Failed to persis a place %s", data.place.id));
    }
    
    _onPlaceIndexerError (event, data) {
      console.error(data.err, util.format("Failed to index a place %s", data.place.id));
    }
  }
  
  module.exports = Logger;

}).call(this);
(function() {
  'use strict';

  var ServerEvents = require(__dirname + '/../serverevents/serverevents.js');
  var db = require(__dirname + '/../db/db.js');
    
  var PlacePersister = class {
    
    constructor() {
      this._serverEvents = new ServerEvents(); 
      
      this._serverEvents.on("world-scanner:area-scanned", this._onScannerAreaScanned.bind(this));
      this._serverEvents.on("world-scanner:place-discovered", this._onScannerPlaceDiscovered.bind(this));
    }

    _onScannerAreaScanned (event, data) {
    }
    
    _onScannerPlaceDiscovered (event, data) {
      db.Places.persist([data.place], function (err, places) { 
        if (err) {
          this._serverEvents.trigger("place-persister:error", {
            err: err,
            place: places[0]
          });
        } else {
          this._serverEvents.trigger("place-persister:place-persisted", {
            place: places[0]
          });
        }
      }.bind(this));
    }
  }
  
  module.exports = PlacePersister;

}).call(this);
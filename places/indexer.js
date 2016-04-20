(function() {
  'use strict';

  var ServerEvents = require(__dirname + '/../serverevents/serverevents.js');
  var index = require(__dirname + '/../index/index.js');
    
  var PlaceIndexer = class {
    
    constructor() {
      this._serverEvents = new ServerEvents(); 
      
      this._serverEvents.on("place-persister:place-persisted", this._onPlacePersisted.bind(this));
    }
    
    _onPlacePersisted (event, data) {
      index.indexPlace(data.place, function (err, data) {
        if (err) {
          this._serverEvents.trigger("place-indexer:error", {
            err: err,
            place: data.place
          });
        } else {
          this._serverEvents.trigger("place-indexer:place-indexed", {
            place: data.place
          });
        }
      }.bind(this));
    }
  }
  
  module.exports = PlaceIndexer;

}).call(this);
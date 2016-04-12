(function() {
  'use strict';
  
  $.widget("custom.client", {
    _create : function() {
      this._connected = false;
      this._latitude = null;
      this._longitude = null;
      
      this._socket = socketCluster.connect();
      
      this._socket.on('connect', $.proxy(this._onSocketConnect, this));
      this._socket.on('discoveredPlaces', $.proxy(this._onDiscoveredPlaces, this));

      $(document).on("geoLocationChange", $.proxy(this._onGeoLocationChange, this));
    },
    
    _onSocketConnect: function (event) {
      console.log("CONNECTED!");
      this._connected = true;
    },
    
    _onDiscoveredPlaces: function (data) {
      console.log(data);
    },
    
    _onGeoLocationChange: function (event, data) {
      if (this._connected) {
        if ((data.coords.latitude != this._latitude) && (this._longitude != data.coords.longitude)) {
          this._latitude = data.coords.latitude;
          this._longitude = data.coords.longitude;
          
          this._socket.emit('searchPlaces', {
            latitude: this._latitude,
            longitude: this._longitude
          });
        }
      }
    }
  });
  
  $(document).ready(function () {
    navigator.geolocation.watchPosition(function(position) {
      $(document).trigger("geoLocationChange", {
        coords: position.coords
      });
    });
    
    $(document.body).client();
  });

}).call(this);
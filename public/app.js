(function() {
  'use strict';
  
  $.widget("custom.map", {
    _create : function() {
      this._map = new google.maps.Map(this.element[0], {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 6
      });
      
      $(document).on("geoLocationChange", $.proxy(this._onGeoLocationChange, this));
      $(document).on("discoveredPlaces", $.proxy(this._onDiscoveredPlaces, this));
    },
    
    _onDiscoveredPlaces: function (event, data) {
      console.log(data.venues);
      
      $.each(data.venues, $.proxy(function (index, venue) {
        if (venue.categories.length) {
          var icon = venue.categories[0].icon.prefix + 'bg_32' + venue.categories[0].icon.suffix;
          
          var marker = new google.maps.Marker({
            position: { lat: venue.location.lat, lng: venue.location.lng },
            map: this._map,
            animation: google.maps.Animation.DROP,
            title: venue.name,
            icon: icon
          });
        }
      }, this));
    },
    
    _onGeoLocationChange: function (event, data) {
      this._map.setCenter({
        lat: data.coords.latitude,
        lng: data.coords.longitude
      });
      
      this._map.setZoom(15);
    }
  });  
  
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
      $(document).trigger("discoveredPlaces", data);
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
    
    $('#map').map();
    
    $(document.body).client();
  });

}).call(this);
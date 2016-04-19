(function() {
  'use strict';
  
  $.widget("custom.map", {
    options: {
      followInterval: 1,
      changeInterval: 500
    },
    
    _create : function() {
      this._map = new google.maps.Map(this.element[0], {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15
      });
      
      this._center = null;
      this._northEast = null;
      this._southWest = null;
      this._current = null;
      
      this._map.addListener("bounds_changed", $.proxy(this._onBoundsChanged, this));
      this._map.addListener("dragend", $.proxy(this._onDragEnd, this));
      navigator.geolocation.watchPosition($.proxy(this._onGeoLocationChange, this));
      $(document).on("discoveredPlaces", $.proxy(this._onDiscoveredPlaces, this));
    },
    
    _onDiscoveredPlaces: function (event, data) {
      $.each(data.places, $.proxy(function (index, place) {
        if (place.categories.length) {
          var marker = new google.maps.Marker({
            position: { lat: place.location.latitude, lng: place.location.longitude },
            map: this._map,
            animation: google.maps.Animation.DROP,
            title: place.name,
            icon: place.categories[0].icon
          });
        }
      }, this));
    },
    
    _onGeoLocationChange: function (position) {
      var current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      if (!this._current || this._getDistance(current, this._current) > this.options.followInterval) {
        this._current = current;
        
        this._map.setCenter({
          lat: current.latitude,
          lng: current.longitude
        });
      }
    },
    
    _convertLatLng: function (latLng) {
      return {
        latitude: latLng.lat(),
        longitude: latLng.lng()
      };
    },
    
    _getDistance: function (l1, l2) {
      return geolib.getDistance(l1, l2);
    },
    
    _triggerLocationChange: function () {
      var bounds = this._map.getBounds();
      var center = this._convertLatLng(bounds.getCenter());
      var northEast = this._convertLatLng(bounds.getNorthEast());
      var southWest = this._convertLatLng(bounds.getSouthWest());
      var data = {
        center: center,
        northEast: northEast,
        southWest: southWest,
        topLeft: {
          latitude: northEast.latitude,
          longitude: southWest.longitude
        },
        bottomRight: {
          latitude: southWest.latitude,
          longitude: northEast.longitude
        }
      };
      
      if (this._center) {
        data.centerChange = this._getDistance(this._center, center);
      }

      if (this._northEast) {
        data.northEastChange = this._getDistance(this._northEast, northEast);
      }

      if (this._southWest) {
        data.southWestChange = this._getDistance(this._southWest, southWest);
      }
      
      
      
      var hasChanges = data.southWestChange && data.northEastChange && data.centerChange;
      var maxChange = Math.max(data.southWestChange, data.northEastChange, data.centerChange);
      
      if (!hasChanges || maxChange > this.options.changeInterval) {
        this._center = center;
        this._northEast = northEast;
        this._southWest = southWest;
        
        $(document).trigger("mapLocationChange", data);
      }
    },
    
    _onBoundsChanged: function () {
      this._triggerLocationChange();
    },
    
    _onDragEnd: function (event) {
      this._triggerLocationChange();
    }
  });  
  
  $.widget("custom.client", {
    _create : function() {
      this._connected = false;
      this._knownPlaceIds = [];
      
      this._socket = socketCluster.connect();
      
      this._socket.on('connect', $.proxy(this._onSocketConnect, this));
      this._socket.on('discoveredPlaces', $.proxy(this._onDiscoveredPlaces, this));
      $(document).on("mapLocationChange", $.proxy(this._onMapLocationChange, this));
    },
    
    _onSocketConnect: function (event) {
      console.log("CONNECTED!");
      this._connected = true;
    },
    
    _onDiscoveredPlaces: function (places) {
      var newPlaces = _.filter(places, $.proxy(function (place) {
        return _.indexOf(this._knownPlaceIds, place.id) == -1;
      }, this));
      
      this._knownPlaceIds = this._knownPlaceIds.concat(_.pluck(newPlaces, "id"));
      
      $(document).trigger("discoveredPlaces", {
        places: newPlaces
      });
    },
    
    _onMapLocationChange: function (event, data) {
      this._socket.emit('searchPlaces', {
        topLeft: data.topLeft,
        bottomRight: data.bottomRight
      });
    }
  });
  
  $(document).ready(function () {
    $('#map').map();
    
    $(document.body).client();
  });

}).call(this);
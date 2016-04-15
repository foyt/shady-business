(function() {
  'use strict';
  
  var Category = class {
    constructor(source, id, name, icon) {
      this.source = source;
      this.id = id;
      this.name = name;
      this.icon = icon;
    }
  }
  
  var Location = class {
    constructor(latitude, longitude, accurate, streetAddress, crossStreet, city, state, postalCode, country) {
      this.latitude = latitude;
      this.longitude = longitude;
      this.accurate = accurate;
      this.streetAddress = streetAddress;
      this.crossStreet = crossStreet;
      this.city = city;
      this.state = state;
      this.postalCode = postalCode;
      this.country = country;
    }
  }
  
  var Place = class {
    constructor(source, id, name, description, tags, categories, url, location, priceLevel, priceMessage) {
      this.source = source;
      this.id = id;
      this.name = name; 
      this.description = description; 
      this.tags = tags; 
      this.categories = categories; 
      this.url = url;
      this.location = location;
      this.priceLevel = priceLevel; 
      this.priceMessage = priceMessage;
    }
  };
  
  module.exports = {
    Category: Category,    
    Location: Location,
    Place: Place
  };
  
}).call(this);
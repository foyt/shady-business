CREATE KEYSPACE shadybussiness WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };
USE shadybussiness;

DROP TABLE IF EXISTS Place;
DROP TABLE IF EXISTS Category;

create table Category (
  uuid uuid,
  id text,
  source text,
  name text,
  icon text,  
  PRIMARY KEY (source,id)
);

create index category_uuid on Category (uuid);

create table Place (
  uuid uuid,
  id text,
  source text,
  name text,
  description text,
  url text,
  categories list<uuid>,
  tags list<text>,
  locationLatitude double,
  locationLongitude double,
  locationAccurate boolean,
  locationStreetAddress text,
  locationCrossStreet text,
  locationCity text,
  locationState text,
  locationPostalCode text,
  locationCountry text,
  priceLevel int,
  priceMessage text,
  PRIMARY KEY (source,id)
);

create index place_uuid on Place (uuid);

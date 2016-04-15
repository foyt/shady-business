CREATE KEYSPACE shadybussiness WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };
USE shadybussiness;
create table Category (
  id text,
  source text,
  name text,
  icon text,
  PRIMARY KEY (source,id)
);


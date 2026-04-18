CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE  TABLE "public".ubicaciones ( 
    id_ubicacion         uuid DEFAULT gen_random_uuid() NOT NULL  ,
    id_padre_ubicacion   uuid    ,
    nombre_ubicacion     varchar(200)  NOT NULL  ,
    codigo_ubicacion     varchar(50)  NOT NULL  ,
    longitud_ubicacion   decimal(9,6)  NOT NULL  ,
    latitud_ubicacion    decimal(9,6)  NOT NULL  ,
    CONSTRAINT ubicaciones_pkey PRIMARY KEY ( id_ubicacion )
 );

CREATE INDEX idx_ubicaciones_padre ON "public".ubicaciones USING  btree ( id_padre_ubicacion );

CREATE UNIQUE INDEX idx_ubicaciones_codigo ON "public".ubicaciones ( codigo_ubicacion );

CREATE INDEX idx_ubicaciones_nombre ON "public".ubicaciones USING  btree ( nombre_ubicacion );

ALTER TABLE "public".ubicaciones ADD CONSTRAINT fk_ubicaciones_padre FOREIGN KEY ( id_padre_ubicacion ) REFERENCES "public".ubicaciones( id_ubicacion ) ON DELETE RESTRICT ON UPDATE CASCADE;
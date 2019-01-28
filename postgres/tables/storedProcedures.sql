-- Procedimiento almacenado Funcion para actualizar base de datos
-- DROP FUNCTION updatedb
-- (text);
CREATE OR REPLACE FUNCTION updateDB
(_path text) RETURNS text AS $body$
DECLARE
		err_context text;
        _path ALIAS FOR $1;
BEGIN
    --     DROP TABLE temporal;

    CREATE TABLE temporal
    (
        id_bs serial PRIMARY KEY,
        no int NOT NULL,
        cod_est varchar(10) NOT NULL,
        est varchar(50) NOT NULL,
        provincia varchar(50) NOT NULL,
        canton varchar(50) NOT NULL,
        parroquia varchar(50) NOT NULL,
        dir varchar(250),
        lat varchar(20) NOT NULL,
        lon varchar(20) NOT NULL,
        cell_id varchar(20) NOT NULL,
        tecnologia varchar(10) not null,
        clasificacion_d varchar(20),
        lat_dec NUMERIC NOT NULL,
        lon_dec NUMERIC NOT NULL,
        operadora varchar(10) NOT NULL,
        id_tec int,
        id_den int,
        id_operadora int,
        id_estado int DEFAULT 1,
        geom geometry
    );

    EXECUTE 'COPY temporal
    (no,cod_est,est,provincia,canton,parroquia,dir,lat,lon,cell_id,tecnologia,clasificacion_d,lat_dec,lon_dec,operadora,geom)
        FROM '''
    ||_path||''' 
		WITH DELIMITER ''|'' CSV HEADER QUOTE E''\`'' ';

UPDATE TEMPORAL
        SET ID_TEC=TECNOLOGIA.ID_TEC
            FROM TECNOLOGIA
                WHERE TEMPORAL.TECNOLOGIA=TECNOLOGIA.TECNOLOGIA;
UPDATE TEMPORAL
        SET ID_DEN=DENSIDAD.ID_DEN
            FROM DENSIDAD
                WHERE UPPER(TEMPORAL.CLASIFICACION_D)=UPPER(DENSIDAD.DENSIDAD);
UPDATE TEMPORAL
        SET ID_OPERADORA=OPERADOR.ID_OPERADORA
            FROM OPERADOR
                WHERE UPPER(TEMPORAL.OPERADORA)=UPPER(OPERADOR.OPERADORA);
UPDATE TEMPORAL
        SET GEOM=ST_SetSRID(ST_MakePoint(lon_dec,lat_dec),4326);

UPDATE RADIOBASE SET
        NUM = TEMPORAL.NO,
        DIR = TEMPORAL.DIR,
        NOM_SIT = TEMPORAL.EST,
        PROVINCIA=TEMPORAL.PROVINCIA,
        CANTON=TEMPORAL.CANTON,
        PARROQUIA=TEMPORAL.PARROQUIA,
        LAT=TEMPORAL.LAT,
        LONG=TEMPORAL.LON,
        LAT_DEC=TEMPORAL.LAT_DEC,
        LONG_DEC=TEMPORAL.LON_DEC,
        GEOM=TEMPORAL.GEOM,
        ID_DEN1=TEMPORAL.ID_DEN,
        ID_TEC1=TEMPORAL.ID_TEC
        FROM TEMPORAL
            WHERE RADIOBASE.COD_EST = TEMPORAL.COD_EST
    AND RADIOBASE.CELL_ID=TEMPORAL.CELL_ID;

INSERT INTO RADIOBASE
    (NUM,COD_EST,DIR,NOM_SIT,PARROQUIA,CANTON,PROVINCIA,LAT,LONG,CELL_ID,LAT_DEC,LONG_DEC,GEOM,ID_ESTADO1,ID_DEN1,ID_TEC1,ID_OPERADORA2)
SELECT NO, COD_EST, DIR, EST, PARROQUIA, CANTON, PROVINCIA, LAT, LON, CELL_ID, LAT_DEC, LON_DEC, GEOM, ID_ESTADO, ID_DEN, ID_TEC, ID_OPERADORA
FROM TEMPORAL
WHERE  NOT EXISTS
                                (SELECT *
FROM RADIOBASE
WHERE  RADIOBASE.COD_EST = TEMPORAL.COD_EST
    AND RADIOBASE.CELL_ID = TEMPORAL.CELL_ID
                                );

UPDATE RADIOBASE
        SET NOM_SIT=RBUPDATED.nom_sit,
            DIR=RBUPDATED.dir,
            LAT=RBUPDATED.lat,
            LONG=RBUPDATED.long,
            LAT_DEC=RBUPDATED.lat_dec,
            LONG_DEC=RBUPDATED.long_dec,
            GEOM=RBUPDATED.geom
        FROM RBUPDATED
            WHERE RADIOBASE.id_bs=RBUPDATED.id_bs;

DROP TABLE TEMPORAL;

RETURN 'Completada carga de archivo: '||_path;
EXCEPTION 
    when others then
        GET STACKED DIAGNOSTICS err_context = PG_EXCEPTION_CONTEXT;
        RAISE INFO 'Error Name:%',SQLERRM;
        RAISE INFO 'Error State:%', SQLSTATE;
        RAISE INFO 'Error Context:%', err_context;
return 'Error';
END;
$body$ LANGUAGE plpgsql;

-- Trigger para guardar actualizados

CREATE TABLE rbUpdated
(
    fechaactualizacion timestamp
    with time zone,
	id_bs int,
	nom_sit varchar
    (50) NOT NULL,
	dir varchar
    (250),
	lat varchar
    (20) NOT NULL,
	long varchar
    (20) NOT NULL,
	lat_dec NUMERIC NOT NULL,
	long_dec NUMERIC NOT NULL,
	geom geometry
);

    CREATE OR REPLACE FUNCTION backup_rbupdated
    () RETURNS TRIGGER AS $insertar$
    DECLARE
    BEGIN
        INSERT INTO rbupdated
        VALUES
            (LOCALTIMESTAMP, OLD.id_bs, NEW.nom_sit , NEW.dir, NEW.lat, NEW.long, NEW.lat_dec, NEW.long_dec, NEW.geom);
        RETURN NULL;
    END;
    $insertar$ LANGUAGE plpgsql;
    CREATE TRIGGER insertar_radiobases_actualizadas AFTER
    UPDATE
    ON radiobase FOR EACH ROW
    EXECUTE PROCEDURE backup_rbupdated
    ();

    CREATE OR REPLACE FUNCTION updateDB
    (_path text) RETURNS text AS $$
    BEGIN
        RETURN _path||'ok';
    END;
    $$ LANGUAGE plpgsql;
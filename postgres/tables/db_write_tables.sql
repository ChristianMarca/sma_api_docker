BEGIN TRANSACTION;

--Densidad
INSERT INTO densidad(densidad)
SELECT *
FROM (SELECT UPPER(TRIM(clasificacion_d))
		AS clasificacion_d FROM rbtodo)
			as clasificacion_d
				GROUP BY clasificacion_d
					HAVING COUNT(*)>1
						ORDER BY clasificacion_d;

--Tecnologia
INSERT INTO tecnologia(tecnologia)
SELECT *
FROM (SELECT UPPER(TRIM(tecnologia))
		AS tecnologia FROM rbtodo)
			as tacnologia
				GROUP BY tecnologia
					HAVING COUNT(*)>1
						ORDER BY tecnologia;

--rbtodo
INSERT INTO radiobase(num,cod_est,dir,nom_sit,parroquia,canton,provincia,lat,long,cell_id,lat_dec,long_dec
					  ,geom,id_estado1,id_den1,id_tec1,id_operadora2)
 SELECT no as num,cod_est,direccion as dir, est as nom_sit,parroquia,canton,provincia, lat, lon as long
 	, cell_id,lat_dec, lon_dec as long_dec, geom ,id_estado as id_estado1, id_den as id_den1, id_tec as id_tec1,
	id_operadora as id_operadora2
    FROM (
		SELECT *
		  FROM (SELECT UPPER(TRIM(rbtodo.parroquia)) AS parroquia
			  , UPPER(TRIM(rbtodo.canton)) AS canton
			  , UPPER(TRIM(rbtodo.provincia)) AS provincia  					  
			  ,rbtodo.id,rbtodo.no,rbtodo.cod_est, rbtodo.est
			  ,rbtodo.direccion,rbtodo.lat, rbtodo.lon, rbtodo.cell_id, rbtodo.lat_dec
			  , rbtodo.lon_dec, rbtodo.geom,rbtodo.tecnologia as tec,rbtodo.status
			  ,rbtodo.clasificacion_d, rbtodo.operadora, id_operadora, id_estado,id_den,id_tec
			FROM rbtodo
			LEFT OUTER JOIN estado ON estado.estado=REPLACE(rbtodo.status,'ACTIVE','ACTIVO')
			LEFT OUTER JOIN densidad ON densidad.densidad=rbtodo.clasificacion_d
			LEFT OUTER JOIN tecnologia ON tecnologia.tecnologia=rbtodo.tecnologia
  			LEFT OUTER JOIN OPERADOR ON OPERADOR.OPERADORA=rbtodo.operadora
			WHERE
				OPERADOR.OPERADORA IS NOT NULL OR rbtodo.OPERADORA IS NOT NULL 
 				OR rbtodo.status IS NOT NULL OR estado.estado IS NOT NULL
				OR rbtodo.clasificacion_d IS NOT NULL OR densidad.densidad IS NOT NULL 
				OR rbtodo.tecnologia IS NOT NULL OR tecnologia.tecnologia IS NULL
 			ORDER BY provincia
			) AS H) AS G;

COMMIT TRANSACTION;
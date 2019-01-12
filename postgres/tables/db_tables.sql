BEGIN TRANSACTION;

CREATE TABLE ROL
(
	id_rol INT PRIMARY KEY,
	rol_type VARCHAR(10) CHECK(rol_type IN('OPERADOR','ARCOTEL','ADMIN')),
	issysadmin boolean NOT NULL DEFAULT false,
	CONSTRAINT roles_superkey UNIQUE(id_rol,rol_type)
);

INSERT INTO ROL
	(ID_ROL,ROL_TYPE,ISSYSADMIN)
VALUES
	(1, 'ARCOTEL', FALSE),
	(2, 'OPERADOR', FALSE),
	(3, 'ADMIN', TRUE);

CREATE TABLE causa
(
	id_causa serial PRIMARY KEY,
	causa varchar(50)
);

CREATE TABLE estado
(
	id_estado serial PRIMARY KEY,
	estado varchar(10) NOT NULL DEFAULT 'ACTIVO'
);

INSERT INTO estado
	(estado)
VALUES
	('ACTIVO'),
	('REVISION'),
	('INACTIVO');

CREATE TABLE estado_interrupcion
(
	id_estado_int serial PRIMARY KEY,
	estado_int varchar(25) NOT NULL
);

INSERT INTO estado_interrupcion
	(estado_int)
VALUES
	('EN REVISION'),
	('AUTORIZADO'),
	('NEGADO'),
	('REPORTE INCOMPLETO'),
	('COMPLETADO');

CREATE TABLE densidad
(
	id_den serial PRIMARY KEY,
	densidad varchar(10) NOT NULL
);

CREATE TABLE tecnologia
(
	id_tec serial PRIMARY KEY,
	tecnologia varchar(10) NOT NULL
);

CREATE TABLE tipo_interrupcion
(
	id_tipo serial PRIMARY KEY,
	tipo varchar(10) NOT NULL
);

INSERT INTO TIPO_INTERRUPCION
	(ID_TIPO,TIPO)
VALUES
	(1, 'PROGRAMADA'),
	(2, 'FORTUITA');

CREATE TABLE SERVICIO
(
	id_servicio SERIAL PRIMARY KEY,
	servicio varchar(10)
);

INSERT INTO SERVICIO
	(servicio)
VALUES
	('VOZ'),
	('SMS'),
	('DATOS');

CREATE TABLE usuario
(
	id_user serial PRIMARY KEY,
	email text UNIQUE NOT NULL,
	nombre varchar(100) NOT NULL DEFAULT 'name',
	apellido varchar(100) DEFAULT 'last',
	username varchar(100) NOT NULL DEFAULT 'user',
	telefono VARCHAR(15),
	id_rol1 int,
	FOREIGN KEY (id_rol1) REFERENCES rol (id_rol)
);

CREATE TABLE login
(
	id_login serial PRIMARY KEY,
	hash varchar(100) NOT NULL,
	email text UNIQUE NOT NULL,
	id_user1 int,
	FOREIGN KEY (id_user1) REFERENCES usuario (id_user)
);

CREATE TABLE data_operador
(
	id_data_operador int PRIMARY KEY,
	operador_name VARCHAR(15) UNIQUE NOT NULL,
	RUC VARCHAR(13) UNIQUE NOT NULL,
	representante VARCHAR(100) NOT NULL,
	direccion VARCHAR(250) NOT NULL,
	cuidad VARCHAR(15) NOT NULL,
	telefono VARCHAR(15) NOT NULL,
	tipo_servicio VARCHAR(50) NOT NULL,
	fecha_autorizacion VARCHAR(25) NOT NULL
);

INSERT INTO DATA_OPERADOR
	(id_data_operador,operador_name,RUC,representante,direccion,cuidad,telefono,tipo_servicio,fecha_autorizacion)
VALUES
	(1, 'OTECEL S.A', '1791256115001', 'DONOSO ECHANIQUE ANDRES FRANCISCO', 'Vía a Nayón, complejo ECOPARK, Torre 3.', 'QUITO', '(02) 2227700', 'Servicios de telecomunicaciones: SMA', '20 de noviembre de 2008.'),
	(2, 'CONECEL S.A', '1791251237001', 'CAMPOS GARCIA MARCO ANTONIO', 'Av. Francisco de Orellana, Mz. 105 y Alberto Borges', 'Guayaquil', '(04) 5004040', 'Servicio Movil Avanzado', '26 de agosto de 2008'),
	(3, 'CNT E.P', '1768152560001', 'ROMERO MORA DARWIN GONZALO', 'Av. Amazonas N36-49 y Corea Ed. Vivaldi', 'Guayaquil', '(02) 3731700', 'Servicio Movil Avanzado', '26 de agosto de 2008');


CREATE TABLE operador
(
	id_rol INT NOT NULL,
	rol_type VARCHAR(10) DEFAULT 'OPERADOR' CHECK (rol_type='OPERADOR'),
	id_operadora int UNIQUE,
	operadora varchar(10) NOT NULL,
	id_data_operador1 int,
	PRIMARY KEY (id_rol,rol_type, id_operadora),
	FOREIGN KEY (id_rol,rol_type) REFERENCES rol (id_rol, rol_type),
	FOREIGN KEY (id_data_operador1) REFERENCES data_operador(id_data_operador)
);

INSERT INTO OPERADOR
VALUES
	(2, 'OPERADOR', 1, 'OTECEL', 1),
	(2, 'OPERADOR', 2, 'CONECEL', 2),
	(2, 'OPERADOR', 3, 'CNT', 3);

CREATE TABLE radiobase
(
	id_bs serial PRIMARY KEY,
	num int NOT NULL,
	cod_est varchar(10) NOT NULL,
	dir varchar(250),
	nom_sit varchar(50) NOT NULL,
	parroquia varchar(50) NOT NULL,
	canton varchar(50) NOT NULL,
	provincia varchar(50) NOT NULL,
	lat varchar(20) NOT NULL,
	long varchar(20) NOT NULL,
	cell_id varchar(20) NOT NULL,
	lat_dec float NOT NULL,
	long_dec float NOT NULL,
	geom geometry NOT NULL,
	id_estado1 int,
	id_den1 int,
	id_tec1 int,
	id_operadora2 int,
	FOREIGN KEY (id_estado1) REFERENCES estado (id_estado),
	FOREIGN KEY (id_den1) REFERENCES densidad (id_den),
	FOREIGN KEY (id_operadora2) REFERENCES operador(id_operadora),
	FOREIGN KEY (id_tec1) REFERENCES tecnologia (id_tec)
);

CREATE TABLE interrupcion
(
	id_inte serial PRIMARY KEY,
	-- fecha_inicio date NOT NULL,
	-- fecha_fin date,
	fecha_inicio TIMESTAMPTZ NOT NULL,
	fecha_fin TIMESTAMPTZ,
	duracion varchar(100),
	causa varchar(500) NOT NULL,
	area varchar(500) NOT NULL,
	-- estado_int varchar (20) NOT NULL,
	is_visible boolean NOT NULL DEFAULT TRUE,
	nivel_interrupcion VARCHAR(15) NOT NULL,
	provincia_inte VARCHAR(50),
	canton_inte VARCHAR(50),
	parroquia_inte VARCHAR(50),
	id_operadora1 int,
	id_tipo1 int,
	id_estado_int1 int,
	FOREIGN KEY (id_operadora1) REFERENCES operador (id_operadora),
	FOREIGN KEY (id_tipo1) REFERENCES tipo_interrupcion (id_tipo),
	FOREIGN KEY (id_estado_int1) REFERENCES estado_interrupcion (id_estado_int)
);

CREATE TABLE lnk_interrupcion
(
	id_inte2 int,
	id_bs1 int,
	FOREIGN KEY (id_inte2) REFERENCES interrupcion (id_inte),
	FOREIGN KEY (id_bs1) REFERENCES radiobase (id_bs)
);

CREATE TABLE comentario
(
	id_comentario SERIAL PRIMARY KEY,
	id_inte5 int NOT NULL,
	id_user3 INT NOT NULL,
	fecha VARCHAR(50) NOT NULL,
	comentario text,
	FOREIGN KEY (id_inte5) REFERENCES interrupcion (id_inte)
);

CREATE TABLE lnk_causa
(
	id_inte1 int,
	id_causa1 int,
	FOREIGN KEY (id_inte1) REFERENCES interrupcion (id_inte),
	FOREIGN KEY (id_causa1) REFERENCES causa (id_causa)
);

CREATE TABLE lnk_servicio
(
	id_inte3 int,
	id_servicio1 int,
	FOREIGN KEY (id_inte3) REFERENCES interrupcion (id_inte),
	FOREIGN KEY (id_servicio1) REFERENCES servicio (id_servicio)
);

CREATE TABLE lnk_operador
(
	id_operadora3 int,
	id_user2 int,
	FOREIGN KEY (id_operadora3) REFERENCES operador (id_operadora),
	FOREIGN KEY (id_user2) REFERENCES usuario (id_user)
);

CREATE TABLE lnk_tecnologia
(
	id_inte4 int,
	id_tec2 int,
	FOREIGN KEY (id_inte4) REFERENCES interrupcion (id_inte),
	FOREIGN KEY (id_tec2) REFERENCES tecnologia (id_tec)
);

CREATE TABLE arcotel
(
	id_rol INT NOT NULL,
	rol_type VARCHAR(10) DEFAULT 'ARCOTEL' CHECK (rol_type='ARCOTEL'),
	id_arc int UNIQUE,
	arcotel varchar(10) NOT NULL,
	PRIMARY KEY (id_rol,rol_type,id_arc),
	FOREIGN KEY (id_rol,rol_type) REFERENCES rol (id_rol, rol_type)
);

INSERT INTO ARCOTEL
VALUES
	(1, 'ARCOTEL', 1, 'ARCOTEL');

CREATE TABLE interrupcion_rev
(
	id_rev serial PRIMARY KEY,
	asunto text NOT NULL DEFAULT 'INFORME SOBRE INTERRUPCIÓN XXXX DEL SERVICIO MÓVIL AVANZADO DE LA OPERADORA XXXX EN XXXX XXXX XXX, REALIZADA EL DÍA XX DE XXXX DE 20XX.',
	html text,
	codigoReport VARCHAR(50) NOT NULL DEFAULT 'No. IT-CZXX-X-XXXX-XXXX',
	coordinacionZonal VARCHAR(5) NOT NULL DEFAULT 'XX',
	isModifyReport boolean NOT NULL DEFAULT FALSE,
	id_arc1 int,
	id_inte6 int,
	FOREIGN KEY (id_inte6) REFERENCES interrupcion (id_inte),
	FOREIGN KEY (id_arc1) REFERENCES arcotel (id_arc)
);

CREATE TABLE ADMINISTRADOR
(
	id_rol INT NOT NULL,
	rol_type VARCHAR(10) DEFAULT 'ADMIN' CHECK (rol_type='ADMIN'),
	id_admin int UNIQUE,
	administrador varchar(10) NOT NULL,
	PRIMARY KEY (id_rol,rol_type,id_admin),
	FOREIGN KEY (id_rol,rol_type) REFERENCES rol (id_rol, rol_type)
);

INSERT INTO USUARIO
	(nombre,email,apellido,username,telefono,id_rol1)
VALUES
	('admin', 'cmarcag@gmail.com', 'admin', 'admin', '0000000000', 3);
INSERT INTO LOGIN
	(email,hash, id_user1)
VALUES
	('cmarcag@gmail.com', '$2a$10$3TPyDjS20l87VIxHFCCx/uDxGFFY4BD1AMA5/VXffP7Zj9GDUdIrm', 1);
INSERT INTO ADMINISTRADOR
VALUES
	(3, 'ADMIN', 1, 'ADMIN');

-- --Densidad
-- INSERT INTO densidad(densidad)
-- SELECT *
-- FROM (SELECT UPPER(TRIM(clasificacion_d))
-- 		AS clasificacion_d FROM rbtodo)
-- 			as clasificacion_d
-- 				GROUP BY clasificacion_d
-- 					HAVING COUNT(*)>1
-- 						ORDER BY clasificacion_d;

-- --Tecnologia
-- INSERT INTO tecnologia(tecnologia)
-- SELECT *
-- FROM (SELECT UPPER(TRIM(tecnologia))
-- 		AS tecnologia FROM rbtodo)
-- 			as tacnologia
-- 				GROUP BY tecnologia
-- 					HAVING COUNT(*)>1
-- 						ORDER BY tecnologia;

-- --rbtodo
-- INSERT INTO radiobase(num,cod_est,dir,nom_sit,parroquia,canton,provincia,lat,long,cell_id,lat_dec,long_dec
-- 					  ,geom,id_estado1,id_den1,id_tec1,id_operadora2)
--  SELECT no as num,cod_est,direccion as dir, est as nom_sit,parroquia,canton,provincia, lat, lon as long
--  	, cell_id,lat_dec, lon_dec as long_dec, geom ,id_estado as id_estado1, id_den as id_den1, id_tec as id_tec1,
-- 	id_operadora as id_operadora2
--     FROM (
-- 		SELECT *
-- 		  FROM (SELECT UPPER(TRIM(rbtodo.parroquia)) AS parroquia
-- 			  , UPPER(TRIM(rbtodo.canton)) AS canton
-- 			  , UPPER(TRIM(rbtodo.provincia)) AS provincia  					  
-- 			  ,rbtodo.id,rbtodo.no,rbtodo.cod_est, rbtodo.est
-- 			  ,rbtodo.direccion,rbtodo.lat, rbtodo.lon, rbtodo.cell_id, rbtodo.lat_dec
-- 			  , rbtodo.lon_dec, rbtodo.geom,rbtodo.tecnologia as tec,rbtodo.status
-- 			  ,rbtodo.clasificacion_d, rbtodo.operadora, id_operadora, id_estado,id_den,id_tec
-- 			FROM rbtodo
-- 			LEFT OUTER JOIN estado ON estado.estado=REPLACE(rbtodo.status,'ACTIVE','ACTIVO')
-- 			LEFT OUTER JOIN densidad ON densidad.densidad=rbtodo.clasificacion_d
-- 			LEFT OUTER JOIN tecnologia ON tecnologia.tecnologia=rbtodo.tecnologia
--   			LEFT OUTER JOIN OPERADOR ON OPERADOR.OPERADORA=rbtodo.operadora
-- 			WHERE
-- 				OPERADOR.OPERADORA IS NOT NULL OR rbtodo.OPERADORA IS NOT NULL 
--  				OR rbtodo.status IS NOT NULL OR estado.estado IS NOT NULL
-- 				OR rbtodo.clasificacion_d IS NOT NULL OR densidad.densidad IS NOT NULL 
-- 				OR rbtodo.tecnologia IS NOT NULL OR tecnologia.tecnologia IS NULL
--  			ORDER BY provincia
-- 			) AS H) AS G

COMMIT TRANSACTION;
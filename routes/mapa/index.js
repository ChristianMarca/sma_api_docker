const express = require('express');
const router = express.Router();
const auth = require('../../midleware/authorization');
require('dotenv').load();
const db = require('../../knex');

const data_db = `(
  SELECT id_bs,num,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,cell_id,tecnologia,densidad,lat_dec,long_dec,operadora,geom,estado
    FROM RADIOBASE
    INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
    INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
    INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
    INNER JOIN OPERADOR ON ID_OPERADORA= ID_OPERADORA2
)`;

// router.get('/data_radiobase',auth.requiereAuth, function(req, res) {
router.get('/data_radiobase', function(req, res) {
	const filter_query = `SELECT row_to_json(fc)
                        FROM ( SELECT array_to_json(array_agg(f)) As features
                          FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                            FROM ${data_db} As lg WHERE lg.operadora='CONECEL' )As f) As fc
                              UNION ALL SELECT row_to_json(fc)
                                FROM ( SELECT array_to_json(array_agg(f)) As features
                                  FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                                    FROM ${data_db} As lg WHERE lg.operadora='OTECEL' )As f) As fc
                                    UNION ALL SELECT row_to_json(fc)
                                      FROM ( SELECT array_to_json(array_agg(f)) As features
                                        FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                                          FROM ${data_db} As lg
                                            WHERE lg.operadora='CNT' )As f) As fc`;

	db
		.raw(filter_query)
		.then((data) => {
			var conecel = data.rows[0].row_to_json;
			var otecel = data.rows[1].row_to_json;
			var cnt = data.rows[2].row_to_json;
			res.json({
				title: 'Express API',
				jsonData: {
					conecel,
					otecel,
					cnt
				}
			});
		})
		.catch((err) => {
			res.status(400).json('ERROR');
		});
});

router.post('/filter_radiobase', function(req, res) {
	var name = req.body;
	let op = [];
	let tec = [];

	function separar(target, pattern, campIn) {
		target.map((word) => {
			if (pattern.includes(word) === true) {
				campIn.push(word + '%');
			}
		});

		if (campIn.length == 0) {
			pattern.map((word) => {
				campIn.push(word + '%');
			});
		}
	}

	separar(name.campos, [ 'CNT', 'CONECEL', 'OTECEL' ], op);
	separar(name.campos, [ 'UMTS', 'GSM', 'LTE', 'UMTS/LTE' ], tec);

	var qA = `SELECT row_to_json(fc)
              FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
                FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                  FROM ${data_db} As lg WHERE lg.operadora LIKE '`;
	// var qB = "' AND lg.tecnologia LIKE ANY($1) )As f) As fc";
	var qB = "' AND lg.tecnologia LIKE ANY(:technologies) )As f) As fc";
	var qU = ' UNION ALL ';
	var qF = '';

	op.map((actual, indice) => {
		if (indice == 0) {
			qF = qA + actual + qB;
			// qF = qA + actual;
		} else {
			qF = qF + qU + qA + actual + qB;
			// qF = qF + qU + qA + actual ;
		}
	});
	db
		.raw(qF, { technologies: [ tec ] })
		.then((data) => {
			var _data = {};
			op.map((actual, indice) => {
				var datoE = data.rows[indice].row_to_json;
				_data[actual.replace('%', '')] = datoE;
			});
			res.json({ title: 'Express API', jsonData: _data });
		})
		.catch((err) => {
			res.status(400).json('ERROR');
		});
});

router.get('/data_radiobase_interruption', auth.requiereAuth, function(req, res) {
	const data_db_interruption_arcotel = `(
    SELECT DISTINCT ON (cod_est) id_bs,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,lat_dec,long_dec,operadora,geom,estado
      FROM LNK_INTERRUPCION
      INNER JOIN INTERRUPCION ON ID_INTE=ID_INTE2
      INNER JOIN RADIOBASE ON ID_BS=ID_BS1
      INNER JOIN OPERADOR ON ID_OPERADORA=ID_OPERADORA2
      INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
      INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
	  INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
	  WHERE IS_FINISHED=FALSE
  )`;

	const data_db_interruption = `(
    SELECT DISTINCT ON (cod_est) id_bs,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,lat_dec,long_dec,operadora,geom,estado
      FROM LNK_INTERRUPCION
      INNER JOIN INTERRUPCION ON ID_INTE=ID_INTE2
      INNER JOIN RADIOBASE ON ID_BS=ID_BS1
      INNER JOIN OPERADOR ON ID_OPERADORA=ID_OPERADORA2
      INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
      INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
      INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
      INNER JOIN lnk_operador ON id_operadora1=id_operadora3
      INNER JOIN usuario ON id_user=id_user2
	  WHERE id_user=${req.query.id_user}
		AND IS_FINISHED=FALSE
  )`;

	const filter_query = `SELECT row_to_json(fc)
                        FROM ( SELECT array_to_json(array_agg(f)) As features
                          FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                            FROM ${req.query.id_rol === '1'
								? data_db_interruption_arcotel
								: data_db_interruption} As lg  )As f) As fc`;

	db
		.raw(filter_query)
		.then((data) => {
			var radiobases = data.rows[0].row_to_json;
			if (!radiobases.features) radiobases.features = [];
			res.json({
				title: 'Express API',
				jsonData: {
					radiobases
				}
			});
		})
		.catch((err) => {
			console.log(err);
			res.status(400).json('ERROR');
		});
});

module.exports = router;

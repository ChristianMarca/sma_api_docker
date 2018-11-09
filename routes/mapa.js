const express = require('express');
const router= express.Router();
const {Client, Query} = require('pg');
const auth= require('./authentication/authorization');
var minifier = require('json-minifier')(specs);
require('dotenv').load();

var specs = {
  key: 'k',
  MySuperLongKey: 'm',
  SomeAnotherPropertyThatIsRealyLong: 's'
};

const data_db=`(
  SELECT id_bs,num,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,cell_id,tecnologia,densidad,lat_dec,long_dec,operadora,geom,estado
    FROM RADIOBASE
    INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
    INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
    INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
    INNER JOIN OPERADOR ON ID_OPERADORA= ID_OPERADORA2
)`;
var client = new Client(process.env.POSTGRES_URI);
client.connect();

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

  var query = client.query(new Query(filter_query));

  query.on("row", function(row, result) {
    result.addRow(row);
  });

  query.on("end", function(result) {

    var conecel = result.rows[0].row_to_json;
    var otecel = result.rows[1].row_to_json;
    var cnt = result.rows[2].row_to_json;
    res.json(minifier.minify({
      title: "Express API",
      jsonData: {
        conecel,
        otecel,
        cnt
      }
    }));
  });

});

router.post('/filter_radiobase', function(req, res) {
  var name = req.body;
  let op = [];
  let tec = [];

  function separar(target, pattern, campIn) {
    target.map(word => {
      if (pattern.includes(word) === true) {
        campIn.push(word + '%')
      }
    })

    if (campIn.length == 0) {
      pattern.map(word => {campIn.push(word + '%')})
    }
  }

  separar(name.campos, ['CNT', 'CONECEL', 'OTECEL'], op)
  separar(name.campos, ['UMTS', 'GSM', 'LTE'], tec)

  var qA = `SELECT row_to_json(fc)
              FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
                FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                  FROM ${data_db} As lg WHERE lg.operadora LIKE '`;
  var qB = "' AND lg.tecnologia LIKE ANY($1) )As f) As fc";
  var qU = " UNION ALL "
  var qF = "";

  op.map((actual, indice) => {
    if (indice == 0) {
      qF = qA + actual + qB;
    } else {
      qF = qF + qU + qA + actual + qB;
    }
  })
  var query = client.query(new Query(qF, [tec]));
  query.on("row", function(row, result) {
    result.addRow(row);
  });
  query.on("end", function(result) {
    var data = {};
    op.map((actual, indice) => {
      var datoE = result.rows[indice].row_to_json
      data[actual.replace('%', '')] = datoE;
    })
    res.json({title: "Express API", jsonData: data});
  });
});

module.exports =router;

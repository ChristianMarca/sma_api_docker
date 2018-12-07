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


router.get('/data_radiobase_interruption', function(req, res) {
  // const data_db_interruption_arcotel=`(
  //   SELECT DISTINCT ON (cod_est) id_bs,num,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,cell_id,tecnologia,densidad,lat_dec,long_dec,operadora,geom,estado
  //     FROM LNK_INTERRUPCION
  //     INNER JOIN INTERRUPCION ON ID_INTE=ID_INTE2
  //     INNER JOIN RADIOBASE ON ID_BS=ID_BS1
  //     INNER JOIN OPERADOR ON ID_OPERADORA=ID_OPERADORA2
  //     INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
  //     INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
  //     INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
  // )`;

  // const data_db_interruption=`(
  //   SELECT DISTINCT ON (cod_est)  id_bs,num,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,cell_id,tecnologia,densidad,lat_dec,long_dec,operadora,geom,estado
  //     FROM LNK_INTERRUPCION
  //     INNER JOIN INTERRUPCION ON ID_INTE=ID_INTE2
  //     INNER JOIN RADIOBASE ON ID_BS=ID_BS1
  //     INNER JOIN OPERADOR ON ID_OPERADORA=ID_OPERADORA2
  //     INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
  //     INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
  //     INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
  //     INNER JOIN lnk_operador ON id_operadora1=id_operadora3
  //     INNER JOIN usuario ON id_user=id_user2
  //     WHERE id_user=${req.query.id_user}
  // )`;

  const data_db_interruption_arcotel=`(
    SELECT DISTINCT ON (cod_est) id_bs,cod_est,nom_sit,provincia,canton,parroquia,dir,lat,long,lat_dec,long_dec,operadora,geom,estado
      FROM LNK_INTERRUPCION
      INNER JOIN INTERRUPCION ON ID_INTE=ID_INTE2
      INNER JOIN RADIOBASE ON ID_BS=ID_BS1
      INNER JOIN OPERADOR ON ID_OPERADORA=ID_OPERADORA2
      INNER JOIN ESTADO ON ID_ESTADO1=ID_ESTADO
      INNER JOIN DENSIDAD ON ID_DEN1=ID_DEN
      INNER JOIN TECNOLOGIA ON ID_TEC1= ID_TEC
  )`;

  const data_db_interruption=`(
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
  )`;

  const filter_query = `SELECT row_to_json(fc)
                        FROM ( SELECT array_to_json(array_agg(f)) As features
                          FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
                            FROM ${req.query.id_rol==='1'?data_db_interruption_arcotel:data_db_interruption} As lg  )As f) As fc`;

  var query = client.query(new Query(filter_query));

  query.on("row", function(row, result) {
    result.addRow(row);
  });

  query.on("end", function(result) {

    var radiobases = result.rows[0].row_to_json;
    if(!radiobases.features) radiobases.features=[]
    res.json(minifier.minify({
      title: "Express API",
      jsonData: {
        radiobases
      }
    }));
  });
  // res.json('?asas')
});

module.exports =router;


// router.get('/data_radiobase_interruption', function(req, res) {
//   console.log('test')
//   const filter_query = `SELECT row_to_json(fc)
//                         FROM ( SELECT array_to_json(array_agg(f)) As features
//                           FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
//                             FROM ${data_db_interruption} As lg WHERE lg.operadora='CONECEL' )As f) As fc
//                               UNION ALL SELECT row_to_json(fc)
//                                 FROM ( SELECT array_to_json(array_agg(f)) As features
//                                   FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
//                                     FROM ${data_db_interruption} As lg WHERE lg.operadora='OTECEL' )As f) As fc
//                                     UNION ALL SELECT row_to_json(fc)
//                                       FROM ( SELECT array_to_json(array_agg(f)) As features
//                                         FROM ( SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(lg) As properties
//                                           FROM ${data_db_interruption} As lg
//                                             WHERE lg.operadora='CNT' )As f) As fc`;

//   var query = client.query(new Query(filter_query));

//   query.on("row", function(row, result) {
//     result.addRow(row);
//   });

//   query.on("end", function(result) {

//     var conecel = result.rows[0].row_to_json;
//     var otecel = result.rows[1].row_to_json;
//     var cnt = result.rows[2].row_to_json;
//     // console.log(otecel,'?',!otecel.features)
//     // console.log(cnt,'as')
//     if(!conecel.features) conecel.features=[]
//     if(!otecel.features) otecel.features=[]
//     if(!cnt.features) cnt.features=[]
//     res.json(minifier.minify({
//       title: "Express API",
//       jsonData: {
//         conecel:conecel,
//         otecel:otecel,
//         cnt:cnt
//       }
//     }));
//   });
//   // res.json('?asas')
// });
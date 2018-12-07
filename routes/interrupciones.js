const express = require('express');
const router = express.Router();
const {Client, Query} = require('pg');
require('dotenv').load();

var cliente = new Client(process.env.POSTGRES_URI);
cliente.connect();

router.post('/inter', function(req, res) {

  let datos = req.body;
  let fetchOffset = datos[0];
  let elementosPagina = datos[1];
  let orden = datos[2];
  let campOrden = datos[3];
  let filtIn = datos[4];
  let filtFin = datos[5];
  let area = datos[6];

  let base_arcotel = `SELECT * FROM interrupcion
              WHERE LOWER(area) SIMILAR TO LOWER(${area}) AND fecha_inicio >= to_timestamp(${filtIn}/1000.0)
              AND fecha_inicio <= to_timestamp(${filtFin}/1000.0)`;
  let base = `SELECT * FROM interrupcion
              INNER JOIN lnk_operador ON id_operadora1=id_operadora3
              INNER JOIN operador ON id_operadora=id_operadora3
              INNER JOIN usuario ON id_user=id_user2
              WHERE LOWER(area) SIMILAR TO LOWER(${area}) AND fecha_inicio >= to_timestamp(${filtIn}/1000.0)
              AND fecha_inicio <= to_timestamp(${filtFin}/1000.0) AND id_user=${datos[8]}`;
  console.log(datos)
  let qmain = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM (${datos[7]===1?base_arcotel:base}) as todo) as conteo
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As interrupciones
            FROM (${datos[7]===1?base_arcotel:base}
              ORDER BY ${campOrden} ${orden}
            LIMIT ${elementosPagina} OFFSET ${fetchOffset}) As f) As fc`;

  var query = cliente.query(new Query(qmain));
  query.on("row", function(row, result) {
    result.addRow(row);
  });
  
  query.on("end", function(result) {
    let {total} = result.rows[0].row_to_json;
    let {interrupciones} = result.rows[1].row_to_json;

    if(!interrupciones) interrupciones=[]
    res.json({total,interrupciones});
  });
});

module.exports = router;

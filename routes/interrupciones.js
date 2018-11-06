const express = require('express');
const router = express.Router();
const {Client, Query} = require('pg');
require('dotenv').load();

var cliente = new Client(process.env.POSTGRES_URI);
cliente.connect();

router.post('/inter', function(req, res) {

  let datos = req.body;
  let pagina = datos[0];
  let elementosPagina = datos[1];
  let campOrden = datos[2];
  let orden = datos[3];
  let ultimo = datos[4];
  console.log(datos)
  let qq = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM interrupcion) as conteo
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As interrupciones
            FROM (SELECT * FROM interrupcion WHERE ${campOrden} > ${ultimo} ORDER BY ${campOrden} ${orden}
            LIMIT ${elementosPagina}) As f) As fc`;
  var query = cliente.query(new Query(qq));

  query.on("row", function(row, result) {
    result.addRow(row);
  });

  query.on("end", function(result) {
    let {total} = result.rows[0].row_to_json;
    let {interrupciones} = result.rows[1].row_to_json;
    res.json({
      title: "Express API",
      jsonData: {
        total,
        interrupciones
      }
    });
  });

});
/*
router.get('/opInt', function(req, res) {

  let qq = `SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As operadoras
            FROM (SELECT id_operadora,operadora FROM operador) As f) As fc
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As tipos
            FROM (SELECT id_tipo,tipo FROM tipo_interrupcion) As f) As fc`;
  var query = cliente.query(new Query(qq));

  query.on("row", function(row, result) {
    result.addRow(row);
  });

  query.on("end", function(result) {
    let {operadoras} = result.rows[0].row_to_json;
    let {tipos} = result.rows[1].row_to_json;
    console.log(tipos)
    res.json({
      title: "Express API",
      jsonData: {
        operadoras,
        tipos
      }
    });
  });
});*/

module.exports = router;

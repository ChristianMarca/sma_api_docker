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
  let qq = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM interrupcion) as conteo
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As interrupciones
            FROM (SELECT * FROM interrupcion WHERE area LIKE 'cue' ORDER BY ${campOrden} ${orden}
            LIMIT ${elementosPagina} OFFSET ${fetchOffset}) As f) As fc`;
  var query = cliente.query(new Query(qq));

  query.on("row", function(row, result) {
    result.addRow(row);
  });

  query.on("end", function(result) {
    let {total} = result.rows[0].row_to_json;
    let {interrupciones} = result.rows[1].row_to_json;
    res.json({total,interrupciones});
  });

});

module.exports = router;

/*
let qq = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM interrupcion) as conteo
          UNION ALL
          SELECT row_to_json(fc)
          FROM (SELECT array_agg(f) As interrupciones
          FROM (SELECT * FROM interrupcion WHERE id_inte > ${fetchMark} ORDER BY id_inte ${fetchOrder}
          LIMIT ${elementosPagina}) As f) As fc`;
          */

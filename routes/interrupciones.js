const express = require('express');
const router = express.Router();
const {Client, Query} = require('pg');
const moment=require('moment');
const path = require('path');
const fs=require('fs');
require('dotenv').load();
const {compile}=require('../services/pdfGenerator/index');

var cliente = new Client(process.env.POSTGRES_URI);
cliente.connect();
const knex = require('knex')

const db=knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
});

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

router.put('/updateReport', function(req, res,next) {
  console.log('testuabdi',req.query,req.body.contentHtml)
  db.transaction(
    trx=>{
        return trx('interrupcion_rev')
            .update({'html':req.body.contentHtml})
            .where('id_rev',req.query.id_interruption)
            .then(numberOfUpdatedRows=>{
                if(numberOfUpdatedRows) {
                    res.json(numberOfUpdatedRows);
                    return;
                }
            })
            .then(trx.commit)//continua con la operacion
            .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
    }).catch(err=> {return res.status(400)})
  // res.json('Sucess')
})

router.get('/getReport', function(req, res,next) {
  console.log('sads/s/sad',req.query,'probando query')
  var content;
  db.transaction(
    trx=>{
        return trx('interrupcion_rev')
            .select('*')
            .innerJoin('interrupcion',"id_inte","id_inte6")
            .innerJoin('tipo_interrupcion','id_tipo',"id_tipo1")
            .innerJoin('operador','id_operadora','id_operadora1')
            .innerJoin('data_operador','id_data_operador','id_data_operador1')
            .where('id_inte6',req.query.id_interruption)
            .then(data=>{
              var dataObj=data[0];
              if(!dataObj.ismodifyreport){
                dataObj.dataReport=moment().format();
                dataObj.interruptionLevelValue=dataObj[dataObj.nivel_interrupcion.concat('_inte').toLowerCase()];
                console.log(dataObj,'test')
                  // compile('test',{data:data[0]},undefined)
                if(dataObj.html){
                  console.log('Existe ya')
                  res.json(dataObj.html)
                }else{
                  compile('format_generate_init_report',{data:dataObj},undefined)
                    .then(html=>{
                      content=html;
                      processFile()
                      // fs.readFile(path.join(process.cwd(),'services/pdfGenerator/format_1.html'),'utf-8',(err,data)=>{
                      //   if (err){
                      //     console.log(err)
                      //     res.status(400).json('Not Found')
                      //   }
                      //   content=data;
                      //    processFile();
                      // })
                    })
                    .catch(err=>{
                      res.status(400).json('Fail Generation Report')
                    })
                }
                }
            }).then(trx.commit)//continua con la operacion
            .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
    }).catch(err=> {return res.status(400)})

  async function  processFile(){
      res.json(content)
  }
  // console.log(test,'pueba')
  // console.log(__dirname,"geys sh",process.cwd())
  // res.json('test')
})

module.exports = router;

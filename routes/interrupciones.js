const express = require('express');
const router = express.Router();
// const {Client, Query} = require('pg');
const moment=require('moment');
const path = require('path');
const fs=require('fs');
require('dotenv').load();
const auth = require('./authentication/authorization');
const {compile}=require('../services/pdfGenerator/index');
const Report=require('./classes');
// const connectionString = 'postgres://postgres:secret_password@172.20.0.3:5432/sma_api'
// const pool = new Pool({
//   // connectionString: connectionString,
//   connectionString: connectionString,
// })

// pool.query('SELECT NOW()', (err, res) => {
//   console.log(err, res,'TES2')
//   pool.end()
// })

// var cliente = new Client(process.env['POSTGRES_URI']);
// var cliente = new Client(connectionString);
// cliente.connect();


const knex = require('knex')

const db=knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
});

router.get('/getComments',auth.requiereAuth,(req,res)=>{
  db.select('*')
    .from('comentario')
    .where('id_inte5',req.query.id_interruption)
    .orderBy('id_comentario')
    .then(comment=>{
      res.json(comment)
    })
    .catch(err=>{
      console.log({Error:err})
      res.status(400).json('Fail')
    })
})

router.put('/addComment',auth.requiereAuth,(req,res)=>{
  if(req.body.comment){
    db.transaction(
      trx=>{
          return trx('comentario')
              .insert({
                'id_inte5':req.query.id_interruption,
                'id_user3':req.query.id_user,
                'fecha':moment().format('ddd DD-MMM-YYYY, hh:mm A'),
                'comentario': req.body.comment
              })
              // .where('id_rev',req.query.id_interruption)
              .then(numberOfUpdatedRows=>{
                  // if(numberOfUpdatedRows) {
                  //   console.log('comentario',numberOfUpdatedRows)
                      // res.json(numberOfUpdatedRows);
                      res.json('Correct')
                  //     return;
                  // }
              })
              .then(trx.commit)
              .catch(err=>{console.log({Error:err});return trx.rollback})
      }).catch(err=> {return res.status(400)})
  }else{
    res.status(400).json('The comment is Empty')
  }
})

router.post('/inter',auth.requiereAuth, function(req, res) {
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
  let qmain = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM (${datos[7]===1?base_arcotel:base}) as todo) as conteo
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As interrupciones
            FROM (${datos[7]===1?base_arcotel:base}
              ORDER BY ${campOrden} ${orden}
            LIMIT ${elementosPagina} OFFSET ${fetchOffset}) As f) As fc`;
  // var query = cliente.query(new Query(qmain));
  // console.log('nueva query',new Query(qmain))
  // console.log('query',query)
  // query.on("row", function(row, result) {
  //   result.addRow(row);
  // });
  // query.on("end", function(result) {
  //   let {total} = result.rows[0].row_to_json;
  //   let {interrupciones} = result.rows[1].row_to_json;

  //   if(!interrupciones) interrupciones=[]
  //   res.json({total,interrupciones});
  // });
  db.raw(qmain)
  .then(data=>{
    let {total} = data.rows[0].row_to_json;
    let {interrupciones} = data.rows[1].row_to_json;

    if(!interrupciones) interrupciones=[]
    res.json({total,interrupciones});
  })
  .catch(err=>{
    console.log({Error:err})
    res.status(400).json('ERROR')
  })
});

router.put('/updateReport',auth.requiereAuth, function(req, res,next) {
  db.transaction(
    trx=>{
        return trx('interrupcion_rev')
            .update({
              'html':req.body.contentHtml,
              'codigoreport': req.body.contentHeader.codigoReport,
              'coordinacionzonal':req.body.contentHeader.coordinacionZonal,
              'asunto': req.body.contentHeader.asunto
            })
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

router.post('/actions',auth.requiereAuth, (req,res,auth)=>{
  const {group,selected,contentHeader,contentHtml,id_interruption}=req.body;
    if(group==='actionInReport'){
      var report= new Report(contentHtml,contentHeader,id_interruption);
      switch(selected){
        case 'saveChanges':
          report.updateReport()
          res.json('Saved')
          break;
        case 'rebuildReport':
          report.rebuildReport()
          .then(resp=>{
            res.json(resp)
          })
          .catch(err=>res.status(400).json('No work'));
          break;
        case 'sendReport':
          report.sendMail().then(resp=>{
            res.json('Send')
          });
          break;
        default:
          res.status(400).json('Action no found') 
          break;
      }
    }else if(group==='StateOfInterruption'){

    }
})

router.get('/getReport',auth.requiereAuth, function(req, res,next) {
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
                if(dataObj.html){
                  res.json({html:dataObj.html,
                    codigoReport:dataObj.codigoreport,
                    coordinacionZonal: dataObj.coordinacionzonal,
                    asunto: dataObj.asunto
                  })
                }else{
                  compile('format_generate_init_report',{data:dataObj},undefined)
                    .then(html=>{
                      // content=html;
                      content={
                        html:html,
                        codigoReport:dataObj.codigoreport,
                        coordinacionZonal: dataObj.coordinacionzonal,
                        asunto: dataObj.asunto
                      }
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

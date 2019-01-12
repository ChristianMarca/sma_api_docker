const express = require('express');
const router = express.Router();
// const {Client, Query} = require('pg');
// const moment=require('moment');
var moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
require('dotenv').load();
const auth = require('./authentication/authorization');
const { compile, generatePdf } = require('../services/pdfGenerator/index');
const _sendMail = require('../services/email');
var { verifyRBForCod_Est } = require('../services/dataValidation/index.js');
const { Report, InterruptionDate, Interrupcion } = require('./classes');
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

const knex = require('knex');

const db = knex({
	client: 'pg',
	connection: process.env.POSTGRES_URI
});

router.post('/newInterruption', auth.requiereAuth, (req, res, next) => {
	var IntRb = req.body;
	var interrupcionClass = new Interrupcion(IntRb);
	if (IntRb.interruptionTechnologies.includes('UMTS') || IntRb.interruptionTechnologies.includes('LTE')) {
		IntRb.interruptionTechnologies = IntRb.interruptionTechnologies.concat('UMTS/LTE');
	}

	compile('format_send_interruption', interrupcionClass.createDataForReport(IntRb), undefined).then((html) => {
		generatePdf(
			html,
			undefined,
			`<div style="font-size: 12px;margin-left:10%; ;display: flex; flex-direction: row; width: 100%" id='template'><p>Informe de interrupcion</p></div>`,
			`
        <div style="font-size: 12px; margin-left:5%; display: flex; flex-direction: row; justify-content: flex-start; width: 100%" id='template'>
           <div class='date' style="font-size: 10px;"></div>
           <div class='title' style="font-size: 10px;"></div>
           <script>
             var pageNum = document.getElementById("num");
             pageNum.remove()
             var template = document.getElementById("template")
             template.style.background = 'red';
           </script>
         </div>`
		).then((response) => {
			_sendMail(undefined, IntRb.interruptionEmailAddress, 'Reporte de Interrupcion', undefined, undefined, [
				{
					filename: 'test.pdf',
					path: path.join(process.cwd(), `test.pdf`),
					contentType: 'application/pdf'
				}
			])
				.then((data) => {
					verifyRBForCod_Est(IntRb)
						.then((data) => {
							// IntRb.interruptionRadioBase.radioBasesAdd=data;
							interrupcionClass.insertNewInterruption(data, req, res, db);
							res.json({ IntRb, data });
						})
						.catch((error) => {
							console.log({ Error: error });
						});
				})
				.catch((error) => {
					// return({Error:error})
					res.status(400).json({ Error: error });
				});
		});
	});

	// verifyRBForCod_Est(IntRb)
	//     .then(data=>{
	//         // IntRb.interruptionRadioBase.radioBasesAdd=data;
	//         insertNewInterruption(data,req,res,db)
	//         res.json({IntRb,data})
	//         })
	//     .catch(e=>{console.log(e)});
});

router.get('/interruptionSelected', auth.requiereAuth, function(req, res, next) {
	db
		.transaction(
			(trx) => {
				trx('usuario')
					.select('*')
					.innerJoin('lnk_operador', 'id_user', 'id_user2')
					.innerJoin('operador', 'id_operadora', 'id_operadora3')
					.innerJoin('interrupcion', 'id_operadora', 'id_operadora1')
					.innerJoin('estado_interrupcion', 'id_estado_int', 'id_estado_int1')
					.innerJoin('tipo_interrupcion', 'id_tipo', 'id_tipo1')
					// .innerJoin('lnk_tecnologia','id_inte','id_inte4')
					// .innerJoin('tecnologia','id_tec','id_tec2')
					// .where('id_user',req.query.id_user)
					.andWhere('id_inte', req.query.id_interruption)
					.then((data) => {
						// res.json(data)
						return trx('lnk_tecnologia')
							.innerJoin('tecnologia', 'id_tec', 'id_tec2')
							.select('tecnologia')
							.where({
								id_inte4: data[0].id_inte
								// 'id_operadora2':data[0].id_operadora2
							})
							.then((technologies) => {
								return trx('lnk_servicio')
									.innerJoin('servicio', 'id_servicio', 'id_servicio1')
									.select('servicio')
									.where({
										id_inte3: data[0].id_inte
										// 'id_operadora2':data[0].id_operadora2
									})
									.then((services) => {
										return res.json({ data: data[0], technologies, services });
									});
							});
					})
					.then(trx.commit) //continua con la operacion
					.catch((err) => {
						return trx.rollback;
					}); //Si no es posible elimna el proces0
			}
			// ).catch(err=> res.status(400).json('unable to register'))
		)
		.catch((err) => {
			return res.status(400);
		});
	// res.json('ok')
});

router.get('/getComments', auth.requiereAuth, (req, res) => {
	db
		.select('*')
		.from('comentario')
		.where('id_inte5', req.query.id_interruption)
		.orderBy('id_comentario')
		.then((comment) => {
			res.json(comment);
		})
		.catch((err) => {
			console.log({ Error: err });
			res.status(400).json('Fail');
		});
});
router.get('/getStateInterruption', auth.requiereAuth, (req, res) => {
	if (!(req.query.interruption_id === 'undefined')) {
		const interruptionDateStatus = new InterruptionDate(moment.tz('America/Guayaquil'), req.query.interruption_id);
		let days = interruptionDateStatus.getInterruptionDate();
		days
			.then((day) => {
				switch (true) {
					case day >= 0 && day < 2:
						res.json({
							status: 'inicio',
							level: 'operador',
							actualDay: day
						});
						return;
					case day >= 2 && day < 4:
						res.json({
							status: 'proceso',
							level: 'operador',
							actualDay: day
						});
						return;
					case day >= 4 && day <= 5:
						res.json({
							status: 'fin',
							level: 'operador',
							actualDay: day
						});
						return;
					case day > 5 && day < 10:
						res.json({
							status: 'inicio',
							level: 'arcotel',
							actualDay: day
						});
						return;
					case day >= 10 && day < 15:
						res.json({
							status: 'proceso',
							level: 'arcotel',
							actualDay: day
						});
						return;
					case day >= 15:
						res.json({
							status: 'fin',
							level: 'arcotel',
							actualDay: day
						});
						return;
				}
			})
			.catch((error) => res.status(400).json({ Error: error }));
	} else {
		res.status(400).json('No valid ID Interruption');
	}
});

router.put('/addComment', auth.requiereAuth, (req, res) => {
	if (req.body.comment) {
		db
			.transaction((trx) => {
				return (
					trx('comentario')
						.insert({
							id_inte5: req.query.id_interruption,
							id_user3: req.query.id_user,
							fecha: moment.tz('America/Guayaquil').format('ddd DD-MMM-YYYY, hh:mm A'),
							comentario: req.body.comment
						})
						// .where('id_rev',req.query.id_interruption)
						.then((numberOfUpdatedRows) => {
							// if(numberOfUpdatedRows) {
							//   console.log('comentario',numberOfUpdatedRows)
							// res.json(numberOfUpdatedRows);
							res.json('Correct');
							//     return;
							// }
						})
						.then(trx.commit)
						.catch((err) => {
							console.log({ Error: err });
							return trx.rollback;
						})
				);
			})
			.catch((err) => {
				return res.status(400);
			});
	} else {
		res.status(400).json('The comment is Empty');
	}
});

router.post('/inter', auth.requiereAuth, function(req, res) {
	let datos = req.body;
	let fetchOffset = datos[0];
	let elementosPagina = datos[1];
	let orden = datos[2];
	let campOrden = datos[3];
	let filtIn = datos[4];
	let filtFin = datos[5];
	let area = datos[6];
	// console.log('fecha incio', filtIn, 'fecha fin', filtFin);

	let base_arcotel = `SELECT * FROM (SELECT DISTINCT ON (id_inte) * FROM interrupcion
				INNER JOIN lnk_operador ON id_operadora1=id_operadora3
				INNER JOIN operador ON id_operadora=id_operadora3
				INNER JOIN usuario ON id_user=id_user2
				INNER JOIN tipo_interrupcion ON id_tipo=id_tipo1
				INNER JOIN estado_interrupcion ON id_estado_int=id_estado_int1
              WHERE LOWER(area) SIMILAR TO LOWER(${area}) AND fecha_inicio >= to_timestamp(${filtIn}/1000.0)
			  AND fecha_inicio <= to_timestamp(${filtFin}/1000.0)
				) as alias
			  `;
	let base = `SELECT * FROM interrupcion
              INNER JOIN lnk_operador ON id_operadora1=id_operadora3
              INNER JOIN operador ON id_operadora=id_operadora3
              INNER JOIN usuario ON id_user=id_user2
			  INNER JOIN tipo_interrupcion ON id_tipo=id_tipo1
			  INNER JOIN estado_interrupcion ON id_estado_int=id_estado_int1
              WHERE LOWER(area) SIMILAR TO LOWER(${area}) AND fecha_inicio >= to_timestamp(${filtIn}/1000.0)
              AND fecha_inicio <= to_timestamp(${filtFin}/1000.0) AND id_user=${datos[8]}`;
	let qmain = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM (${datos[7] === 1
		? base_arcotel
		: base}) as todo) as conteo
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As interrupciones
            FROM (${datos[7] === 1 ? base_arcotel : base}
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
	db
		.raw(qmain)
		.then((data) => {
			let { total } = data.rows[0].row_to_json;
			let { interrupciones } = data.rows[1].row_to_json;

			if (!interrupciones) interrupciones = [];
			res.json({ total, interrupciones });
		})
		.catch((err) => {
			console.log({ Error: err });
			res.status(400).json({ total: 0, interrupciones: [] });
		});
});

router.put('/updateReport', auth.requiereAuth, function(req, res, next) {
	db
		.transaction((trx) => {
			return trx('interrupcion_rev')
				.update({
					html: req.body.contentHtml,
					codigoreport: req.body.contentHeader.codigoReport,
					coordinacionzonal: req.body.contentHeader.coordinacionZonal,
					asunto: req.body.contentHeader.asunto
				})
				.where('id_rev', req.query.id_interruption)
				.then((numberOfUpdatedRows) => {
					if (numberOfUpdatedRows) {
						res.json(numberOfUpdatedRows);
						return;
					}
				})
				.then(trx.commit) //continua con la operacion
				.catch((err) => {
					console.log(err);
					return trx.rollback;
				}); //Si no es posible elimna el proces0
		})
		.catch((err) => {
			return res.status(400);
		});
	// res.json('Sucess')
});

router.post('/actions', auth.requiereAuth, (req, res, auth) => {
	const { group, selected, contentHeader, contentHtml, id_interruption } = req.body;
	console.log('tesav', group, selected, id_interruption);
	if (group === 'actionInReport') {
		var report = new Report(contentHtml, contentHeader, id_interruption);
		switch (selected) {
			case 'saveChanges':
				report.updateReport();
				res.json('Saved');
				break;
			case 'rebuildReport':
				report
					.rebuildReport()
					.then((resp) => {
						res.json(resp);
					})
					.catch((err) => res.status(400).json('No work'));
				break;
			case 'sendReport':
				report.sendMail().then((resp) => {
					res.json('Send');
				});
				break;
			default:
				res.status(400).json('Action no found');
				break;
		}
	} else if (group === 'StateOfInterruption') {
		// console.log('heta',group,selected,id_interruption)
		db
			.transaction((trx) => {
				return trx('estado')
					.select('id_estado')
					.where('estado', selected)
					.then((_id_estado) => {
						return trx('lnk_interrupcion')
							.select('id_bs1')
							.where('id_inte2', id_interruption)
							.then((_id_bs) => {
								// console.log(_id_estado,'test',_id_bs)
								return trx('radiobase')
									.whereIn(
										'id_bs',
										_id_bs.map((_id) => {
											return _id.id_bs1;
										})
									)
									.update('id_estado1', _id_estado[0].id_estado)
									.then((data) => {
										res.json('Correct');
									});
							});
					})
					.then(trx.commit) //continua con la operacion
					.catch((err) => {
						console.log(err);
						return trx.rollback;
					}); //Si no es posible elimna el proces0
			})
			.catch((err) => {
				return res.status(400).json('Something Fail');
			});
	} else if (group === 'updateInterruptionState') {
		// console.log('heta',group,selected,id_interruption)
		db
			.transaction((trx) => {
				return trx('estado_interrupcion')
					.select('*')
					.where('estado_int', selected.replace('_', ' '))
					.then((_id_estado_int) => {
						console.log('tevsja', _id_estado_int, id_interruption);
						return trx('interrupcion')
							.where('id_inte', id_interruption)
							.update('id_estado_int1', _id_estado_int[0].id_estado_int)
							.then((data) => {
								res.json(_id_estado_int[0].estado_int);
							});
					})
					.then(trx.commit) //continua con la operacion
					.catch((err) => {
						console.log(err);
						return trx.rollback;
					}); //Si no es posible elimna el proces0
			})
			.catch((err) => {
				return res.status(400).json('Something Fail');
			});
	} else {
		res.status(400).json('Accion no valida');
	}
});

router.get('/getReport', auth.requiereAuth, function(req, res, next) {
	var content;
	db
		.transaction((trx) => {
			return trx('interrupcion_rev')
				.select('*')
				.innerJoin('interrupcion', 'id_inte', 'id_inte6')
				.innerJoin('tipo_interrupcion', 'id_tipo', 'id_tipo1')
				.innerJoin('operador', 'id_operadora', 'id_operadora1')
				.innerJoin('data_operador', 'id_data_operador', 'id_data_operador1')
				.where('id_inte6', req.query.id_interruption)
				.then((data) => {
					var dataObj = data[0];
					if (!dataObj.ismodifyreport) {
						// dataObj.dataReport=moment().format();
						dataObj.dataReport = moment.tz('America/Guayaquil').format();
						dataObj.interruptionLevelValue =
							dataObj[dataObj.nivel_interrupcion.concat('_inte').toLowerCase()];
						if (dataObj.html) {
							res.json({
								html: dataObj.html,
								codigoReport: dataObj.codigoreport,
								coordinacionZonal: dataObj.coordinacionzonal,
								asunto: dataObj.asunto
							});
						} else {
							compile('format_generate_init_report', { data: dataObj }, undefined)
								.then((html) => {
									// content=html;
									content = {
										html: html,
										codigoReport: dataObj.codigoreport,
										coordinacionZonal: dataObj.coordinacionzonal,
										asunto: dataObj.asunto
									};
									processFile();
									// fs.readFile(path.join(process.cwd(),'services/pdfGenerator/format_1.html'),'utf-8',(err,data)=>{
									//   if (err){
									//     console.log(err)
									//     res.status(400).json('Not Found')
									//   }
									//   content=data;
									//    processFile();
									// })
								})
								.catch((err) => {
									res.status(400).json('Fail Generation Report');
								});
						}
					}
				})
				.then(trx.commit) //continua con la operacion
				.catch((err) => {
					console.log(err);
					return trx.rollback;
				}); //Si no es posible elimna el proces0
		})
		.catch((err) => {
			return res.status(400);
		});

	async function processFile() {
		res.json(content);
	}
	// console.log(test,'pueba')
	// console.log(__dirname,"geys sh",process.cwd())
	// res.json('test')
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
require('dotenv').load();
const auth = require('../../midleware/authorization');
const { compile, generatePdf } = require('../../services/pdfGenerator/index');
const _sendMail = require('../../services/email');
var { verifyRBForCod_Est } = require('../../services/dataValidation/index.js');
const Interrupcion = require('../../core/interruption/interruptionClass');

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

	IntRb.interruptionEmailAddress.push(IntRb.interruptionEmailSelf);
	var reportType = IntRb.interruptionType === 'Random' ? 'format_send_interruption' : 'format_send_interruption_p';
	interrupcionClass.createDataForReport(db, IntRb).then((dataForReport) => {
		compile(reportType, dataForReport, undefined).then((html) => {
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
			 </div>`,
				'ReporteInterrupcion'
			).then((response) => {
				// res.json('Test');
				_sendMail(undefined, IntRb.interruptionEmailAddress, 'Reporte de Interrupcion', undefined, undefined, [
					{
						filename: 'ReporteInterrupcion.pdf',
						path: path.join(process.cwd(), `ReporteInterrupcion.pdf`),
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
	const request = req.query;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.getInterruptionSelected(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json({ Error: error });
		});
});

router.get('/getComments', auth.requiereAuth, (req, res) => {
	const request = req.query;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.getComments(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json({ Error: error });
		});
});
router.get('/getStateInterruption', auth.requiereAuth, (req, res) => {
	const request = req.query;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.getStateInterruption(request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json({ Error: error });
		});
});

router.post('/interrupcion', auth.requiereAuth, function(req, res) {
	let request = req.body;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.getInterruption(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			// res.status(400).json(error);
			res.json({ total: 0, interrupciones: [] });
		});
});

router.put('/updateReport', auth.requiereAuth, function(req, res, next) {
	const request = req.query;
	const requestBody = req.body;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.updateReport(db, request, requestBody)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

router.post('/actions', auth.requiereAuth, (req, res, auth) => {
	const request = req.body;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.actionForInterruption(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

router.get('/getReport', auth.requiereAuth, function(req, res, next) {
	const request = req.query;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.getReportForInterruption(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
	// console.log(test,'pueba')
	// console.log(__dirname,"geys sh",process.cwd())
	// res.json('test')
});

router.get('/getInterruptionStats', auth.requiereAuth, (req, res, next) => {
	request = req.query;
	const interrupcionClass = new Interrupcion();
	interrupcionClass
		.getInterruptionStats(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

module.exports = router;

const express = require('express');
const router = express.Router();
var moment = require('moment-timezone');
const auth = require('../../midleware/authorization');
const RadioBases = require('../../core/radioBase/radiobasesClass');

require('dotenv').load();

// const knex = require('knex');
const db = require('../../knex');
// const db = knex({
// 	client: 'pg',
// 	connection: process.env.POSTGRES_URI
// });

router.get('/', function(req, res, next) {
	const request = req.query;
	const radiobase = new RadioBases();
	const query_search =
		Object.keys(request)[0] === 'id'
			? `CAST(no AS TEXT) LIKE '${req.query.id}%'`
			: `LOWER(est) LIKE LOWER('%${req.query.est}%')`;
	radiobase
		.getRadioBases(db, query_search)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

router.post('/StatusBaseStation', function(req, res, next) {
	const request = req.query;
	const requestBody = req.body;
	const radiobase = new RadioBases();
	var query_search = '';
	switch (Object.keys(request)[0]) {
		case 'nom_sit':
			query_search = `LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%')`;
			break;
		case 'cell_id':
			query_search = `cell_id LIKE '%${req.query.cell_id}%'`;
			break;
		case 'dir':
			query_search = `LOWER(dir) LIKE LOWER('%${req.query.dir}%')`;
			break;
		case 'parroquia':
			query_search = `LOWER(parroquia) LIKE LOWER('%${req.query.parroquia}%')`;
			break;
		default:
			break;
	}
	radiobase
		.getRadioBasesFilter(db, query_search, requestBody)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

router.get('/estructuras', function(req, res, next) {
	const request = req.query;
	const radiobase = new RadioBases();
	var query_search = '';

	switch (Object.keys(request)[0]) {
		case 'cell_id':
			query_search =
				request.id_user !== 'ARCOTEL'
					? `cell_id LIKE '%${req.query.cell_id}%' AND id_user=${request.id_user}`
					: `cell_id LIKE '%${req.query.cell_id}%'`;
			break;
		case 'nom_sit':
			query_search =
				request.id_user !== 'ARCOTEL'
					? `LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%') AND id_user=${request.id_user}`
					: `LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%')`;
			break;
		case 'cod_est':
			query_search =
				request.id_user !== 'ARCOTEL'
					? `LOWER(cod_est) LIKE LOWER('%${req.query.cod_est}%') AND id_user=${request.id_user}`
					: `LOWER(cod_est) LIKE LOWER('%${req.query.cod_est}%')`;
			break;
	}
	radiobase
		.getRadioBasesFilterIDUser(db, query_search, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

router.put('/updateRB', auth.requiereAuth, (req, res, next) => {
	var request = req.body;
	const radiobase = new RadioBases();
	radiobase
		.updateRadioBase(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json({ Error: error });
		});
	// ^([-+]?)([\d]{1,2})(((\.)(\d+)(,)))(\s*)(([-+]?)([\d]{1,3})((\.)(\d+))?)$
});

router.post('/getRadioBasesForLocation', auth.requiereAuth, (req, res, next) => {
	const request = req.query;
	const requestBody = req.body;
	if (requestBody.tecnologias_afectadas.includes('UMTS') || requestBody.tecnologias_afectadas.includes('LTE')) {
		requestBody.tecnologias_afectadas = requestBody.tecnologias_afectadas.concat('UMTS/LTE');
	}
	const radiobase = new RadioBases();
	radiobase
		.getRadiobaseForLocation(db, request, requestBody)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json({ Error: error });
		});
});

router.get('/addressInterruption', auth.requiereAuth, function(req, res, next) {
	const request = req.query;
	if (request.tecnologias_afectadas.includes('UMTS') || request.tecnologias_afectadas.includes('LTE')) {
		request.tecnologias_afectadas = request.tecnologias_afectadas.concat(',UMTS/LTE');
	}
	try {
		const radiobase = new RadioBases();
		radiobase
			.getRadioBasesForInterruption(db, request)
			.then((resp) => {
				res.json(resp);
			})
			.catch((error) => {
				res.status(400).json(error);
			});
	} catch (e) {
		console.log(e);
	}
});

router.get('/addressInterruptionForProvince', auth.requiereAuth, function(req, res, next) {
	const request = req.query;
	const radiobase = new RadioBases();
	radiobase
		.getRadioBasesInterruptionForProvince(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});
router.get('/addressInterruptionForCanton', auth.requiereAuth, function(req, res, next) {
	const request = req.query;
	const radiobase = new RadioBases();
	radiobase
		.getRadioBasesInterruptionForCanton(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});
router.get('/addressInterruptionForParish', auth.requiereAuth, function(req, res, next) {
	const request = req.query;
	const radiobase = new RadioBases();
	radiobase
		.getRadioBasesInterruptionForParish(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

router.post('/getRadioBasesCellId', auth.requiereAuth, function(req, res, next) {
	const request = req.body;
	const radiobase = new RadioBases();
	radiobase
		.getRadioBasesInterruptionForParish(db, request)
		.then((resp) => {
			res.json(resp);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

module.exports = router;

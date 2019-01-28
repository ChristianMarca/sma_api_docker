const express = require('express');
const router = express.Router();
const fs = require('fs');
// const {Client, Query} = require('pg');
const auth = require('../../midleware/authorization');
// var minifier = require('json-minifier')(specs);
require('dotenv').load();
// const knex = require('knex');
const db = require('../../knex');
// const db = knex({
// 	client: 'pg',
// 	connection: process.env.POSTGRES_URI
// });
// auth.requiereAuth
router.post('/updateRadiobase', auth.requiereAuth, function(req, res, next) {
	let uploadFile = req.files.file;
	const fileName = req.files.file.name;
	uploadFile.mv(`${__dirname}/${fileName}`, function(err) {
		if (err) {
			return res.status(500).send(err);
		}
		db
			.raw('SELECT updatedb(:path)', { path: `${__dirname}/${fileName}` })
			.then((resp) => {
				fs.unlink(`${__dirname}/${fileName}`, (err) => {
					if (err) throw err;
					console.log(`${`${__dirname}/${fileName}`} was deleted`);
				});
				res.json(`${__dirname}/${fileName}`);
			})
			.catch((error) => {
				res.status(500).json({ Error: error });
			});
		// setTimeout(() => {
		// 	fs.unlink(`${__dirname}/${fileName}`, (err) => {
		// 		if (err) throw err;
		// 		console.log(`${`${__dirname}/${fileName}`} was deleted`);
		// 	});
		// }, 5000);
		// res.json({
		// 	file: `public/${req.files.file.name}`
		// });
	});
});

module.exports = router;

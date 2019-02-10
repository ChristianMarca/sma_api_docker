const express = require('express');
const router = express.Router();
const fs = require('fs');
const auth = require('../../midleware/authorization');
require('dotenv').load();
const db = require('../../knex');

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
					console.log(`${`${__dirname}/${fileName}`} Fue eliminado`);
				});
				res.json(`${__dirname}/${fileName}`);
			})
			.catch((error) => {
				res.status(500).json({ Error: error });
			});
	});
});

module.exports = router;

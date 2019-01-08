const express = require('express');
const path = require('path');
const router = express.Router();
const knex = require('knex');
const passwordGenerator = require('./passwordGenerator');
const _sendMail = require('../../../services/email');
const { compile } = require('../../../services/pdfGenerator/index');
const registerDB = require('./registerDB');

const db = knex({
	client: 'pg',
	connection: process.env.POSTGRES_URI
});

const lengthPassword = 10;
/* GET home page. */
router.post('/', function(req, res, next) {
	const password = passwordGenerator.generate(
		{
			length: lengthPassword,
			numbers: true,
			symbols: false,
			uppercase: true,
			strict: true
		},
		req.body.email
	);
	req.body.password = password;
	registerDB(req.body)
		.then((data) => {
			compile(
				'email_template',
				{
					email: req.body.email,
					password
				},
				path.join(process.cwd(), 'services')
			)
				.then((html) => {
					_sendMail(undefined, req.body.email, undefined, undefined, html, undefined)
						.then((data) => {
							res.json(console.log('data', data));
						})
						.catch((error) => res.status(400).json('Fail'));
				})
				.then(() => {
					res.status(200).json({ title: 'Express', body: password });
				})
				.catch((e) => {
					res.status(500).json('Fail');
				});
		})
		.catch((e) => {
			res.status(400).json('console.log(e)');
		});
});

module.exports = router;

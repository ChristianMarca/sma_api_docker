const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');
const db = require('../../knex');
const signin = require('../../core/authentication/signin/signin');
const profile = require('../../core/authentication/profile/profile');
const auth = require('../../midleware/authorization');
require('dotenv').load();

router.post('/signin', signin.signinAuthentication(db, bcrypt));

router.get('/revokeToken', auth.requiereAuth, (req, res) => {
	signin.revokeToken(req, res);
});

router.get('/profile/:id', auth.requiereAuth, (req, res) => {
	profile.handleProfile(req, res, db);
});

router.post('/profile/:id', auth.requiereAuth, (req, res) => {
	profile.handleProfileUpdate(req, res, db);
});

router.get('/passwordValidate/:id&:password', auth.requiereAuth, (req, res) => {
	profile.handlePasswordValidate(req, res, db, bcrypt);
});

router.post('/passwordChange/:id&:password', auth.requiereAuth, (req, res) => {
	profile.updatePassword(req, res, db, bcrypt);
});

router.post('/dataChange/:id', auth.requiereAuth, (req, res) => {
	profile.updateData(req, res, db);
});

module.exports = router;

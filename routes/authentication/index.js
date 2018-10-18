const express = require('express');
const router = express.Router();
require('dotenv').load();
// const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
//const cors = require('cors');
var knex = require('knex')
//const morgan= require('morgan');

//const register = require('./controllers/register');
const signin = require('./signin/signin');
//const profile=require('./controllers/profile');
//const image=require('./controllers/image');
//const auth=require('./controllers/authorization');

const db=knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
  });


router.post('/signin', signin.signinAuthentication(db,bcrypt))


module.exports = router;
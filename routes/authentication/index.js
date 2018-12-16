const express = require('express');
const router = express.Router();
require('dotenv').load();
// const bodyParser = require('body-parser');
// replace package bcrypt for problems in native platforms
// const bcrypt = require('bcrypt');
const bcrypt =  require('bcrypt-nodejs');
//const cors = require('cors');
var knex = require('knex')
//const morgan= require('morgan');

//const register = require('./controllers/register');
const signin = require('./signin/signin');
const profile=require('./profile/profile');
const auth=require('./authorization');
//const image=require('./controllers/image');

const db=knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
  });


router.post('/signin', signin.signinAuthentication(db,bcrypt))

router.get('/revokeToken',auth.requiereAuth,(req,res)=>{ signin.revokeToken(req,res)})

router.get('/profile/:id',auth.requiereAuth,(req,res)=>{profile.handleProfile(req,res,db)} )

router.post('/profile/:id',auth.requiereAuth,(req,res)=>{profile.handleProfileUpdate(req,res,db)})

router.get('/passwordValidate/:id&:password',auth.requiereAuth,(req,res)=>{profile.handlePasswordValidate(req,res,db,bcrypt)});

router.post('/passwordChange/:id&:password',auth.requiereAuth,(req,res)=>{profile.updatePassword(req,res,db,bcrypt)});

router.post('/dataChange/:id',auth.requiereAuth,(req,res)=>{profile.updateData(req,res,db)})

module.exports = router;
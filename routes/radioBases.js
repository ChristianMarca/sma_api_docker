const express = require('express');
const router = express.Router();
require('dotenv').load();

const knex = require('knex')

const db=knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
});

/* GET home page. */
router.get('/', function(req, res, next) {
    const request = req.query;
    const query_search= Object.keys(request)[0]==='id'?`CAST(no AS TEXT) LIKE '${req.query.id}%'`:`LOWER(est) LIKE LOWER('%${req.query.est}%')`
    db.select('*')
        .from('radiobases')
        // .where(db.raw(`LOWER(id) LIKE LOWER('%${req.query.id}%')`))
        .where(db.raw(query_search))
        .then(user=>{
            if (user.length) {
                return res.json(user);
            }else{
                return res.status(404).json('Not Found')
            }
            }).catch(err=>{
                console.log(err)
                res.status(400).json('ERROR Getting DB')
            })
});

router.post('/newInterruption',function(req,res,next){
    // console.log(req.body)
    res.json(req.body)
})


module.exports = router;

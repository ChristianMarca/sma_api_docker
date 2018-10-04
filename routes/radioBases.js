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
        //.where(db.raw(`LOWER(id) LIKE LOWER('%${req.query.id}%')`))
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

/* GET home page. */
router.get('/test', function(req, res, next) {
    const request = req.query;
    const query_search= Object.keys(request)[0]==='cell_id'?`cell_id LIKE '%${req.query.cell_id}%'`:`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%')`
    db.select('id_bs','cell_id','nom_sit','dir','parroquia','canton','provincia')
        .from('radiobase')
        // .innerJoin('estado','id_estado1','id_estado')
        // .innerJoin('densidad','id_den1','id_den')
        // .innerJoin('tecnologia','id_tec1','id_tec')
        // .innerJoin('operador','id_operadora','id_operadora2')
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
    console.log(req.body)
    const IntRb=req.body;

    insertNewIntrruption=(req,res,db)=>{
        db.select('*')
        .from('radiobase')
        .innerJoin('estado','id_estado1','id_estado')
        .innerJoin('densidad','id_den1','id_den')
        .innerJoin('tecnologia','id_tec1','id_tec')
        .innerJoin('operador','id_operadora','id_operadora2')
        .where('id_bs',IntRb.interruptionRB.interruptionIdBs)
        .then(user=>{
            if (user.length) {
                db.transaction(
                    trx=>{
                        trx.insert({
                            fecha_inicio: IntRb.interruptionDate.interruptionStart,
                            fecha_fin: IntRb.interruptionDate.interruptionEnd,
                            duracion: IntRb.interruptionDate.interruptionTime,
                            causa: IntRb.interruptionCauses.interruptionCauses,
                            area: IntRb.interruptionRB.interruptionSector,
                            estado_int: 'Inicio',
                            id_operadora1: user[0].id_operadora,
                            id_tipo1: IntRb.interruptionType='Random'?2:1,
                            id_bs1: IntRb.interruptionRB.interruptionIdBs
                        })
                        .into('interrupcion')
                        .returning('id_bs1')
                        .then(Rb=>{
                            console.log('AQUI OBTENGOP',Rb)
                            db('radiobase')
                            .returning('*')
                            .where('id_bs',Rb[0])
                            .update("id_estado1",2)
                            .then(()=>console.log('Its OK'))
                            .catch(err=>console.log('Aqui esta',err))
                        })
                        .then(()=>{
                            console.log('Logr4o llegar')
                            res.status(200)
                        })
                        .then(trx.commit)//continua con la operacion
                        .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
                    }
                // ).catch(err=> res.status(400).json('unable to register'))
                ).catch(err=> {
                    console.log(err)
                    return res.status(400)})

                //return res.status(200)
                //return res.json(user);
            }else{
                return res.status(404).json('Not Found')
            }
            }).catch(err=>{
                console.log(err)
                res.status(400).json('ERROR Getting DB')
            })
            res.json(req.body)
    }
    //req.body.interruptionRB.interruptionIdBs?
    if(!req.body.interruptionRB.interruptionIdBs){
        console.log('here',req.body.interruptionRB.interruptionCode)
        db.select('id_bs')
            .from('radiobase')
            .where({
                cell_id:req.body.interruptionRB.interruptionCode.toUpperCase(),
                nom_sit:req.body.interruptionRB.interruptionBS.toUpperCase()
            })
            .then(user=>{
                console.log('user',user)
                if (user.length) {
                    IntRb.interruptionRB.interruptionIdBs=user[0].id_bs;
                    insertNewIntrruption(IntRb,res,db)
                    //  return res.json(user[0]);
                }else{
                     res.status(404).json('Not Found')
                }
                }).catch(err=>{
                    console.log(err)
                    res.status(400).json('ERROR Getting DB')
                })
        //res.status(404).json('No Existe la RB')
    }else{
        insertNewIntrruption(IntRb,res,db)
    }
})


module.exports = router;

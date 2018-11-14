const express = require('express');
const router = express.Router();
var verifyRb=require('../services/dataValidation/index.js');
require('dotenv').load();

const knex = require('knex')

const db=knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
});
// "editor.fontFamily": "'Droid Sans Mono', 'monospace', monospace, 'Droid Sans Fallback'",

// /* GET home page. */
// router.get('/', function(req, res, next) {
//     const request = req.query;
//     const query_search= Object.keys(request)[0]==='id'?`CAST(no AS TEXT) LIKE '${req.query.id}%'`:`LOWER(est) LIKE LOWER('%${req.query.est}%')`
//     db.select('*')
//         .from('radiobases')
//         //.where(db.raw(`LOWER(id) LIKE LOWER('%${req.query.id}%')`))
//         .where(db.raw(query_search))
//         .then(user=>{
//             if (user.length) {
//                 return res.json(JSON.parse(user));
//             }else{
//                 return res.status(404).json('Not Found')
//             }
//             }).catch(err=>{
//                 console.log(err)
//                 res.status(400).json('ERROR Getting DB')
//             })
// });

/* GET home page. */
router.get('/', function(req, res, next) {
    const request = req.query;
    console.log('///--///',request,'exmple')
    const query_search= Object.keys(request)[0]==='id'?`CAST(no AS TEXT) LIKE '${req.query.id}%'`:`LOWER(est) LIKE LOWER('%${req.query.est}%')`
    db.select('*')
        .from('radiobases')
        //.where(db.raw(`LOWER(id) LIKE LOWER('%${req.query.id}%')`))
        .where(db.raw(query_search))
        .then(user=>{
            if (user.length) {
                return res.json(JSON.parse(user));
            }else{
                return res.status(404).json('Not Found')
            }
            }).catch(err=>{
                console.log(err)
                res.status(400).json('ERROR Getting DB')
            })
});

router.post('/StatusBaseStation', function(req, res, next) {
    const request = req.query;
    console.log(req.body)
    var query_search='';
    switch(Object.keys(request)[0]){
        case 'nom_sit':
            query_search=`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%')`
            break;
        case 'cell_id':
            query_search=`cell_id LIKE '%${req.query.cell_id}%'`
            break;
        case 'dir':
            query_search=`LOWER(dir) LIKE LOWER('%${req.query.dir}%')`
            break;
        case 'parroquia':
            query_search=`LOWER(parroquia) LIKE LOWER('%${req.query.parroquia}%')`
            break;
        default:
            break;

    }
    req.body.dataSelected.length!==0?
        db.select('id_bs','cell_id','nom_sit','dir','parroquia','canton','provincia','lat_dec','long_dec')
            .from('radiobase')
            // .innerJoin('estado','id_estado1','id_estado')
            // .innerJoin('densidad','id_den1','id_den')
            .innerJoin('tecnologia','id_tec1','id_tec')
            .innerJoin('operador','id_operadora','id_operadora2')
            // .where(db.raw(`LOWER(id) LIKE LOWER('%${req.query.id}%')`))
            .where(db.raw(query_search))
            .andWhere(function(){
                this.whereIn('tecnologia',req.body.dataSelected)
            })
            .andWhere(function(){
                this.whereIn('operadora',req.body.dataSelected)
            })
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
        :db.select('id_bs','cell_id','nom_sit','dir','parroquia','canton','provincia','lat_dec','long_dec')
            .from('radiobase')
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
    const query_search= Object.keys(request)[0]==='cell_id'?`cell_id LIKE '%${req.query.cell_id}%' AND id_user=${request.id_user}`:`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%') AND id_user=${request.id_user}`
    db.select('id_bs','cell_id','nom_sit','dir','parroquia','canton','provincia')
        // .from('radiobase')
        .from('usuario')
        .innerJoin('lnk_operador','id_user2','id_user')
        .innerJoin('operador','id_operadora3','id_operadora')
        .innerJoin('radiobase','id_operadora2','id_operadora')
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
// /* GET home page. */
// router.get('/test', function(req, res, next) {
//     const request = req.query;
//     console.log('///--///',request,'exmple')
//     const query_search= Object.keys(request)[0]==='cell_id'?`cell_id LIKE '%${req.query.cell_id}%'`:`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%')`
//     db.select('id_bs','cell_id','nom_sit','dir','parroquia','canton','provincia')
//         .from('radiobase')
//         // .innerJoin('estado','id_estado1','id_estado')
//         // .innerJoin('densidad','id_den1','id_den')
//         // .innerJoin('tecnologia','id_tec1','id_tec')
//         // .innerJoin('operador','id_operadora','id_operadora2')
//         // .where(db.raw(`LOWER(id) LIKE LOWER('%${req.query.id}%')`))
//         .where(db.raw(query_search))
//         .then(user=>{
//             if (user.length) {
//                 return res.json(user);
//             }else{
//                 return res.status(404).json('Not Found')
//             }
//             }).catch(err=>{
//                 console.log(err)
//                 res.status(400).json('ERROR Getting DB')
//             })
// });

router.post('/newInterruption',function(req,res,next){
    var IntRb=req.body;
    verifyRb(IntRb)
        .then(data=>{
            IntRb.interruptionRadioBase.radioBasesAdd=data;
            console.log('START',IntRb)
            insertNewInterruption(IntRb,data,req,res,db)
            res.json(IntRb)
            })
        .catch(e=>{console.log(e)});
    
    insertRadioBases=async(trx,id_int,radiobases)=>{
        var RadioBasesg=
        radiobases.map((radiobase)=>{
                trx.insert({
                    id_inte2: id_int,
                    id_bs1: radiobase.interruptionIdBs
                })
                .into('lnk_interrupcion')
                .returning('id_inte2')
                .then(()=>console.log('OK'))
                .catch((e)=>{console.log('fallo2',e)});
        })
        return Promise.all(RadioBasesg)
    }
    insertServices=async(trx,id_int,services)=>{
        var Services= services.map((service)=>{
            return trx('servicio')
                .select()
                .where('servicio',service)
                .then(serv=>{
                    trx.insert({
                        id_inte3: id_int,
                        id_servicio1: serv[0].id_servicio
                    }).into('lnk_servicio')
                    .then(()=>{
                        return('OK')
                    })
                    .catch((e)=>console.log('Fail',e))
                })
                .catch((e)=>console.log('Fail',e))
        })
        return Promise.all(Services)
    };
    insertTechnologies=async(trx,id_int,technologies)=>{
        var Technologies= technologies.map((technology)=>{
            return trx('tecnologia')
                .select()
                .where('tecnologia',technology)
                .then(tec=>{
                    trx.insert({
                        id_inte4: id_int,
                        id_tec2: tec[0].id_tec
                    }).into('lnk_tecnologia')
                    .then(()=>{
                        return('OK')
                    })
                    .catch((e)=>console.log('Fail',e))
                })
                .catch((e)=>console.log('Fail',e))
        })
        return Promise.all(Technologies)
    };
    insertNewInterruption=async(IntInfo,RB,req,res,db)=>{
        return new Promise((resolve,reject)=>{
            db.transaction(
                trx=>{
                    trx('usuario')
                        .select('id_operadora3')
                        .innerJoin('lnk_operador','id_user','id_user2')
                        .where('id_user',IntRb.interruptionIdUser)
                        .then(data=>{
                            trx.insert({
                                fecha_inicio: IntInfo.interruptionDate.interruptionStart,
                                fecha_fin: IntInfo.interruptionDate.interruptionEnd,
                                duracion: IntInfo.interruptionDate.interruptionTime,
                                causa: IntInfo.interruptionCauses.interruptionCauses,
                                area: IntInfo.interruptionSector,
                                estado_int: 'Inicio',
                                id_operadora1: data[0].id_operadora3,
                                id_tipo1: IntInfo.interruptionType='Random'?2:1,
                            })
                            .into('interrupcion')
                            .returning('id_inte')
                            .then(interrupcion=>{
                                return insertRadioBases(trx,interrupcion[0],RB)
                                .then(()=>{
                                    return insertServices(trx,interrupcion[0],IntInfo.interruptionServices)
                                    .then(()=>{
                                        return insertTechnologies(trx,interrupcion[0],IntInfo.interruptionTechnologies)
                                        .then(()=>{
                                            resolve('OK');
                                        })
                                    })
                                })
                                .catch(e=>console.log(e))
                            })
                            .then(()=>{
                                res.status(200)
                            })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
                        })
                }
            // ).catch(err=> res.status(400).json('unable to register'))
            ).catch(err=> {
                console.log(err)
                return res.status(400)})
        })
    }
    //req.body.interruptionRB.interruptionIdBs?
    // if(!req.body.interruptionRB.interruptionIdBs){
    //     // console.log('here',req.body.interruptionRB.interruptionCode)
    //     db.select('id_bs')
    //         .from('radiobase')
    //         .where({
    //             cell_id:req.body.interruptionRB.interruptionCode.toUpperCase(),
    //             nom_sit:req.body.interruptionRB.interruptionBS.toUpperCase()
    //         })
    //         .then(user=>{
    //             console.log('user',user)
    //             if (user.length) {
    //                 IntRb.interruptionRB.interruptionIdBs=user[0].id_bs;
    //                 // insertNewInterruption(IntRb,res,db)
    //                  return res.json(user[0]);
    //             }else{
    //                  res.status(404).json('Not Found')
    //             }
    //             }).catch(err=>{
    //                 console.log(err)
    //                 res.status(400).json('ERROR Getting DB')
    //             })
    //     //res.status(404).json('No Existe la RB')
    // }else{
    //     res.json('ok')
    //     // insertNewInterruption(IntRb,res,db)
    // }
})


module.exports = router;

// insertNewInterruption=(req,res,db)=>{
//     db.select('*')
//     .from('radiobase')
//     .innerJoin('estado','id_estado1','id_estado')   
//     .innerJoin('densidad','id_den1','id_den')
//     .innerJoin('tecnologia','id_tec1','id_tec')
//     .innerJoin('operador','id_operadora','id_operadora2')
//     .where('id_bs',IntRb.interruptionRB.interruptionIdBs)
//     .then(user=>{
//         if (user.length) {
//             db.transaction(
//                 trx=>{
//                     trx.insert({
//                         fecha_inicio: IntRb.interruptionDate.interruptionStart,
//                         fecha_fin: IntRb.interruptionDate.interruptionEnd,
//                         duracion: IntRb.interruptionDate.interruptionTime,
//                         causa: IntRb.interruptionCauses.interruptionCauses,
//                         area: IntRb.interruptionRB.interruptionSector,
//                         estado_int: 'Inicio',
//                         id_operadora1: user[0].id_operadora,
//                         id_tipo1: IntRb.interruptionType='Random'?2:1,
//                         id_bs1: IntRb.interruptionRB.interruptionIdBs
//                     })
//                     .into('interrupcion')
//                     .returning('id_bs1')
//                     .then(Rb=>{
//                         console.log('AQUI OBTENGOP',Rb)
//                         db('radiobase')
//                         .returning('*')
//                         .where('id_bs',Rb[0])
//                         .update("id_estado1",2)
//                         .then(()=>console.log('Its OK'))
//                         .catch(err=>console.log('Aqui esta',err))
//                     })
//                     .then(()=>{
//                         console.log('Logr4o llegar')
//                         res.status(200)
//                     })
//                     .then(trx.commit)//continua con la operacion
//                     .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
//                 }
//             // ).catch(err=> res.status(400).json('unable to register'))
//             ).catch(err=> {
//                 console.log(err)
//                 return res.status(400)})

//             //return res.status(200)
//             //return res.json(user);
//         }else{
//             return res.status(404).json('Not Found')
//         }
//         }).catch(err=>{
//             console.log(err)
//             res.status(400).json('ERROR Getting DB')
//         })
//         res.json(req.body)
// }
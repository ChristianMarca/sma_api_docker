const express = require('express');
const router = express.Router();
const moment = require('moment');
var {verifyRb,verifyRBForCod_Est}=require('../services/dataValidation/index.js');
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
                res.status(400).json('ERROR Getting DB')
            })
});

router.post('/StatusBaseStation', function(req, res, next) {
    const request = req.query;
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
                    res.status(400).json('ERROR Getting DB')
                })
});
/* GET home page. */
router.get('/test', function(req, res, next) {
    const request = req.query;
    // const query_search= Object.keys(request)[0]==='cell_id'?`cell_id LIKE '%${req.query.cell_id}%' AND id_user=${request.id_user}`:`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%') AND id_user=${request.id_user}`
    // const query_search= Object.keys(request)[0]==='cell_id'?`cell_id LIKE '%${req.query.cell_id}%' AND id_user=${request.id_user}`:`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%') AND id_user=${request.id_user}`
    var query_search='';
    switch(Object.keys(request)[0]){
        case 'cell_id':
            query_search=`cell_id LIKE '%${req.query.cell_id}%' AND id_user=${request.id_user}`
            break
        case 'nom_sit':
            query_search=`LOWER(nom_sit) LIKE LOWER('%${req.query.nom_sit}%') AND id_user=${request.id_user}`
            break
        case 'cod_est':
            query_search=`LOWER(cod_est) LIKE LOWER('%${req.query.cod_est}%') AND id_user=${request.id_user}`
            break
    }
    db.select('id_bs','cell_id','cod_est','nom_sit','dir','parroquia','canton','provincia')
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
                res.status(400).json('ERROR Getting DB')
            })
});

router.post('/getRadioBasesForLocation',(req,res,next)=>{
    const request = req.query;
    const requestBody= req.body;
    return new Promise((resolve,reject)=>{
        // switch(request.interr)
        db.transaction(
            trx=>{
                switch(requestBody.nivel_interrupcion){
                    case 'PROVINCIA':
                        return trx('usuario')
                            .select('cod_est')
                            .innerJoin('lnk_operador','id_user2','id_user')
                            .innerJoin('operador','id_operadora3','id_operadora')
                            .innerJoin('radiobase','id_operadora2','id_operadora')
                            .innerJoin('tecnologia','id_tec','id_tec1')
                            .whereIn('tecnologia',requestBody.tecnologias_afectadas)
                            .andWhere('id_user',request.id_user)
                            .andWhere('provincia',requestBody.location.provincia)
                            .groupBy('cod_est')
                            .orderBy('cod_est')
                            .then(data=>{
                                return trx('usuario')
                                    .select('id_bs','cod_est','cell_id')
                                    .innerJoin('lnk_operador','id_user2','id_user')
                                    .innerJoin('operador','id_operadora3','id_operadora')
                                    .innerJoin('radiobase','id_operadora2','id_operadora')
                                    .innerJoin('tecnologia','id_tec','id_tec1')
                                    .whereIn('tecnologia',requestBody.tecnologias_afectadas)
                                    .andWhere('id_user',request.id_user)
                                    .andWhere('provincia',requestBody.location.provincia)
                                    .then((data_count)=>{
                                        resolve(res.json({
                                            codigo_estacion:data,
                                            cell_ids:data_count
                                        }))
                                    })
                                        
                            })
                            // .then(()=>{
                            //     res.status(200)
                            // })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                     case 'CANTON':
                        return trx('usuario')
                            .select('cod_est')
                            .innerJoin('lnk_operador','id_user2','id_user')
                            .innerJoin('operador','id_operadora3','id_operadora')
                            .innerJoin('radiobase','id_operadora2','id_operadora')
                            .innerJoin('tecnologia','id_tec','id_tec1')
                            .whereIn('tecnologia',requestBody.tecnologias_afectadas)
                            .andWhere('id_user',request.id_user)
                            .andWhere('provincia',requestBody.location.provincia)
                            .andWhere('canton',requestBody.location.canton)
                            .groupBy('cod_est')
                            .orderBy('cod_est')
                            .then(data=>{
                                return trx('usuario')
                                    .select('id_bs','cod_est','cell_id')
                                    .innerJoin('lnk_operador','id_user2','id_user')
                                    .innerJoin('operador','id_operadora3','id_operadora')
                                    .innerJoin('radiobase','id_operadora2','id_operadora')
                                    .innerJoin('tecnologia','id_tec','id_tec1')
                                    .whereIn('tecnologia',requestBody.tecnologias_afectadas)
                                    .andWhere('id_user',request.id_user)
                                    .andWhere('provincia',requestBody.location.provincia)
                                    .andWhere('canton',requestBody.location.canton)
                                    .then((data_count)=>{
                                        resolve(res.json({
                                            codigo_estacion:data,
                                            cell_ids:data_count
                                        }))
                                    })
                            })
                            // .then(()=>{
                            //     res.status(200)
                            // })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                    case 'PARROQUIA':
                        return trx('usuario')
                            .select('cod_est')
                            .innerJoin('lnk_operador','id_user2','id_user')
                            .innerJoin('operador','id_operadora3','id_operadora')
                            .innerJoin('radiobase','id_operadora2','id_operadora')
                            .innerJoin('tecnologia','id_tec','id_tec1')
                            .whereIn('tecnologia',requestBody.tecnologias_afectadas)
                            .andWhere('id_user',request.id_user)
                            .andWhere('provincia',requestBody.location.provincia)
                            .andWhere('canton',requestBody.location.canton)
                            .andWhere('parroquia',requestBody.location.parroquia)
                            .groupBy('cod_est')
                            .orderBy('cod_est')
                            .then(data=>{
                                return trx('usuario')
                                    .select('id_bs','cod_est','cell_id')
                                    .innerJoin('lnk_operador','id_user2','id_user')
                                    .innerJoin('operador','id_operadora3','id_operadora')
                                    .innerJoin('radiobase','id_operadora2','id_operadora')
                                    .innerJoin('tecnologia','id_tec','id_tec1')
                                    .whereIn('tecnologia',requestBody.tecnologias_afectadas)
                                    .andWhere('id_user',request.id_user)
                                    .andWhere('provincia',requestBody.location.provincia)
                                    .andWhere('canton',requestBody.location.canton)
                                    .andWhere('parroquia',requestBody.location.parroquia)
                                    .then((data_count)=>{
                                        resolve(res.json({
                                            codigo_estacion:data,
                                            cell_ids:data_count
                                        }))
                                    })
                            })
                            // .then(()=>{
                            //     res.status(200)
                            // })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                        
                }
                })
            }
        // ).catch(err=> res.status(400).json('unable to register'))
        ).catch(err=> {
            return res.status(400)})

})

router.get('/addressInterruption', function(req, res, next) {
    const request = req.query;
    return new Promise((resolve,reject)=>{
        // switch(request.interr)
        db.transaction(
            trx=>{
                switch(request.nivel_interrupcion){
                    case 'PROVINCIA':
                        return trx('usuario')
                            .select('provincia')
                            .innerJoin('lnk_operador','id_user2','id_user')
                            .innerJoin('operador','id_operadora3','id_operadora')
                            .innerJoin('radiobase','id_operadora2','id_operadora')
                            .innerJoin('tecnologia','id_tec','id_tec1')
                            .whereIn('tecnologia',request.tecnologias_afectadas.split(','))
                            .andWhere('id_user',request.id_user)
                            .andWhere(db.raw(`LOWER(provincia) LIKE LOWER('%${request.provincia}%')`))
                            .groupBy('provincia')
                            .orderBy('provincia')
                            .then(data=>{
                                resolve(res.json(data))
                            })
                            // .then(()=>{
                            //     res.status(200)
                            // })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                     case 'CANTON':
                            return trx('usuario')
                                .select('provincia','canton')
                                .innerJoin('lnk_operador','id_user2','id_user')
                                .innerJoin('operador','id_operadora3','id_operadora')
                                .innerJoin('radiobase','id_operadora2','id_operadora')
                                .innerJoin('tecnologia','id_tec','id_tec1')
                                .whereIn('tecnologia',request.tecnologias_afectadas.split(','))
                                .andWhere('id_user',request.id_user)
                                .andWhere(db.raw(`LOWER(canton) LIKE LOWER('%${request.canton}%')`))
                                .groupBy('provincia','canton')
                                .orderBy('canton')
                                .then(data=>{
                                    res.json(data)
                                })
                                // .then(()=>{
                                //     res.status(200)
                                // })
                                .then(trx.commit)//continua con la operacion
                                .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                    case 'PARROQUIA':
                        return trx('usuario')
                            .select('provincia','canton','parroquia')
                            .innerJoin('lnk_operador','id_user2','id_user')
                            .innerJoin('operador','id_operadora3','id_operadora')
                            .innerJoin('radiobase','id_operadora2','id_operadora')
                            .innerJoin('tecnologia','id_tec','id_tec1')
                            .whereIn('tecnologia',request.tecnologias_afectadas.split(','))
                            .andWhere('id_user',request.id_user)
                            .andWhere(db.raw(`LOWER(parroquia) LIKE LOWER('%${request.parroquia}%')`))
                            .groupBy('provincia','canton','parroquia')
                            .orderBy('parroquia')
                            .then(data=>{
                                res.json(data)
                            })
                            // .then(()=>{
                            //     res.status(200)
                            // })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                }
                })
            }
        // ).catch(err=> res.status(400).json('unable to register'))
        ).catch(err=> {
            return res.status(400)})

    // db.select('provincia')
    //     .from('radiobase')
    //     .innerJoin('tecnologia','id_tec1','id_tec')
    //     .where(db.raw(`LOWER(provincia) LIKE LOWER('%${request.provincia}%')`))
    //     .groupBy('provincia')
    //     .orderBy('provincia')
    //     .then((provincias)=>{
    //         if (provincias.length) {
    //             console.log(provincias,'asdda')
    //             return res.json(provincias);
    //         }else{
    //             return res.status(404).json('Not Found')
    //         }
    //     }).catch(err=>{
    //         console.log(err)
    //         res.status(400).json('ERROR Getting DB')
    //     })
    // res.json([{provincia: 'pk'}])
});

router.get('/address', function(req, res, next) {
    const request = req.query;
    // return new Promise((resolve,reject)=>{
    //     db.transaction(
    //         trx=>{
    //             trx('radiobase')
    //                 .select('provincia')
    //                 .innerJoin('tecnologia','id_tec','id_tec1')
    //                 .where('tecnologia',req.interruptionIdUser)
    //                 .then(data=>{
                     
    //                     })
    //                     .into('interrupcion')
    //                     .returning('id_inte')
    //                     .then(interrupcion=>{
                        
    //                     })
    //                     .then(()=>{
    //                         res.status(200)
    //                     })
    //                     .then(trx.commit)//continua con la operacion
    //                     .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
    //                 })
    //         }
    //     // ).catch(err=> res.status(400).json('unable to register'))
    //     ).catch(err=> {
    //         console.log(err)
    //         return res.status(400)})
    // })
    db.select('provincia')
        .from('radiobase')
        .where(db.raw(`LOWER(provincia) LIKE LOWER('%${request.provincia}%')`))
        .groupBy('provincia')
        .orderBy('provincia')
        .then((provincias)=>{
            if (provincias.length) {
                return res.json(provincias);
            }else{
                return res.status(404).json('Not Found')
            }
        }).catch(err=>{
            res.status(400).json('ERROR Getting DB')
        })
});
router.get('/address1', function(req, res, next) {
    const request = req.query;
    db.select('provincia','canton')
        .from('radiobase')
        .where(db.raw(`LOWER(canton) LIKE LOWER('%${request.canton}%')`))
        .groupBy('provincia','canton')
        .orderBy('canton')
        .then((cantones)=>{
            if (cantones.length) {
                return res.json(cantones);
            }else{
                return res.status(404).json('Not Found')
            }
        }).catch(err=>{
            res.status(400).json('ERROR Getting DB')
        })
});
router.get('/address2', function(req, res, next) {
    const request = req.query;
    db.select('provincia','canton','parroquia')
        .from('radiobase')
        .where(db.raw(`LOWER(parroquia) LIKE LOWER('%${request.parroquia}%')`))
        .groupBy('provincia','canton','parroquia')
        .orderBy('parroquia')
        .then((parroquias)=>{
            if (parroquias.length) {
                return res.json(parroquias);
            }else{
                return res.status(404).json('Not Found')
            }
        }).catch(err=>{
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
router.post('/newInterruption',(req,res,next)=>{
    var IntRb=req.body;
    // console.log('testenadoo .>>>>>',IntRb)
    verifyRBForCod_Est(IntRb)
        .then(data=>{
            // IntRb.interruptionRadioBase.radioBasesAdd=data;
            insertNewInterruption(data,req,res,db)
            res.json({IntRb,data})
            })
        .catch(e=>{console.log(e)});
    insertRadioBases=async(trx,id_int,radiobases)=>{
        var RadioBasesg=
        radiobases.map((radiobase)=>{
                trx.insert({
                    id_inte2: id_int,
                    id_bs1: radiobase.id_bs
                })
                .into('lnk_interrupcion')
                .returning('id_inte2')
                // .then(()=>console.log('OK'))
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
    createInterruptionRev=async(trx,id_int)=>{
        // var Technologies= technologies.map((technology)=>{
            return trx.insert({
                        id_inte6: id_int,
                        id_rev: id_int,
                        id_arc1:1
                    }).into('interrupcion_rev')
                    .then(()=>{
                        return('Creado Nueva Revisión de Interrupcion')
                    })
                    .catch((e)=>console.log('Fail',e))
    };
    insertNewInterruption=async(RB,req,res,db)=>{
        return new Promise((resolve,reject)=>{
            db.transaction(
                trx=>{
                    trx('usuario')
                        .select('id_operadora3')
                        .innerJoin('lnk_operador','id_user','id_user2')
                        .where('id_user',RB.interruptionIdUser)
                        .then(data=>{
                            console.log('test k',RB)
                            trx.insert({
                                fecha_inicio: RB.interruptionDate.interruptionStart,
                                fecha_fin: RB.interruptionDate.interruptionEnd,
                                duracion: RB.interruptionDate.interruptionTime,
                                causa: RB.interruptionCauses.interruptionCauses,
                                // area: RB.interruptionSector,
                                area: RB.interruptionRB.interruptionSector,
                                estado_int: 'Inicio',
                                id_operadora1: data[0].id_operadora3,
                                id_tipo1: RB.interruptionType==='Random'?2:1,
                                nivel_interrupcion: RB.interruptionRB.interruptionLevel,
                                provincia_inte:RB.interruptionRB.interruptionProvince,
                                canton_inte:RB.interruptionRB.interruptionCanton,
                                parroquia_inte:RB.interruptionRB.interruptionParish
                            })
                            .into('interrupcion')
                            .returning('id_inte')
                            .then(interrupcion=>{
                                return insertRadioBases(trx,interrupcion[0],RB.interruptionRadioBase.radioBasesAddID_BS)
                                .then(()=>{
                                    return insertServices(trx,interrupcion[0],RB.interruptionServices)
                                    .then(()=>{
                                        return insertTechnologies(trx,interrupcion[0],RB.interruptionTechnologies)
                                        .then(()=>{
                                            return createInterruptionRev(trx,interrupcion[0])
                                                .then(data=>resolve('OK'))
                                        })
                                    })
                                })
                                .catch(e=>console.log(e))
                            })
                            .then((e)=>{
                                console.log(e)
                                res.status(200)
                            })
                            .then(trx.commit)//continua con la operacion
                            .catch(err=>{
                                console.log(err);
                                return trx.rollback
                            })//Si no es posible elimna el proces0
                        })
                }
            // ).catch(err=> res.status(400).json('unable to register'))
            ).catch(err=> {
                return res.status(400)})
        })
    }
    // res.json(rasult)
})

router.post('/newInterruptionTest',function(req,res,next){
    var IntRb=req.body;
    verifyRb(IntRb)
        .then(data=>{
            IntRb.interruptionRadioBase.radioBasesAdd=data;
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
                // .then(()=>console.log('OK'))
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
                            .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
                        })
                }
            // ).catch(err=> res.status(400).json('unable to register'))
            ).catch(err=> {
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
});

router.post('/getRadioBasesCellId',function(req,res,next){
    db.transaction(
        trx=>{
            trx('radiobase')
                .select('id_bs','cell_id','cod_est','id_operadora2')
                .where('id_bs',req.body.interruptionIdBs)
                .then(data=>{
                    return trx('radiobase')
                        .select('id_bs','cell_id','cod_est','nom_sit','dir','parroquia','canton','provincia')
                        .where({
                            'cod_est':data[0].cod_est,
                            'id_operadora2':data[0].id_operadora2
                        })
                        .then(radiobases=>{
                            return res.json(console.log('SE RESOLVIO', radiobases))
                        })
                }).then(trx.commit)//continua con la operacion
                .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
        }
    // ).catch(err=> res.status(400).json('unable to register'))
    ).catch(err=> {
        return res.status(400)})
    // res.json('ok')

})

router.get('/interruptionSelected',function(req,res,next){
    console.log(';salfkjdf///',req.query)
    db.transaction(
        trx=>{
            trx('usuario')
                .select('*')
                .innerJoin('lnk_operador','id_user','id_user2')
                .innerJoin('operador','id_operadora','id_operadora3')
                .innerJoin('interrupcion','id_operadora','id_operadora1')
                .innerJoin('tipo_interrupcion','id_tipo','id_tipo1')
                // .innerJoin('lnk_tecnologia','id_inte','id_inte4')
                // .innerJoin('tecnologia','id_tec','id_tec2')
                // .where('id_user',req.query.id_user)
                .andWhere('id_inte',req.query.id_interruption)
                .then(data=>{
                    // res.json(data)
                    return trx('lnk_tecnologia')
                        .innerJoin('tecnologia','id_tec','id_tec2')
                        .select('tecnologia')
                        .where({
                            'id_inte4':data[0].id_inte,
                            // 'id_operadora2':data[0].id_operadora2
                        })
                        .then(technologies=>{
                            return trx('lnk_servicio')
                                .innerJoin('servicio','id_servicio','id_servicio1')
                                .select('servicio')
                                .where({
                                    'id_inte3':data[0].id_inte,
                                    // 'id_operadora2':data[0].id_operadora2
                                })
                                .then(services=>{
                                    return res.json({data:data[0],technologies,services})
                                })
                        })
                }).then(trx.commit)//continua con la operacion
                .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
        }
    // ).catch(err=> res.status(400).json('unable to register'))
    ).catch(err=> {
        return res.status(400)})
    // res.json('ok')

})

router.get('/interruptionTime',function(req,res,next){
    calculateTime=(start_date)=>{
        const now  = start_date;
        const then = moment();
        const ms = moment(now,"DD/MM/YYYY HH:mm:ss").diff(moment(then,"DD/MM/YYYY HH:mm:ss"));
        const d = moment.duration(ms);
        const s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
        return(s)
      }
      
      interruption=async(id_interrupcion)=>{
        return new Promise((resolve,reject)=>{
          db.transaction(
            trx=>{
                trx('interrupcion')
                    .select('*')
                    .where('id_inte',id_interrupcion)
                    .then(data=>{
                        resolve(data[0].fecha_fin)
                    }).then(trx.commit)//continua con la operacion
                    .catch(err=>{return trx.rollback})//Si no es posible elimna el proces0
            }
        ).catch(err=> {
            return res.status(400)})  
        })
      }
    //   res.json('hel')
    if(req.query.interruption_id!=='undefined'){
        interruption(req.query.interruption_id)
              .then(data=>{
                const time_falta=calculateTime(data)
                res.json({countdown:time_falta})
              })
    }else{
        res.status(400).json('No Found Interruption')
    }
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
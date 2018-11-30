const knex = require('knex');
require('dotenv').load();

const db=knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
  });

const verifyRBForCod_Est=async(IntRb,validar=validarCodEstFunction)=>{
  var Estaciones= Object.keys(IntRb.interruptionRadioBase.radioBasesAdd).map(key=>{
    return Object.keys(IntRb.interruptionRadioBase.radioBasesAdd[key]).map(key_=>{
        return IntRb.interruptionRadioBase.radioBasesAdd[key][key_]
    })
  })
  var Elements= validar(Estaciones,IntRb)
          .then(data=>{
            IntRb.interruptionRadioBase.radioBasesAddID_BS=data;
            // return(IntRb.interruptionRadioBase.radioBasesAdd);
            return(IntRb)
          })
          .catch(e=>('Fail'))
  return Promise.resolve(Elements)

  // var Elements = Object.keys(IntRb.interruptionRadioBase.radioBasesAdd).map(key=>{
  //   return Object.keys(IntRb.interruptionRadioBase.radioBasesAdd[key]).map(key_=>{
  //       // return IntRb.interruptionRadioBase.radioBasesAdd[key][key_]
  //       return validar(IntRb.interruptionRadioBase.radioBasesAdd[key][key_],IntRb)
  //         .then(data=>{
  //           console.log('testfata',data,IntRb)
  //           // IntRb.interruptionRadioBase.radioBasesAdd[key].interruptionIdBs=data;
  //           // return(IntRb.interruptionRadioBase.radioBasesAdd[key]);
  //         })
  //         .catch(e=>('Fail'))
  //   })
  // })
  // var Elements= Object.keys(estructuras).map(function(key, index) {
  //   return validar(estru[key])
  //     .then(data=>{
  //       radiobases.interruptionRadioBase.radioBasesAdd[key].interruptionIdBs=data;
  //       return(radiobases.interruptionRadioBase.radioBasesAdd[key]);
  //     })
  //     .catch(e=>('Fail'))
  // })
  
}

const verifyRB=async (radiobases,validar=validarFunction)=>{
    // var dataToAnalisis=Object.keys(radiobases.interruptionRadioBase.radioBasesAdd);
    var Elements= Object.keys(radiobases.interruptionRadioBase.radioBasesAdd).map(function(key, index) {
          return validar(radiobases.interruptionRadioBase.radioBasesAdd[key])
            .then(data=>{
              radiobases.interruptionRadioBase.radioBasesAdd[key].interruptionIdBs=data;
              return(radiobases.interruptionRadioBase.radioBasesAdd[key]);
            })
            .catch(e=>('Fail'))
        })
    return Promise.all(Elements)
  }
validarFunction=async (RB)=>{
  return new Promise((resolve,reject)=>{
  if(!RB.interruptionIdBs){
      db.select('id_bs')
          .from('radiobase')
          .where({
              cell_id:RB.interruptionCode.toUpperCase(),
              nom_sit:RB.interruptionBS.toUpperCase()
          })
          .then(user=>{
              // console.log('user',user)
              if (user.length) {
                // newData.interruptionIdBs=user[0].id_bs;
                console.log('here','EXAMPLE',RB,user.radioBasesAdd.S100)
                  resolve( RB.interruptionIdBs=user[0].id_bs);
                  // insertNewInterruption(IntRb,res,db)
                  //  return res.json(user[0]);
              }else{
                  //  res.status(404).json('Not Found')
                  reject('Not Found')
              }
              }).catch(err=>{
                  console.log(err)
                  // res.status(400).json('ERROR Getting DB')
                  reject('ERROR')
              })
      //res.status(404).json('No Existe la RB')
    }else{
      resolve(RB.interruptionIdBs)
      // insertNewInterruption(IntRb,res,db)
    }
  })
  // return newData
};
validarCodEstFunction=async (RB,IntRb)=>{
  return new Promise((resolve,reject)=>{
    console.log('asd//d/7/',RB,IntRb)
    // resolve(RB)
    db.transaction(
      trx=>{
          trx('usuario')
            .select('id_bs')
            .innerJoin('lnk_operador','id_user2','id_user')
            .innerJoin('operador','id_operadora3','id_operadora')
            .innerJoin('radiobase','id_operadora2','id_operadora')
            .innerJoin('tecnologia','id_tec','id_tec1')
            .whereIn('tecnologia',IntRb.interruptionTechnologies)
            .andWhere('id_user',IntRb.interruptionIdUser)
            // .andWhere('provincia',IntRb.interruptionProvince)
            // .andWhere('canton',IntRb.interruptionCanton)
            // .andWhere('parroquia',IntRb.interruptionParish)
            .andWhere('cod_est','in',RB)
            .groupBy('id_bs')
            .orderBy('id_bs')
            .then(data=>{
                resolve(data)
            })
            // .then(()=>{
            //     res.status(200)
            // })
            .then(trx.commit)//continua con la operacion
            .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
          
  // if(!RB.interruptionIdBs){
  //     db.select('id_bs')
  //         .from('radiobase')
  //         .where({
  //             cell_id:RB.interruptionCode.toUpperCase(),
  //             nom_sit:RB.interruptionBS.toUpperCase()
  //         })
  //         .then(user=>{
  //             // console.log('user',user)
  //             if (user.length) {
  //               // newData.interruptionIdBs=user[0].id_bs;
  //               // console.log('here','EXAMPLE',RB,user[0].id_bs)
  //                 resolve( RB.interruptionIdBs=user[0].id_bs);
  //                 // insertNewInterruption(IntRb,res,db)
  //                 //  return res.json(user[0]);
  //             }else{
  //                 //  res.status(404).json('Not Found')
  //                 reject('Not Found')
  //             }
  //             }).catch(err=>{
  //                 console.log(err)
  //                 // res.status(400).json('ERROR Getting DB')
  //                 reject('ERROR')
  //             })
  //     //res.status(404).json('No Existe la RB')
  //   }else{
  //     resolve(RB.interruptionIdBs)
  //     // insertNewInterruption(IntRb,res,db)
  //   }
  })
})
  // return newData
}

module.exports={
  verifyRB,
  verifyRBForCod_Est
};


// if(!req.body.interruptionRB.interruptionIdBs){
      //   // console.log('here',req.body.interruptionRB.interruptionCode)
      //   db.select('id_bs')
      //       .from('radiobase')
      //       .where({
      //           cell_id:req.body.interruptionRB.interruptionCode.toUpperCase(),
      //           nom_sit:req.body.interruptionRB.interruptionBS.toUpperCase()
      //       })
      //       .then(user=>{
      //           console.log('user',user)
      //           if (user.length) {
      //               IntRb.interruptionRB.interruptionIdBs=user[0].id_bs;
      //               // insertNewInterruption(IntRb,res,db)
      //                return res.json(user[0]);
      //           }else{
      //                res.status(404).json('Not Found')
      //           }
      //           }).catch(err=>{
      //               console.log(err)
      //               res.status(400).json('ERROR Getting DB')
      //           })
      //   //res.status(404).json('No Existe la RB')
      // }else{
      //   res.json('ok')
      //   // insertNewInterruption(IntRb,res,db)
      // }
const knex = require('knex');
require('dotenv').load();

const db=knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
  });

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
                // console.log('here','EXAMPLE',RB,user[0].id_bs)
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
}

module.exports=verifyRB;


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
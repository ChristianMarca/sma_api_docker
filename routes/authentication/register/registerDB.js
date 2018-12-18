// const bcrypt = require('bcrypt');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
require('dotenv').load();

const db=knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
  });

const nombre="name";
const apellido="lastName";
const username="user";
const telefono='0000000000';

registerDB=async (data)=>{
  return new Promise((resolve,reject)=>{
    var id_rol=1;
    if(data.rol==='OPERADOR'){
      id_rol=2;
    }
    // bcrypt.hash(data.password, 10, function(err, hash) {
    bcrypt.hash(data.password,null,null, function(err, hash) {
          if(err){
              reject('Failed')
          }
          else{
              db.transaction(trx=>{
                  trx.insert({
                    nombre,
                    apellido,
                    email: data.email,
                    username,
                    telefono,
                    id_rol1:id_rol
                  })
                  .into('usuario')
                  .returning(['email','id_user'])
                  .then(user=>{
                    if(data.rol==='OPERADOR'){
                      trx.select('*')
                        .from('operador')
                        .where('operadora',data.operator)
                        .then(usuario=>{
                          return trx('lnk_operador')
                          .returning('*')
                          .insert({
                            id_operadora3:usuario[0].id_operadora,
                            id_user2:user[0].id_user
                          })
                          .then(user=>{
                            //   res.json(user[0])
                            // console.log('User',user[0])
                          })
                          .catch(e=>{
                            reject('Failed')
                          })
                        })
                    }
                      return trx('login')
                      .returning('*')
                      .insert({
                        hash,
                        email:user[0].email,
                        id_user1:user[0].id_user
                      })
                      .then(user=>{
                        //   res.json(user[0])
                        resolve(user[0])
                      })
                      .catch(e=>{
                        reject('Failed2')
                      })
                  })
                  .then(trx.commit)//continua con la operacion
                  .catch(trx.rollback)//Si no es posible elimna el proces0
            //   }).catch(err=> res.status(400).json('unable to register'))
            }).catch(err=> reject('unable to register'))
          }
      });
  })
}
module.exports=registerDB;
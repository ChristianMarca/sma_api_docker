const bcrypt = require('bcrypt');
const knex = require('knex');
require('dotenv').load();

const db=knex({
    client: 'pg',
    connection: process.env.POSTGRES_URI
  });

const password="1234";
const email="b@h.com"
// const id_user1=1;

const nombre="Mercedes";
const apellido="Guaraca";
const username="Meche";
const telefono='0856274564';
const id_rol1=1;

bcrypt.hash(password, 10, function(err, hash) {
      if(err){
          console.log('Falied')
      }
      else{
          db.transaction(trx=>{
              trx.insert({
                  hash,
                  email  
              })
              .into('login')
              .returning(['email','id_login'])
              .then(login=>{
                  console.log(login)
                  return trx('usuario')
                  .returning('*')
                  .insert({
                      email: login[0].email,
                      nombre,
                      apellido,
                      username,
                      telefono,
                      id_rol1,
                      id_login1:login[0].id_login
                  })
                  .then(user=>{
                    //   res.json(user[0])
                    console.log('No sale',user[0])
                  })
              })
              .then(trx.commit)//continua con la operacion
            //   .then((inserts)=>{return console.log(inserts,'book saved')})
              .catch(trx.rollback)//Si no es posible elimna el proces0
        //   }).catch(err=> res.status(400).json('unable to register'))
        }).catch(err=> console.log('unable to register', err))
      }
  });

  console.log('salio?')
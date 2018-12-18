const express = require('express');
const router= express.Router();
const moment = require('moment');
const {Usuarios} = require('./classes/users');
require('dotenv').load();

const usuarios= new Usuarios();
const knex = require('knex')

const db=knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
});

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

const crearMensaje = (nombre, mensaje,id_user,id_interruption) => {

  return {
      nombre,
      mensaje,
      id_user,
      id_interruption,
      fecha: moment().format('ddd DD-MMM-YYYY, hh:mm A')
  };

}

const saveInDB=async(message)=>{
  if(message.mensaje){
    return new Promise((resolve,reject)=>{
      return db.transaction(
        trx=>{
            return trx('comentario')
                .returning('*')
                .insert({
                  'id_inte5':message.id_interruption,
                  'id_user3':message.id_user,
                  'fecha':message.fecha,
                  'comentario': message.mensaje
                })
                // .where('id_rev',req.query.id_interruption)
                .then(numberOfUpdatedRows=>{
                        resolve(numberOfUpdatedRows)
                })
                .then(trx.commit)
                .catch(err=>{console.log(err);trx.rollback,reject('somethig fail')})
        }).catch(err=> {reject('SOmething Fail')})
    })
  }else{
    return false
  }
}

var returnRouter = function(io) {
  io.sockets.on('connection', socket=>{
    // socket.on('connectedComments',(data)=>{
    //   db.select('*')
    //     .from('comentario')
    //     .where('id_inte5',data.id_interruption)
    //     .orderBy('id_comentario')
    //     .then(comment=>{
    //       socket.emit('mountComments',comment)
    //       // res.json(comment)
    //     })
    //     .catch(err=>{
    //       console.log(err)
    //       // socket.emit('')
    //     })
    // })

    socket.on('entrarChat', (data, callback) => {
      if (!data.nombre || !data.sala) {
          return callback({
              error: true,
              mensaje: 'El nombre/sala es necesario'
          });
      }

      socket.join(data.sala);

      usuarios.agregarPersona(socket.id, data.nombre, data.sala);

      socket.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));
      socket.broadcast.to(data.sala).emit('crearMensaje', {
        id_comentario:0,
        comentario:`Online`,
        id_inte5:0,
        id_user3:0,
        fecha:moment().format('ddd DD-MMM-YYYY, hh:mm A')
       });

      callback(usuarios.getPersonasPorSala(data.sala));

  });

  socket.on('crearMensaje', (data, callback) => {
      let persona = usuarios.getPersona(socket.id);

      let mensaje = crearMensaje(persona.nombre, data.mensaje, data.id_user, data.id_interruption);
      saveInDB(mensaje).then(messageSaved=>{
        // if(messageSaved){
          // socket.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
          // callback(mensaje);
          socket.broadcast.to(persona.sala).emit('crearMensaje', messageSaved[0]);
          callback(messageSaved[0]);
        // }
      })
  });


  socket.on('disconnect', () => {
      let personaBorrada = usuarios.borrarPersona(socket.id);
      try{
        socket.broadcast.to(personaBorrada.sala).emit('crearMensaje',{
          id_comentario:0,
          comentario:`Offline`,
          id_inte5:0,
          id_user3:0,
          fecha:moment().format('ddd DD-MMM-YYYY, hh:mm A')
         });
        socket.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
        console.log(personaBorrada,`Eliminada Correctamente`)
      }catch(e){
        console.log(`${socket.id} not Found`)
      }


  });

  // Mensajes privados
  socket.on('mensajePrivado', data => {

      let persona = usuarios.getPersona(socket.id);
      socket.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

  });

        // socket.on('interruptionSelected',(interruption_id)=>{
        //   var test=interruption(interruption_id.interruption)
        //     .then(data=>{
        //       const time_falta=calculateTime(data)
        //       console.log(data,time_falta)
        //     })
        //   console.log(interruption_id,'./',test)
        // })
        // var countdown = 60;  
        // setInterval(function() {  
          // countdown--;
          // socket.emit('timer', { countdown: countdown });
          socket.on('interruptionSelected',(interruption_id)=>{
            if(interruption_id){
              setInterval(() => {
                var test=interruption(interruption_id.interruption)
                  .then(data=>{
                    const time_falta=calculateTime(data)
                    socket.emit('timer',{countdown:time_falta})
                  })
              }, 1000);
          }else{
              socket.emit('timer',{countdown:"00:00:00"})
          }
          })
          socket.on('interruptionSelectedValue',(interruption_id)=>{
              var test=interruption(interruption_id.interruption)
                .then(data=>{
                  const time_falta=calculateTime(data)
                  socket.emit('timerValue',{countdown:time_falta})
                })
          })
        // }, 1000);
      });
  router.get('/', function(req, res, next) {
      io.sockets.on('connection', socket=>{
        console.log('Client Connect');
        socket.on('echo', function(data){
          io.sockets.emit('message', data)
        })
        socket.on('disconnect',()=>{
          console.log('Desconectado')
        })
      });
  });



  return router;
}

module.exports = returnRouter;

// router.get('/',(req,res,next)=>{
  
//   // var nsp=req.io.of('/socket/help');
//   //       nsp.connect(`connection`,(socket)=>{
//   //           console.log('come connectes')
//   //       });
//   //     nsp.emit('update','this')
//   // req.io.emit('update','This Reso?urce')
//   // console.log('entra aqui?')
//   // res.json('OK')
//   // console.log('esta aqui?', res.io.sockets.on)
//   // var countdown=1000;
//   // setInterval(function(){
//   //   countdown--;
//   //   console.log(countdown)
//   //   req.io.sockets.emit('timer','test')
//   // }, 1000);
//   // setInterval(() => {
//   //   console.log('test')
//   // }, 1000);
//   // res.io.sockets.emit('timer','test1')
  // res.io.sockets.on('connection', socket=>{
  //   console.log('Client Connect');
  //   // socket.on('echo', function(data){
  //   //   console.log('..//',data)
  //   //   res.io.sockets.emit('message', data)
  //   // })
  //   // socket.on('echo',function(data){
  //   //   console.log('..//',data)
  //   // })
  //   var countdown=1000;
  //   socket.on('temir',function(time){
  //     // setInterval(function(){
  //       // countdown--;
  //       // console.log(countdown)
  //       // socket.emit('timer','test')
  //       res.io.sockets.emit('timer','test2')
  //     // }, 1000);
  //   })
  //   socket.on('disconnect',()=>{
  //     console.log('Desconectado')
  //   })
  //   socket.on('reset',(data)=>{
  //     countdown=100;
  //     io.sockets.emit('timer',{countdown})
  //   })
    
  // });
//   // res.json('its ok')
// })

// module.exports= router;
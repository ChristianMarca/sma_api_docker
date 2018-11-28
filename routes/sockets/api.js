const express = require('express');
const router= express.Router();
const moment = require('moment');
require('dotenv').load();

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
              .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
      }
  ).catch(err=> {
      console.log(err)
      return res.status(400)})  
  })
}

var returnRouter = function(io) {
  io.sockets.on('connection', socket=>{
        console.log('Client Connect');
        socket.on('echo', function(data){
          console.log(data)
          io.sockets.emit('message', data)
        })
        socket.on('disconnect',()=>{
          console.log('Desconectado')
        })
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
            setInterval(() => {
              var test=interruption(interruption_id.interruption)
                .then(data=>{
                  const time_falta=calculateTime(data)
                  // console.log(data,time_falta)
                  socket.emit('timer',{countdown:time_falta})
                })
            }, 1000);
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
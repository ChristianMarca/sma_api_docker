const express = require('express');
const router= express.Router();

router.get('/',(req,res,next)=>{
  
  // var nsp=req.io.of('/socket/help');
  //       nsp.connect(`connection`,(socket)=>{
  //           console.log('come connectes')
  //       });
  //     nsp.emit('update','this')
  // req.io.emit('update','This Reso?urce')
  // console.log('entra aqui?')
  // res.json('OK')
  // console.log('esta aqui?', res.io.sockets.on)
  res.io.sockets.on('connection', socket=>{
    console.log('Client Connect');
    socket.on('echo', function(data){
      res.io.sockets.emit('message', data)
    })
    socket.on('disconnect',()=>{
      console.log('Desconectado')
    })
  });
  // res.json('its ok')
})

module.exports= router;
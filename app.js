const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
//De revisar el Paquete express json()
// const bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);

const fileUpload = require('express-fileupload');
const cors = require('cors');
var io = require('socket.io')(server,{path:'/socket'});

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const radioBasesInfo = require('./routes/radioBases');
const mapas = require('./routes/mapa.js');
const api= require('./routes/sockets/api.js')(io);
const authentication = require('./routes/authentication/index');
const register = require('./routes/authentication/register/register');
const interrupciones = require('./routes/interrupciones.js');

// const io =require('socket.io').listen(app.listen(3000));
// const io =require('socket.io').listen(app);
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');
 
var whitelist = ['http://192.168.1.102:3001', 'http://localhost:3001','http://192.168.1.102:3002', 'http://localhost:3002','http://192.168.1.102:3000', 'http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
// io.sockets.on('connection', socket=>{
//   console.log('Client Connect');
//   socket.on('echo', function(data){
//     io.sockets.emit('message', data)
//   })
//   socket.on('disconnect',()=>{
//     console.log('Desconectado')
//   })
// });
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(cor?s());
app.use(cors(corsOptions));
app.use(fileUpload());
app.use((req,res,next)=>{
  res.io= io;
  next();
})
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/radioBases', radioBasesInfo);
app.use('/mapa',mapas);
app.use('/authentication', authentication);
app.use('/socket',api);
app.use('/register',register);
app.use('/interrupcion',interrupciones);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
  res.json('error')
});

// module.exports = app;
module.exports = {app: app, server: server};
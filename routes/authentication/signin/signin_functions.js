// const jwt = require('jsonwebtoken');
// const redis= require('redis');

//Setup redis
// const redisClient = redis.createClient(process.env.REDIS_URI);

// const handleSignin=(db,bcrypt) =>(req, res)=> {
const handleSignin=(db,bcrypt,req, res)=> {
  const{password,email}=req.body;
  if(!email || !password){
      return Promise.reject('Incorrect for Submit')
  }

  return db.select('email','hash').from('login')
    .where('email','=',email)
    .then(data=>{
    //     return bcrypt.compare(password, data[0].hash).then(
    //         function(resp) {
    //             if (resp){
    //                 return db.select('*').from('users')
    //                 .where('email','=',email)
    //                 .then(user=>{
    //                     return user[0];
    //                 })
    //                 .catch(err=> Promise.reject('Unable to get user'))
    //             }else{
    //                 Promise.reject('fail')
    //             }
    //         }
    // ).catch(err=>{
    //     //res.status(400).json('Wrong Credentiales')
    //     return Promise.reject('Wrong Credentiales')
    // })
    return bcrypt.compare(password, data[0].hash,(err,resp)=>{
        if(err) return Promise.reject('Wrong Credentiales')
        if (resp){
            return db.select('*').from('users')
            .where('email','=',email)
            .then(user=>{
                return user[0];
            })
            .catch(err=> Promise.reject('Unable to get user'))
        }else{
            Promise.reject('fail')
        }
    })
    })
}

getAuthToken=(req,res)=>{
   const {authorization}=req.headers;
    return redisClient.get(authorization,(err,reply)=>{
       if(err || !reply){
           return res.status(400).json('Unauthorized');
       }
       return res.json({id: reply})
   })
}

signToken=(email)=>{
    const jwtPayload={email};
    //La clave en espera de colocar en variable de entorno process.env.SECRETPASSTOKEN
    return jwt.sign(jwtPayload, 'CLAVE_ENV',{expiresIn: '2 days'});
}

setToken=(key,value)=>{
    return Promise.resolve(redisClient.set(key,value))
}

createSessions=(user)=>{
    // JWT Token, return user data
    const {email, id}= user;
    const token=signToken(email);
    return setToken(token, id)
        .then(()=>{ 
            return {success: true, userId: id, token} 
        })
        .catch(console.log)
}

const signinAuthentication = (db,bcrypt)=>(req,res)=>{
    let {authorization}=req.headers;
    return authorization?getAuthToken(req,res):
        handleSignin(db,bcrypt,req, res)
            .then(data=>{
                return data.id && data.email ? createSessions(data):Promise.reject(data)
            })
            .then(session=>res.json(session))
            .catch(err=>res.status(400).json(err))
}

module.exports={
  signinAuthentication,
//   redisClient
};
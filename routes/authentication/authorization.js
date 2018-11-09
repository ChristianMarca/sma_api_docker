const redisClient= require('./signin/signin').redisClient;

const requiereAuth=(req,res,next)=>{
  const {authorization}= req.headers;
  if(!authorization){
    return res.status(401).json('Unauthorized');
  }
  return redisClient.get(authorization,(err,reply)=>{
    if (err || !reply){
      return res.status(401).json('Unauthorized');
    }
    return next();
  })
}

module.exports={
  requiereAuth,
}
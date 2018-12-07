const handleProfile=(req, res,db) => {
  let { id } = req.params;
  // let found = false;
  db.select('*')
  .from('usuario')
  .innerJoin('rol','id_rol1','id_rol')
  .where({id_user:id}).then(user=>{
      if (user.length) {
          return res.json(user[0])
      }else{
          return res.status(404).json('No Found')
      }
  }).catch(err=>{
      res.status(400).json('ERROR Getting User')
  })
}

const handleProfileUpdate=(req, res,db) => {
    let { id } = req.params;
    let {name,age,pet}=req.body.formInput;
    db('users')
        .where({id})
        .update({name})
        .then(resp=>{
            if(resp){
                res.json('Suceess')
            }else{
                res.status(400).json('Unable to Update')
            }
        })
        .catch(err=>{res.status(400).json('Error Updating User')})
}

const updateData=(req,res,db)=>{
    let { id } = req.params;
    let {nombre,apellido,username,telefono}=req.body.formInput;
    db('usuario')
        .where('id_user',id)
        .update({nombre,apellido,username,telefono})
        .then(resp=>{
            if(resp){
                res.json('Suceess')
            }else{
                res.status(400).json('Unable to Update')
            }
        })
        .catch(err=>{res.status(400).json('Error Updating User')})
}

const updatePassword=async (req,res,db,bcrypt)=>{
    let { id, password } = req.params;
    bcrypt.hash(password, 10, function(err, hash) {
        if(err){
            // reject('Failed')
            res.status(400).json('Failed1')
        }
        else{
            db.transaction(trx=>{
                trx('login')
                .where('id_user1',id)
                .update({hash})
                .returning('*')
                    .then(user=>{
                      res.json(user[0])
                    // resolve(user[0])
                    })
                    .catch(e=>{
                        res.status(400).json('Fail')
                    // reject('Failed2')
                    })                
                    .then(trx.commit)//continua con la operacion
                    .catch(trx.rollback)//Si no es posible elimna el proceso
                })
            }
            })//.catch(err=> res.status(400).json('unable to register',err))
}

const handlePasswordValidate=(req, res,db, bcrypt) => {
    let { id, password } = req.params;
    if(!password){
        return res.status(400).json('No valid password')
    }else{
        db('login')
            .select('hash')
            .where('id_user1',id)
            .then(resp=>{
                if(resp){
                    return bcrypt.compare(password, resp[0].hash).then(
                        function(resp) {
                            if (resp){
                                res.json('OK')
                            }else{
                                // return Promise.reject('fail')
                                return res.status(400).json('No valid password')
                            }
                        }
                    ).catch(err=>{
                        // res.status(400).json('Wrong Credentiales')
                        // return Promise.reject('Wrong Credentiales')
                        return res.status(400).json('No valid password')
                    })
                }else{
                    res.status(400).json('Unable to Update')
                }
            })
            .catch(err=>{
                return res.status(400).json('Error Updating User')})
    }
}

module.exports={
  handleProfile,
  handleProfileUpdate,
  handlePasswordValidate,
  updatePassword,
  updateData
}
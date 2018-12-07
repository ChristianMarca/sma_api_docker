const bcrypt = require('bcrypt');

const password="1234";

bcrypt.hash(password, 10, function(err, hash) {
  if(err){
      console.log('Falied')
  }
  else{
      console.log(hash)
  }
});
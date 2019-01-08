const bcrypt = require('bcrypt-nodejs');

const password = '1234';

bcrypt.hash(password, null, null, function(err, hash) {
	if (err) {
		console.log('Falied');
	} else {
		console.log(hash);
	}
});

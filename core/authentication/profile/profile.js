const handleProfile = (req, res, db) => {
	let { id } = req.params;
	db
		.select('*')
		.from('usuario')
		.innerJoin('rol', 'id_rol1', 'id_rol')
		.where({ id_user: id })
		.then((user) => {
			if (user.length) {
				return res.json(user[0]);
			} else {
				return res.status(404).json('No Found');
			}
		})
		.catch((err) => {
			res.status(400).json('ERROR Getting User');
		});
};

const updateData = (req, res, db) => {
	let { id } = req.params;
	let { nombre, apellido, username, telefono } = req.body.formInput;
	db('usuario')
		.where('id_user', id)
		.update({ nombre, apellido, username, telefono })
		.then((resp) => {
			if (resp) {
				res.json('Suceess');
			} else {
				res.status(400).json('Unable to Update');
			}
		})
		.catch((err) => {
			res.status(400).json('Error Updating User');
		});
};

const updatePassword = async (req, res, db, bcrypt) => {
	let { id, password } = req.params;
	// bcrypt.hash(password, 10, function(err, hash) {
	bcrypt.hash(password, null, null, function(err, hash) {
		if (err) {
			res.status(400).json('Failed1');
		} else {
			db.transaction((trx) => {
				trx('login')
					.where('id_user1', id)
					.update({ hash })
					.returning('*')
					.then((user) => {
						res.json(user[0]);
						// resolve(user[0])
					})
					.catch((e) => {
						res.status(400).json('Fail');
					})
					.then(trx.commit) //continua con la operacion
					.catch(trx.rollback); //Si no es posible elimna el proceso
			});
		}
	});
};

const handlePasswordValidate = (req, res, db, bcrypt) => {
	let { id, password } = req.params;
	if (!password) {
		return res.status(400).json('No valid password');
	} else {
		db('login')
			.select('hash')
			.where('id_user1', id)
			.then((resp) => {
				if (resp) {
					return bcrypt.compare(password, resp[0].hash, (err, resp) => {
						if (err) res.status(400).json('No valid password');
						if (resp) {
							res.json('OK');
						} else {
							return res.status(400).json('No valid password');
						}
					});
				} else {
					res.status(400).json('Unable to Update');
				}
			})
			.catch((err) => {
				return res.status(400).json('Error Updating User');
			});
	}
};

module.exports = {
	handleProfile,
	handlePasswordValidate,
	updatePassword,
	updateData
};

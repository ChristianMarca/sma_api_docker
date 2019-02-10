const jwt = require('jsonwebtoken');
const redis = require('redis');
require('dotenv').load();

const redisClient = redis.createClient(process.env.REDIS_URI);

const handleSignin = (db, bcrypt, req, res) => {
	const { password, email } = req.body;
	if (!email || !password) {
		return Promise.reject('Incorrect for Submit');
	}
	return db
		.select('email', 'hash', 'id_user1')
		.from('login')
		.where('email', '=', email)
		.then((data) => {
			return new Promise((resolve, reject) => {
				return bcrypt.compare(password, data[0].hash, (err, resp) => {
					if (err) return reject('Wrong Credentiales');
					if (resp) {
						return db
							.select('*')
							.from('usuario')
							.innerJoin('rol', 'id_rol1', 'id_rol')
							.where('id_user', '=', data[0].id_user1)
							.then((user) => {
								return resolve(user[0]);
							});
					} else {
						return reject('fail');
					}
				});
			});
		})
		.catch((error) => {
			console.log('sad', error);
		});
};

getAuthToken = (req, res) => {
	const { authorization } = req.headers;
	return redisClient.get(authorization, (err, reply) => {
		if (err || !reply) {
			return res.status(400).json('Unauthorized');
		}
		return res.json({ id_user: reply });
	});
};

signToken = (email) => {
	const jwtPayload = { email };
	return jwt.sign(jwtPayload, 'CLAVE_ENV', { expiresIn: '2 days' });
};

setToken = (key, value) => {
	return Promise.resolve(redisClient.set(key, value));
};

createSessions = (user) => {
	const { email, id_user } = user;
	const token = signToken(email);
	return setToken(token, id_user)
		.then(() => {
			return { success: true, userId: id_user, token };
		})
		.catch((error) => console.log({ Error: error }));
};

const signinAuthentication = (db, bcrypt) => (req, res) => {
	let { authorization } = req.headers;
	return authorization
		? getAuthToken(req, res)
		: handleSignin(db, bcrypt, req, res)
				.then((data) => {
					return data.id_user && data.email ? createSessions(data) : Promise.reject(data);
				})
				.then((session) => res.json(session))
				.catch((err) => res.status(400).json(err));
};

const revokeToken = (req, res) => {
	let { authorization } = req.headers;
	redisClient.del(authorization, (err, resp) => {
		if (resp === 1) {
			return res.json('Deleted');
		}
		return res.status(500).json('Fail Delete');
	});
};

module.exports = {
	signinAuthentication,
	revokeToken,
	redisClient
};

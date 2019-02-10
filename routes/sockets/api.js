const express = require('express');
const router = express.Router();
var moment = require('moment-timezone');
const { Usuarios } = require('./classes/users');
const InterruptionDate = require('../../services/date/dateClass');
require('dotenv').load();
const usuarios = new Usuarios();
const db = require('../../knex');

calculateTime = (start_date) => {
	const now = start_date;
	const then = moment().tz('America/Guayaquil');
	const ms = moment(now, 'DD/MM/YYYY HH:mm:ss')
		.tz('America/Guayaquil')
		.diff(moment(then, 'DD/MM/YYYY HH:mm:ss').tz('America/Guayaquil'));
	const d = moment.duration(ms);
	const s = Math.floor(d.asHours()) + moment.tz('America/Guayaquil').utc(ms).format(':mm:ss');
	return s;
};

interruption = async (id_interrupcion) => {
	return new Promise((resolve, reject) => {
		db
			.transaction((trx) => {
				trx('interrupcion')
					.select('*')
					.where('id_inte', id_interrupcion)
					.then((data) => {
						resolve({
							fecha_inicio: data[0].fecha_inicio,
							fecha_fin_real: data[0].fecha_fin_real,
							is_finished: data[0].is_finished
						});
					})
					.then(trx.commit) //continua con la operacion
					.catch((err) => {
						return trx.rollback;
					}); //Si no es posible elimna el proces0
			})
			.catch((err) => {
				return res.status(400);
			});
	});
};

const crearMensaje = (nombre, mensaje, id_user, id_interruption) => {
	return {
		nombre,
		mensaje,
		id_user,
		id_interruption,
		fecha: moment.tz('America/Guayaquil').format('ddd DD-MMM-YYYY, hh:mm A')
	};
};

const saveInDB = async (message) => {
	if (message.mensaje) {
		return new Promise((resolve, reject) => {
			return db
				.transaction((trx) => {
					return trx('comentario')
						.returning('*')
						.insert({
							id_inte5: message.id_interruption,
							id_user3: message.id_user,
							fecha: message.fecha,
							comentario: message.mensaje
						})
						.then((numberOfUpdatedRows) => {
							resolve(numberOfUpdatedRows);
						})
						.then(trx.commit)
						.catch((err) => {
							console.log(err);
							trx.rollback, reject('somethig fail');
						});
				})
				.catch((err) => {
					reject('SOmething Fail');
				});
		});
	} else {
		return false;
	}
};

var returnRouter = function(io) {
	io.sockets.on('connection', (socket) => {
		socket.on('entrarChat', (data, callback) => {
			if (!data.nombre || !data.sala) {
				return callback({
					error: true,
					mensaje: 'El nombre/sala es necesario'
				});
			}

			socket.join(data.sala);

			usuarios.agregarPersona(socket.id, data.nombre, data.sala);

			socket.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));
			socket.broadcast.to(data.sala).emit('crearMensaje', {
				id_comentario: 0,
				comentario: `Online`,
				id_inte5: 0,
				id_user3: 0,
				fecha: moment.tz('America/Guayaquil').format('ddd DD-MMM-YYYY, hh:mm A')
			});

			callback(usuarios.getPersonasPorSala(data.sala));
		});

		socket.on('crearMensaje', (data, callback) => {
			let persona = usuarios.getPersona(socket.id);

			let mensaje = crearMensaje(persona.nombre, data.mensaje, data.id_user, data.id_interruption);
			saveInDB(mensaje).then((messageSaved) => {
				socket.broadcast.to(persona.sala).emit('crearMensaje', messageSaved[0]);
				callback(messageSaved[0]);
			});
		});

		socket.on('disconnect', () => {
			let personaBorrada = usuarios.borrarPersona(socket.id);
			try {
				socket.broadcast.to(personaBorrada.sala).emit('crearMensaje', {
					id_comentario: 0,
					comentario: `Offline`,
					id_inte5: 0,
					id_user3: 0,
					fecha: moment.tz('America/Guayaquil').format('ddd DD-MMM-YYYY, hh:mm A')
				});
				socket.broadcast
					.to(personaBorrada.sala)
					.emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
				console.log(personaBorrada, `Eliminada Correctamente`);
			} catch (e) {
				console.log(`${socket.id} no encontrado`);
			}
		});

		// Mensajes privados, no implementado aun
		socket.on('mensajePrivado', (data) => {
			let persona = usuarios.getPersona(socket.id);
			socket.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
		});

		socket.on('interruptionSelected', (interruption_id) => {
			var interruptionDateClass = new InterruptionDate();
			if (interruption_id) {
				setInterval(() => {
					var test = interruption(interruption_id.interruption).then((data) => {
						interruptionDateClass
							.calculateBusinessDays(data.fecha_inicio, moment.tz('America/Guayaquil'))
							.then((time_falta) => {
								data.is_finished
									? interruptionDateClass
											.calculateBusinessDays(data.fecha_inicio, data.fecha_fin_real)
											.then((time_falta_real) => {
												socket.emit('timer', {
													countdown: time_falta,
													countdown_real: time_falta_real,
													is_finished: data.is_finished
												});
											})
									: socket.emit('timer', {
											countdown: time_falta,
											countdown_real: 'No Finalizado',
											is_finished: data.is_finished
										});
							})
							.catch((error) => {
								socket.emit('timer', { countdown: '00:00:00', countdown_real: '00:00:00' });
							});
					});
				}, 1000);
			} else {
				socket.emit('timer', { countdown: '00:00:00', countdown_real: '00:00:00' });
			}
		});
		socket.on('interruptionSelectedValue', (interruption_id) => {
			var test = interruption(interruption_id.interruption).then((data) => {
				const time_falta = calculateTime(data);
				socket.emit('timerValue', { countdown: time_falta });
			});
		});
	});
	router.get('/', function(req, res, next) {
		io.sockets.on('connection', (socket) => {
			console.log('Client Connect');
			socket.on('echo', function(data) {
				io.sockets.emit('message', data);
			});
			socket.on('disconnect', () => {
				console.log('Desconectado');
			});
		});
	});

	return router;
};

module.exports = returnRouter;

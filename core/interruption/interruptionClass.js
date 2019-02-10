var moment = require('moment-timezone');
const InterruptionDate = require('../../services/date/dateClass');
const Report = require('../report/reportClass');
const { compile } = require('../../services/pdfGenerator/index');
const _sendMail = require('../../services/email/email');

module.exports = class Interrupcion {
	constructor(IntRb) {
		this.IntRb = IntRb;
	}

	createDataForEndInterruption(data_interruption, data_email, data_operador) {
		var localidad_selected = '';
		switch (data_interruption.nivel_interrupcion) {
			case 'PARROQUIA':
				localidad_selected = data_interruption.parroquia_inte;
				break;
			case 'CANTON':
				localidad_selected = data_interruption.canton_inte;
				break;
			default:
				localidad_selected = data_interruption.provincia_inte;
		}

		return {
			date: moment.tz('America/Guayaquil').format('YYYY-MM-DD hh:mm:ss'),
			email_to_send: data_email,
			localidad: data_interruption.nivel_interrupcion,
			localidad_selected,
			date_finish: moment(data_interruption.fecha_fin_real).format('YYYY-MM-DD hh:mm:ss'),
			operadora: moment(data_operador.operadora).format('YYYY-MM-DD hh:mm:ss'),
			date_init: data_interruption.fecha_inicio
		};
	}

	createDataForReport(db, IntRb) {
		var localidad_selected = '';
		switch (this.IntRb.interruptionRB.interruptionLevel) {
			case 'PARROQUIA':
				localidad_selected = IntRb.interruptionParish;
				break;
			case 'CANTON':
				localidad_selected = IntRb.interruptionCanton;
				break;
			default:
				localidad_selected = IntRb.interruptionProvince;
		}
		return new Promise((resolve, reject) => {
			return db('usuario')
				.innerJoin('lnk_operador', 'id_user', 'id_user2')
				.innerJoin('operador', 'id_operadora', 'id_operadora3')
				.where('id_user', IntRb.interruptionIdUser)
				.then((_operator_data) => {
					resolve({
						localidad: IntRb.interruptionRB.interruptionLevel,
						// email_supervision: 'supervision@cnt.gob.ec',
						// email_cumplimiento_regulatorio: 'cumplimientoregulatorio@cnt.gob.ec',
						coordinacion_zonal: IntRb.coordinacion_zonal,
						email_self: IntRb.interruptionEmailSelf,
						operadora: _operator_data[0].operadora,
						date: moment.tz('America/Guayaquil').format('YYYY-MM-DD hh:mm:ss'),
						localidad_selected: localidad_selected,
						email_to_send: IntRb.interruptionEmailAddress,
						date_init: moment(IntRb.interruptionDate.interruptionStart)
							.tz('America/Guayaquil')
							.format('YYYY:MM:DD'),
						hora: moment(IntRb.interruptionDate.interruptionStart)
							.tz('America/Guayaquil')
							.format('hh:mm:ss'),
						SMS: IntRb.interruptionServices.includes('SMS') ? 'X' : '-',
						VOZ: IntRb.interruptionServices.includes('VOZ') ? 'X' : '-',
						DATOS: IntRb.interruptionServices.includes('DATOS') ? 'X' : '-',
						GSM: IntRb.interruptionTechnologies.includes('GSM') ? 'X' : '-',
						UMTS: IntRb.interruptionTechnologies.includes('UMTS') ? 'X' : '-',
						LTE: IntRb.interruptionTechnologies.includes('LTE') ? 'X' : '-',
						tiempo_interrupcion:
							IntRb.interruptionType === 'Scheduled'
								? IntRb.interruptionDate.interruptionTime
								: 'No definido'
					});
				})
				.catch((error) => {
					console.log({ Error: error });
					reject({});
				});
		});
		//Revisar para cambiar los correos electronicos
	}

	async insertNewInterruption(RB, req, res, db) {
		return new Promise((resolve, reject) => {
			db
				.transaction(
					(trx) => {
						trx('usuario')
							.select('id_operadora3')
							.innerJoin('lnk_operador', 'id_user', 'id_user2')
							.where('id_user', RB.interruptionIdUser)
							.then((data) => {
								trx
									.insert({
										fecha_inicio: moment(RB.interruptionDate.interruptionStart).tz(
											'America/Guayaquil'
										),
										fecha_fin: moment(RB.interruptionDate.interruptionEnd).tz('America/Guayaquil'),
										duracion: RB.interruptionDate.interruptionTime,
										causa: RB.interruptionCauses.interruptionCauses,
										area: RB.interruptionRB.interruptionSector,
										id_estado_int1: 1,
										id_operadora1: data[0].id_operadora3,
										id_tipo1: RB.interruptionType === 'Random' ? 2 : 1,
										nivel_interrupcion: RB.interruptionRB.interruptionLevel,
										provincia_inte: RB.interruptionProvince,
										canton_inte: RB.interruptionCanton,
										parroquia_inte: RB.interruptionParish
									})
									.into('interrupcion')
									.returning('id_inte')
									.then((interrupcion) => {
										return this.insertRadioBases(
											trx,
											interrupcion[0],
											RB.interruptionRadioBase.radioBasesAddID_BS
										)
											.then(() => {
												return this.insertServices(
													trx,
													interrupcion[0],
													RB.interruptionServices
												).then(() => {
													return this.insertTechnologies(
														trx,
														interrupcion[0],
														RB.interruptionTechnologies
													).then(() => {
														return this.createInterruptionRev(
															trx,
															interrupcion[0]
														).then((data) => {
															return trx('lnk_interrupcion')
																.select('id_bs1')
																.where('id_inte2', interrupcion[0])
																.then((_id_bs) => {
																	trx('radiobase')
																		.whereIn(
																			'id_bs',
																			_id_bs.map((_id) => {
																				return _id.id_bs1;
																			})
																		)
																		.update('id_estado1', 2)
																		.then((data) => {
																			resolve('OK');
																		});
																});
														});
													});
												});
											})
											.catch((e) => console.log(e));
									})
									.then((e) => {
										console.log(e);
										res.status(200);
									})
									.then(trx.commit) //continua con la operacion
									.catch((err) => {
										console.log(err);
										return trx.rollback;
									}); //Si no es posible elimna el proces0
							});
					}
					// ).catch(err=> res.status(400).json('unable to register'))
				)
				.catch((err) => {
					return res.status(400);
				});
		});
	}

	async insertRadioBases(trx, id_int, radiobases) {
		var RadioBasesg = radiobases.map((radiobase) => {
			trx
				.insert({
					id_inte2: id_int,
					id_bs1: radiobase.id_bs
				})
				.into('lnk_interrupcion')
				.returning('id_inte2')
				.catch((error) => {
					console.log({ Error: error });
				});
		});
		return Promise.all(RadioBasesg);
	}

	async insertServices(trx, id_int, services) {
		var Services = services.map((service) => {
			return trx('servicio')
				.select()
				.where('servicio', service)
				.then((serv) => {
					trx
						.insert({
							id_inte3: id_int,
							id_servicio1: serv[0].id_servicio
						})
						.into('lnk_servicio')
						.then(() => {
							return 'OK';
						})
						.catch((e) => console.log('Fail', e));
				})
				.catch((e) => console.log('Fail', e));
		});
		return Promise.all(Services);
	}

	async insertTechnologies(trx, id_int, technologies) {
		var Technologies = technologies.map((technology) => {
			return trx('tecnologia')
				.select()
				.where('tecnologia', technology)
				.then((tec) => {
					trx
						.insert({
							id_inte4: id_int,
							id_tec2: tec[0].id_tec
						})
						.into('lnk_tecnologia')
						.then(() => {
							return 'OK';
						})
						.catch((e) => console.log('Fail', e));
				})
				.catch((e) => console.log('Fail', e));
		});
		return Promise.all(Technologies);
	}

	async createInterruptionRev(trx, id_int) {
		return trx
			.insert({
				id_inte6: id_int,
				id_rev: id_int,
				id_arc1: 1
			})
			.into('interrupcion_rev')
			.then(() => {
				return 'Creado Nueva Revisión de Interrupcion';
			})
			.catch((e) => console.log('Fail', e));
	}

	async getInterruptionSelected(db, request) {
		return new Promise((resolve, reject) => {
			return db
				.transaction((trx) => {
					trx('usuario')
						.select('*')
						.innerJoin('lnk_operador', 'id_user', 'id_user2')
						.innerJoin('operador', 'id_operadora', 'id_operadora3')
						.innerJoin('interrupcion', 'id_operadora', 'id_operadora1')
						.innerJoin('estado_interrupcion', 'id_estado_int', 'id_estado_int1')
						.innerJoin('tipo_interrupcion', 'id_tipo', 'id_tipo1')
						.andWhere('id_inte', request.id_interruption)
						.then((_interrupcion) => {
							return trx('lnk_tecnologia')
								.innerJoin('tecnologia', 'id_tec', 'id_tec2')
								.select('tecnologia')
								.where({
									id_inte4: _interrupcion[0].id_inte
								})
								.then((technologies) => {
									return trx('lnk_servicio')
										.innerJoin('servicio', 'id_servicio', 'id_servicio1')
										.select('servicio')
										.where({
											id_inte3: _interrupcion[0].id_inte
										})
										.then((services) => {
											resolve({ data: _interrupcion[0], technologies, services });
										});
								});
						})
						.then(trx.commit) //continua con la operacion
						.catch((err) => {
							return trx.rollback;
						}); //Si no es posible elimna el proces0
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async getComments(db, request) {
		return new Promise((resolve, reject) => {
			db
				.select('*')
				.from('comentario')
				.where('id_inte5', request.id_interruption)
				.orderBy('id_comentario')
				.then((comment) => {
					resolve(comment);
				})
				.catch((err) => {
					reject({ Error: err });
				});
		});
	}

	async getStateInterruption(request) {
		return new Promise((resolve, reject) => {
			if (!(request.interruption_id === 'undefined')) {
				const interruptionDateStatus = new InterruptionDate(
					moment.tz('America/Guayaquil'),
					request.interruption_id
				);
				let days = interruptionDateStatus.getInterruptionDate();
				days
					.then((day) => {
						switch (true) {
							case day >= 0 && day < 2:
								resolve({
									status: 'inicio',
									level: 'operador',
									actualDay: day
								});
								return;
							case day >= 2 && day < 4:
								resolve({
									status: 'proceso',
									level: 'operador',
									actualDay: day
								});
								return;
							case day >= 4 && day <= 5:
								resolve({
									status: 'fin',
									level: 'operador',
									actualDay: day
								});
								return;
							case day > 5 && day < 10:
								resolve({
									status: 'inicio',
									level: 'arcotel',
									actualDay: day
								});
								return;
							case day >= 10 && day < 15:
								resolve({
									status: 'proceso',
									level: 'arcotel',
									actualDay: day
								});
								return;
							case day >= 15:
								resolve({
									status: 'fin',
									level: 'arcotel',
									actualDay: day
								});
								return;
						}
					})
					.catch((error) => reject({ Error: error }));
			} else {
				reject('No valid ID Interruption');
			}
		});
	}

	async getInterruption(db, datos) {
		return new Promise((resolve, reject) => {
			let fetchOffset = datos[0];
			let elementosPagina = datos[1];
			let orden = datos[2];
			let campOrden = datos[3];
			let filtIn = datos[4];
			let filtFin = datos[5];
			let area = datos[6];

			let base_arcotel = `SELECT * FROM (SELECT DISTINCT ON (id_inte) * FROM interrupcion
				INNER JOIN lnk_operador ON id_operadora1=id_operadora3
				INNER JOIN operador ON id_operadora=id_operadora3
				INNER JOIN usuario ON id_user=id_user2
				INNER JOIN tipo_interrupcion ON id_tipo=id_tipo1
				INNER JOIN estado_interrupcion ON id_estado_int=id_estado_int1
              WHERE LOWER(area) SIMILAR TO LOWER(${area}) AND fecha_inicio >= to_timestamp(${filtIn}/1000.0)
			  AND fecha_inicio <= to_timestamp(${filtFin}/1000.0)
				) as alias
			  `;
			let base = `SELECT * FROM interrupcion
              INNER JOIN lnk_operador ON id_operadora1=id_operadora3
              INNER JOIN operador ON id_operadora=id_operadora3
              INNER JOIN usuario ON id_user=id_user2
			  INNER JOIN tipo_interrupcion ON id_tipo=id_tipo1
			  INNER JOIN estado_interrupcion ON id_estado_int=id_estado_int1
              WHERE LOWER(area) SIMILAR TO LOWER(${area}) AND fecha_inicio >= to_timestamp(${filtIn}/1000.0)
              AND fecha_inicio <= to_timestamp(${filtFin}/1000.0) AND id_user=${datos[8]}`;
			let qmain = `SELECT row_to_json(conteo) FROM(SELECT COUNT(*) as total FROM (${datos[7] === 1
				? base_arcotel
				: base}) as todo) as conteo
            UNION ALL
            SELECT row_to_json(fc)
            FROM (SELECT array_agg(f) As interrupciones
            FROM (${datos[7] === 1 ? base_arcotel : base}
              ORDER BY ${campOrden} ${orden}
            LIMIT ${elementosPagina} OFFSET ${fetchOffset}) As f) As fc`;
			db
				.raw(qmain)
				.then((data) => {
					let { total } = data.rows[0].row_to_json;
					let { interrupciones } = data.rows[1].row_to_json;

					if (!interrupciones) interrupciones = [];
					resolve({ total, interrupciones });
				})
				.catch((err) => {
					reject({ total: 0, interrupciones: [] });
				});
		});
	}

	async updateReport(db, request, requestBody) {
		return new Promise((resolve, reject) => {
			db
				.transaction((trx) => {
					return trx('interrupcion_rev')
						.update({
							html: requestBody.contentHtml,
							codigoreport: requestBody.contentHeader.codigoReport,
							coordinacionzonal: requestBody.contentHeader.coordinacionZonal,
							asunto: requestBody.contentHeader.asunto
						})
						.where('id_rev', request.id_interruption)
						.then((numberOfUpdatedRows) => {
							if (numberOfUpdatedRows) {
								resolve(numberOfUpdatedRows);
								return;
							}
						})
						.then(trx.commit) //continua con la operacion
						.catch((err) => {
							return trx.rollback;
						}); //Si no es posible elimna el proces0
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async actionForInterruption(db, request) {
		return new Promise((resolve, reject) => {
			const {
				group,
				selected,
				contentHeader,
				contentHtml,
				id_interruption,
				sessionController,
				real_finish_interruption
			} = request;
			if (group === 'actionInReport') {
				var report = new Report(contentHtml, contentHeader, id_interruption);
				switch (selected) {
					case 'saveChanges':
						report.updateReport();
						resolve('Saved');
						break;
					case 'rebuildReport':
						report
							.rebuildReport()
							.then((resp) => {
								resolve(resp);
							})
							.catch((err) => res.status(400).json('No work'));
						break;
					case 'sendReport':
						report
							.sendMail(sessionController.email)
							.then((resp) => {
								resolve('Send');
							})
							.catch((error) => {
								reject(error);
							});
						break;
					default:
						reject('Action no found');
						break;
				}
			} else if (group === 'StateOfInterruption') {
				db
					.transaction((trx) => {
						return trx('estado')
							.select('id_estado')
							.where('estado', selected)
							.then((_id_estado) => {
								return trx('lnk_interrupcion')
									.select('id_bs1')
									.where('id_inte2', id_interruption)
									.then((_id_bs) => {
										return trx('radiobase')
											.whereIn(
												'id_bs',
												_id_bs.map((_id) => {
													return _id.id_bs1;
												})
											)
											.update('id_estado1', _id_estado[0].id_estado)
											.then((data) => {
												resolve('Correct');
											});
									});
							})
							.then(trx.commit) //continua con la operacion
							.catch((err) => {
								return trx.rollback;
							}); //Si no es posible elimna el proces0
					})
					.catch((err) => {
						reject('Something Fail');
					});
			} else if (group === 'updateInterruptionState') {
				db
					.transaction((trx) => {
						return trx('estado_interrupcion')
							.select('*')
							.where('estado_int', selected.replace('_', ' '))
							.then((_id_estado_int) => {
								return trx('interrupcion')
									.where('id_inte', id_interruption)
									.update('id_estado_int1', _id_estado_int[0].id_estado_int)
									.then((data) => {
										resolve(_id_estado_int[0].estado_int);
									});
							})
							.then(trx.commit) //continua con la operacion
							.catch((err) => {
								return trx.rollback;
							}); //Si no es posible elimna el proces0
					})
					.catch((error) => {
						reject({ Error: error });
					});
			} else if (group === 'finishInterruption') {
				return db
					.transaction((trx) => {
						return trx('interrupcion')
							.returning('*')
							.where('id_inte', id_interruption)
							.update({
								is_finished: true,
								fecha_fin_real: moment(real_finish_interruption).tz('America/Guayaquil').format()
							})
							.then((data) => {
								return trx('usuario').select('*').where('id_rol1', 1).then((users) => {
									var emails = users.map((user) => {
										return user.email;
									});
									return trx('operador')
										.select('*')
										.where('id_operadora', data[0].id_operadora1)
										.then((operadora) => {
											compile(
												'format_reset_service',
												this.createDataForEndInterruption(data[0], emails, operadora[0]),
												undefined
											).then((html) => {
												_sendMail(
													undefined,
													emails,
													'Reporte de fin de Interrupcion',
													undefined,
													html,
													undefined
												)
													.then((data) => {
														resolve(true);
													})
													.catch((error) => {
														reject({ Error: error });
													});
											});
										})
										.catch((error) => {
											console.log('error compiles', error);
										});
								});
							})
							.then(trx.commit) //continua con la operacion
							.catch((err) => {
								return trx.rollback;
							}); //Si no es posible elimna el proces0
					})
					.catch((error) => {
						reject({ Error: error });
					});
			} else {
				reject('Accion no valida');
			}
		});
	}

	async getReportForInterruption(db, request) {
		return new Promise((resolve, reject) => {
			var content;
			db
				.transaction((trx) => {
					return trx('interrupcion_rev')
						.select('*')
						.innerJoin('interrupcion', 'id_inte', 'id_inte6')
						.innerJoin('tipo_interrupcion', 'id_tipo', 'id_tipo1')
						.innerJoin('operador', 'id_operadora', 'id_operadora1')
						.innerJoin('data_operador', 'id_data_operador', 'id_data_operador1')
						.where('id_inte6', request.id_interruption)
						.then((data) => {
							var dataObj = data[0];
							if (!dataObj.ismodifyreport) {
								dataObj.dataReport = moment.tz('America/Guayaquil').format();
								dataObj.interruptionLevelValue =
									dataObj[dataObj.nivel_interrupcion.concat('_inte').toLowerCase()];
								if (dataObj.html) {
									resolve({
										html: dataObj.html,
										codigoReport: dataObj.codigoreport,
										coordinacionZonal: dataObj.coordinacionzonal,
										asunto: dataObj.asunto
									});
								} else {
									compile('format_generate_init_report', { data: dataObj }, undefined)
										.then((html) => {
											content = {
												html: html,
												codigoReport: dataObj.codigoreport,
												coordinacionZonal: dataObj.coordinacionzonal,
												asunto: dataObj.asunto
											};
											processFile();
										})
										.catch((error) => {
											reject({ Error: error });
										});
								}
							}
						})
						.then(trx.commit) //continua con la operacion
						.catch((err) => {
							return trx.rollback;
						}); //Si no es posible elimna el proces0
				})
				.catch((error) => {
					reject({ Error: error });
				});

			async function processFile() {
				resolve(content);
			}
		});
	}

	async getInterruptionStats(db, request) {
		return new Promise((_resolve, _reject) => {
			let statsArray = [ 1, 2, 3 ].map((operadora) => {
				return new Promise((resolve, reject) => {
					return db
						.raw(
							`SELECT to_char(fecha_inicio, 'MM'), count(*) AS ct 
								FROM INTERRUPCION 
									WHERE to_char(fecha_inicio, 'YYYY')=:year
											AND id_operadora1=:id_operadora
								GROUP BY 1;`,
							{ id_operadora: operadora, year: moment.tz('America/Guayaquil').format('YYYY') }
						)
						.then((resp) => {
							var stats = new Array(12).fill(0);
							resp.rows.forEach((register, index, array) => {
								stats[Number(register.to_char) - 1] = Number(register.ct);
							});
							resolve(stats);
						})
						.catch((error) => {
							_reject(new Array(12).fill(0));
						});
				});
			});
			return Promise.all(statsArray).then((_stats) => {
				_resolve(_stats);
			});
		});
	}
};

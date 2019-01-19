const Coordenadas = require('../../services/geographical/geografico');
module.exports = class RadioBases {
	constructor() {}
	async getRadioBases(db, query) {
		return new Promise((resolve, reject) => {
			db
				.select('*')
				.from('radiobases')
				.where(db.raw(query))
				.then((_radiobases) => {
					if (_radiobases.length) {
						resolve(_radiobases);
					} else {
						reject('Not Found');
					}
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async getRadioBasesFilter(db, query, request) {
		return new Promise((resolve, reject) => {
			request.dataSelected.length !== 0
				? db
						.select(
							'id_bs',
							'cell_id',
							'nom_sit',
							'dir',
							'parroquia',
							'canton',
							'provincia',
							'lat_dec',
							'long_dec'
						)
						.from('radiobase')
						.innerJoin('tecnologia', 'id_tec1', 'id_tec')
						.innerJoin('operador', 'id_operadora', 'id_operadora2')
						.where(db.raw(query))
						.andWhere(function() {
							this.whereIn('tecnologia', request.dataSelected);
						})
						.andWhere(function() {
							this.whereIn('operadora', request.dataSelected);
						})
						.then((_radiobases) => {
							if (_radiobases.length) {
								resolve(_radiobases);
							} else {
								reject('Not Found');
							}
						})
						.catch((error) => {
							reject([]);
						})
				: db
						.select(
							'id_bs',
							'cell_id',
							'nom_sit',
							'dir',
							'parroquia',
							'canton',
							'provincia',
							'lat_dec',
							'long_dec'
						)
						.from('radiobase')
						.where(db.raw(query))
						.then((_radiobases) => {
							if (_radiobases.length) {
								resolve(_radiobases);
							} else {
								reject('Not Found');
							}
						})
						.catch((error) => {
							reject([]);
						});
		});
	}

	async getRadioBasesFilterIDUser(db, query, request) {
		return new Promise((resolve, reject) => {
			request.id_user !== 'ARCOTEL'
				? db
						.select('id_bs', 'cell_id', 'cod_est', 'nom_sit', 'dir', 'parroquia', 'canton', 'provincia')
						.from('usuario')
						.innerJoin('lnk_operador', 'id_user2', 'id_user')
						.innerJoin('operador', 'id_operadora3', 'id_operadora')
						.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
						.where(db.raw(query))
						.then((_radiobases) => {
							if (_radiobases.length) {
								resolve(_radiobases);
							} else {
								reject('Not Found');
							}
						})
						.catch((error) => {
							reject({ Error: error });
						})
				: db
						.distinct(db.raw('ON (cod_est,nom_sit) cod_est,dir,nom_sit,lat,long, provincia,canton,parroquia'))
						.select()
						.from('radiobase')
						.where(db.raw(query))
						.then((_radiobase) => {
							if (_radiobase.length) {
								resolve(_radiobase);
							} else {
								reject('Not Found');
							}
						})
						.catch((error) => {
							reject({ Error: error });
						});
		});
	}

	async updateRadioBase(db, request) {
		var { cod_est, direccion, nombre_estructura, prev_nombre_estructura, latitud, longitud } = request;
		let coordenadas = new Coordenadas(latitud, longitud);
		let [ lat_dec, long_dec ] = coordenadas.coordenadasDecimales();
		let [ lat_dms, long_dms ] = coordenadas.coordenadasDMS();
		return new Promise((resolve, reject) => {
			db
				.transaction((trx) => {
					return trx('radiobase')
						.update({
							lat: lat_dms,
							long: long_dms,
							lat_dec: lat_dec,
							long_dec: long_dec,
							dir: direccion,
							nom_sit: nombre_estructura
						})
						.where('cod_est', cod_est)
						.andWhere('nom_sit', prev_nombre_estructura)
						.then((coordenadas) => {
							return trx
								.raw(
									`UPDATE radiobase SET geom = ST_SetSRID(ST_MakePoint(:long_dec,:lat_dec),4326) WHERE LOWER(cod_est)=LOWER(:cod_est) AND LOWER(nom_sit)=LOWER(:nombre_estructura)`,
									{ cod_est, nombre_estructura: prev_nombre_estructura, long_dec, lat_dec }
								)
								.then((estructura) => {
									resolve({
										lat_dms,
										long_dms
									});
								})
								.catch((error) => {
									reject({ Error: error });
								});
						})
						.then(trx.commit)
						.catch((err) => {
							return trx.rollback;
						});
				})
				.catch((err) => {
					reject({ Error: err });
				});
		});
	}

	async getRadiobaseForLocation(db, request, requestBody) {
		return new Promise((resolve, reject) => {
			db.transaction((trx) => {
				switch (requestBody.nivel_interrupcion) {
					case 'PROVINCIA':
						return trx('usuario')
							.select('cod_est')
							.innerJoin('lnk_operador', 'id_user2', 'id_user')
							.innerJoin('operador', 'id_operadora3', 'id_operadora')
							.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
							.innerJoin('tecnologia', 'id_tec', 'id_tec1')
							.whereIn('tecnologia', requestBody.tecnologias_afectadas)
							.andWhere('id_user', request.id_user)
							.andWhere('provincia', requestBody.location.provincia)
							.groupBy('cod_est')
							.orderBy('cod_est')
							.then((_codigo_estacion) => {
								return trx('usuario')
									.select('id_bs', 'cod_est', 'cell_id')
									.innerJoin('lnk_operador', 'id_user2', 'id_user')
									.innerJoin('operador', 'id_operadora3', 'id_operadora')
									.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
									.innerJoin('tecnologia', 'id_tec', 'id_tec1')
									.whereIn('tecnologia', requestBody.tecnologias_afectadas)
									.andWhere('id_user', request.id_user)
									.andWhere('provincia', requestBody.location.provincia)
									.then((_cell_id) => {
										resolve({
											codigo_estacion: _codigo_estacion,
											cell_ids: _cell_id
										});
									});
							})
							.then(trx.commit) //continua con la operacion
							.catch((err) => {
								return trx.rollback;
							}); //Si no es posible elimna el proces0
					case 'CANTON':
						return trx('usuario')
							.select('cod_est')
							.innerJoin('lnk_operador', 'id_user2', 'id_user')
							.innerJoin('operador', 'id_operadora3', 'id_operadora')
							.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
							.innerJoin('tecnologia', 'id_tec', 'id_tec1')
							.whereIn('tecnologia', requestBody.tecnologias_afectadas)
							.andWhere('id_user', request.id_user)
							.andWhere('provincia', requestBody.location.provincia)
							.andWhere('canton', requestBody.location.canton)
							.groupBy('cod_est')
							.orderBy('cod_est')
							.then((_codigo_estacion) => {
								return trx('usuario')
									.select('id_bs', 'cod_est', 'cell_id')
									.innerJoin('lnk_operador', 'id_user2', 'id_user')
									.innerJoin('operador', 'id_operadora3', 'id_operadora')
									.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
									.innerJoin('tecnologia', 'id_tec', 'id_tec1')
									.whereIn('tecnologia', requestBody.tecnologias_afectadas)
									.andWhere('id_user', request.id_user)
									.andWhere('provincia', requestBody.location.provincia)
									.andWhere('canton', requestBody.location.canton)
									.then((_cell_id) => {
										resolve({
											codigo_estacion: _codigo_estacion,
											cell_ids: _cell_id
										});
									});
							})
							.then(trx.commit) //continua con la operacion
							.catch((err) => {
								return trx.rollback;
							}); //Si no es posible elimna el proces0
					case 'PARROQUIA':
						return trx('usuario')
							.select('cod_est')
							.innerJoin('lnk_operador', 'id_user2', 'id_user')
							.innerJoin('operador', 'id_operadora3', 'id_operadora')
							.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
							.innerJoin('tecnologia', 'id_tec', 'id_tec1')
							.whereIn('tecnologia', requestBody.tecnologias_afectadas)
							.andWhere('id_user', request.id_user)
							.andWhere('provincia', requestBody.location.provincia)
							.andWhere('canton', requestBody.location.canton)
							.andWhere('parroquia', requestBody.location.parroquia)
							.groupBy('cod_est')
							.orderBy('cod_est')
							.then((_codigo_estacion) => {
								return trx('usuario')
									.select('id_bs', 'cod_est', 'cell_id')
									.innerJoin('lnk_operador', 'id_user2', 'id_user')
									.innerJoin('operador', 'id_operadora3', 'id_operadora')
									.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
									.innerJoin('tecnologia', 'id_tec', 'id_tec1')
									.whereIn('tecnologia', requestBody.tecnologias_afectadas)
									.andWhere('id_user', request.id_user)
									.andWhere('provincia', requestBody.location.provincia)
									.andWhere('canton', requestBody.location.canton)
									.andWhere('parroquia', requestBody.location.parroquia)
									.then((_cell_id) => {
										resolve({
											codigo_estacion: _codigo_estacion,
											cell_ids: _cell_id
										});
									});
							})
							.then(trx.commit) //continua con la operacion
							.catch((err) => {
								return trx.rollback;
							}); //Si no es posible elimna el proces0
				}
			});
		}).catch((error) => {
			reject({ Error: error });
		});
	}

	async getRadioBasesForInterruption(db, request) {
		console.log(request, '$^%%^$#');
		return new Promise((resolve, reject) => {
			db
				.transaction((trx) => {
					switch (request.nivel_interrupcion) {
						case 'PROVINCIA':
							return trx('usuario')
								.select('provincia')
								.innerJoin('lnk_operador', 'id_user2', 'id_user')
								.innerJoin('operador', 'id_operadora3', 'id_operadora')
								.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
								.innerJoin('tecnologia', 'id_tec', 'id_tec1')
								.whereIn('tecnologia', request.tecnologias_afectadas.split(','))
								.andWhere('id_user', request.id_user)
								.andWhere(db.raw(`LOWER(provincia) LIKE LOWER('%${request.provincia}%')`))
								.groupBy('provincia')
								.orderBy('provincia')
								.then((_radiobases) => {
									resolve(_radiobases);
								})
								.then(trx.commit) //continua con la operacion
								.catch((err) => {
									return trx.rollback;
								}); //Si no es posible elimna el proces0
						case 'CANTON':
							return trx('usuario')
								.select('provincia', 'canton')
								.innerJoin('lnk_operador', 'id_user2', 'id_user')
								.innerJoin('operador', 'id_operadora3', 'id_operadora')
								.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
								.innerJoin('tecnologia', 'id_tec', 'id_tec1')
								.whereIn('tecnologia', request.tecnologias_afectadas.split(','))
								.andWhere('id_user', request.id_user)
								.andWhere(db.raw(`LOWER(canton) LIKE LOWER('%${request.canton}%')`))
								.groupBy('provincia', 'canton')
								.orderBy('canton')
								.then((_radiobases) => {
									resolve(_radiobases);
								})
								.then(trx.commit) //continua con la operacion
								.catch((err) => {
									return trx.rollback;
								}); //Si no es posible elimna el proces0
						case 'PARROQUIA':
							return trx('usuario')
								.select('provincia', 'canton', 'parroquia')
								.innerJoin('lnk_operador', 'id_user2', 'id_user')
								.innerJoin('operador', 'id_operadora3', 'id_operadora')
								.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
								.innerJoin('tecnologia', 'id_tec', 'id_tec1')
								.whereIn('tecnologia', request.tecnologias_afectadas.split(','))
								.andWhere('id_user', request.id_user)
								.andWhere(db.raw(`LOWER(parroquia) LIKE LOWER('%${request.parroquia}%')`))
								.groupBy('provincia', 'canton', 'parroquia')
								.orderBy('parroquia')
								.then((_radiobases) => {
									resolve(_radiobases);
								})
								.then(trx.commit) //continua con la operacion
								.catch((err) => {
									return trx.rollback;
								}); //Si no es posible elimna el proces0
					}
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async getRadioBasesInterruptionForProvince(db, request) {
		return new Promise((resolve, reject) => {
			db
				.select('provincia')
				.from('radiobase')
				.where(db.raw(`LOWER(provincia) LIKE LOWER('%${request.provincia}%')`))
				.groupBy('provincia')
				.orderBy('provincia')
				.then((_radiobases) => {
					if (_radiobases.length) {
						resolve(_radiobases);
					} else {
						reject('Not Found');
					}
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async getRadioBasesInterruptionForCanton(db, request) {
		return new Promise((resolve, reject) => {
			db
				.select('provincia', 'canton')
				.from('radiobase')
				.where(db.raw(`LOWER(canton) LIKE LOWER('%${request.canton}%')`))
				.groupBy('provincia', 'canton')
				.orderBy('canton')
				.then((_radiobases) => {
					if (_radiobases.length) {
						resolve(_radiobases);
					} else {
						reject('Not Found');
					}
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async getRadioBasesInterruptionForParish(db, request) {
		return new Promise((resolve, reject) => {
			db
				.select('provincia', 'canton', 'parroquia')
				.from('radiobase')
				.where(db.raw(`LOWER(parroquia) LIKE LOWER('%${request.parroquia}%')`))
				.groupBy('provincia', 'canton', 'parroquia')
				.orderBy('parroquia')
				.then((_radiobases) => {
					if (_radiobases.length) {
						resolve(_radiobases);
					} else {
						reject('Not Found');
					}
				})
				.catch((error) => {
					reject({ Error: error });
				});
		});
	}

	async getRadioBasesForCellID(db, request) {
		return new Promise((resolve, reject) => {
			db
				.transaction((trx) => {
					trx('radiobase')
						.select('id_bs', 'cell_id', 'cod_est', 'id_operadora2')
						.where('id_bs', request.interruptionIdBs)
						.then((_radiobases) => {
							return trx('radiobase')
								.select(
									'id_bs',
									'cell_id',
									'cod_est',
									'nom_sit',
									'dir',
									'parroquia',
									'canton',
									'provincia'
								)
								.where({
									cod_est: _radiobases[0].cod_est,
									id_operadora2: _radiobases[0].id_operadora2
								})
								.then((__radiobases) => {
									resolve(__radiobases);
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
};

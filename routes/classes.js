// const knex = require('knex');
const db = require('../knex');
// var moment= require('moment');
var moment = require('moment-timezone');
const path = require('path');
const { compile, generatePdf } = require('../services/pdfGenerator/index');
const _sendMail = require('../services/email');

// const db = knex({
// 	client: 'pg',
// 	connection: process.env.POSTGRES_URI
// });

class Report {
	constructor(html, header, id_interruption) {
		(this.html = html), (this.header = header), (this.id_interruption = id_interruption);
	}
	updateReport() {
		return new Promise((resolve, reject) => {
			db
				.transaction((trx) => {
					return trx('interrupcion_rev')
						.update({
							html: this.html,
							codigoreport: this.header.codigoReport,
							coordinacionzonal: this.header.coordinacionZonal,
							asunto: this.header.asunto
						})
						.where('id_rev', this.id_interruption)
						.then((numberOfUpdatedRows) => {
							if (numberOfUpdatedRows) {
								resolve(numberOfUpdatedRows);
							}
						})
						.then(trx.commit) //continua con la operacion
						.catch((err) => {
							console.log(err);
							return trx.rollback;
						}); //Si no es posible elimna el proces0
				})
				.catch((err) => {
					console.log(err);
					reject({ Error: err });
				});
		});
	}
	rebuildReport() {
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
						.where('id_inte6', this.id_interruption)
						.then((data) => {
							var dataObj = data[0];
							dataObj.dataReport = moment.tz('America/Guayaquil').format();
							dataObj.interruptionLevelValue =
								dataObj[dataObj.nivel_interrupcion.concat('_inte').toLowerCase()];
							compile('format_generate_init_report', { data: dataObj }, undefined)
								.then((html) => {
									// content=html;
									content = {
										html: html,
										codigoReport: dataObj.codigoreport,
										coordinacionZonal: dataObj.coordinacionzonal,
										asunto: dataObj.asunto
									};
									processFile();
								})
								.catch((error) => {
									console.log({ Error: error });
									return reject('Fail Generation Report');
								});
						})
						.then(trx.commit) //continua con la operacion
						.catch((err) => {
							console.log(err);
							return trx.rollback;
						}); //Si no es posible elimna el proces0
				})
				.catch((err) => {
					return reject({ Error: err });
				});

			async function processFile() {
				resolve(content);
			}
		});
	}

	async sendMail() {
		await generatePdf(this.html, this.header, undefined, undefined, 'Reporte');
		return await _sendMail(undefined, 'maibol_33@hotmail.com', 'Reporte de Interrupcion', undefined, undefined, [
			{
				filename: `Reporte.pdf`,
				path: path.join(process.cwd(), `Reporte.pdf`),
				contentType: 'application/pdf'
			}
		])
			.then((data) => {
				return data;
			})
			.catch((error) => {
				return { Error: error };
			});
	}
}

class InterruptionDate {
	constructor(actualDate, id_interruption) {
		// this.startDate=startDate;
		this.actualDate = actualDate;
		this.id_interruption = id_interruption;
		// this.calculateTime.prototype.parent=this;
	}

	// init(){
	//     this.calculateTimeMethod();
	// }
	getInterruptionDate() {
		return new Promise((resolve, reject) => {
			db
				.transaction((trx) => {
					return trx('interrupcion')
						.select('*')
						.where('id_inte', this.id_interruption)
						.then((data) => {
							var dataObj = data[0];
							let actualTime = this.calculateBusinessDays(dataObj.fecha_inicio);
							resolve(actualTime);
						})
						.then(trx.commit) //continua con la operacion
						.catch((err) => {
							console.log(err);
							return trx.rollback;
						}); //Si no es posible elimna el proces0
				})
				.catch((err) => {
					return reject({ Error: err });
				});
		});
	}

	async calculateBusinessDays(startDate) {
		//Initiallize variables
		// let day1 = moment(this.startDate).utc();
		// let day2 = moment(this.actualDate).utc();
		let day1 = moment(startDate).tz('America/Guayaquil');
		let day2 = moment(this.actualDate).tz('America/Guayaquil');
		let adjust = 1;
		// console.log('testa//--/-/',day1.format('YYYY-MM-DD hh:mm:ss'),day2.format('YYYY-MM-DD hh:mm:ss'),startDate)
		// console.log('//../',day1.dayOfYear(),day2.dayOfYear())
		// if((day1.dayOfYear() === day2.dayOfYear()) && (day1.year() === day2.year())){
		//   return 0;
		// }

		//Check if second date is before first date to switch
		if (day2.isBefore(day1)) {
			const temp = day1;
			day1 = day2;
			day2 = temp;
			//   day2 = moment(this.startDate);
			//   day1 = moment(this.actualDate);
		}

		//Check if first date starts on weekends
		if (day1.day() === 6) {
			//Saturday
			//Move date to next week monday
			day1.day(8);
			day1 = moment(day1, 'YYYY-MM-DD');
			try {
				day1.set({
					hour: moment('23:59:59', 'hh:mm:ss').get('hour'),
					minute: moment('23:59:59', 'hh:mm:ss').get('minute'),
					second: moment('23:59:59', 'hh:mm:ss').get('second')
				});
			} catch (e) {
				console.log(e);
			}
		} else if (day1.day() === 0) {
			//Sunday
			//Move date to current week monday
			day1.day(1);
			day1 = moment(day1, 'YYYY-MM-DD');
			try {
				day1.set({
					hour: moment('23:59:59', 'hh:mm:ss').get('hour'),
					minute: moment('23:59:59', 'hh:mm:ss').get('minute'),
					second: moment('23:59:59', 'hh:mm:ss').get('second')
				});
			} catch (e) {
				console.log(e);
			}
		}

		// console.log('test1', day1.format('LLLL'), day2.format('LLLL'));

		//Check if second date starts on weekends
		if (day2.day() === 6) {
			//Saturday
			//Move date to current week friday
			day2.day(5);
			day2 = moment(day2, 'YYYY-MM-DD');
			try {
				day2.set({
					hour: moment('23:59:59', 'hh:mm:ss').get('hour'),
					minute: moment('23:59:59', 'hh:mm:ss').get('minute'),
					second: moment('23:59:59', 'hh:mm:ss').get('second')
				});
			} catch (e) {
				console.log(e);
			}
		} else if (day2.day() === 0) {
			//Sunday
			//Move date to previous week friday
			day2.day(-2);
			day2 = moment(day2, 'YYYY-MM-DD');
			try {
				day2.set({
					hour: moment('00:00:00', 'hh:mm:ss').get('hour'),
					minute: moment('00:00:00', 'hh:mm:ss').get('minute'),
					second: moment('00:00:00', 'hh:mm:ss').get('second')
				});
			} catch (e) {
				console.log(e);
			}
		}

		// console.log(
		// 	'test2',
		// 	day1.format('LLLL'),
		// 	day2.format('LLLL'),
		// 	// dayk.format('LLLL'),
		// 	// moment('23:59').format('hh:mm:ss')
		// 	moment('23:59:59', 'hh:mm:ss').get('hour'),
		// 	moment('23:59:59', 'hh:mm:ss').get('minute'),
		// 	moment('23:59:59', 'hh:mm:ss').get('second')
		// );

		const day1Week = day1.week();
		let day2Week = day2.week();

		//Check if two dates are in different week of the year
		if (day1Week !== day2Week) {
			//Check if second date's year is different from first date's year
			if (day2Week < day1Week) {
				day2Week += day1Week;
			}
			//Calculate adjust value to be substracted from difference between two dates
			adjust = -2 * (day2Week - day1Week);
		}
		// return day2.diff(day1, 'days',true) + adjust;
		// console.log('asa',day2.diff(day1, 'days',true) + adjust)
		// console.log('safd',moment(),moment.duration(day2.diff(day1)+adjust,'days'),moment.duration(day2.diff(day1)+adjust,'days').asDays())
		try {
			// console.log('tea',day1.format('LLLL'),day2.format('LLLL'),adjust,moment(day2).tz("America/Guayaquil").diff(moment(day1).tz("America/Guayaquil"),'days',true))
			// return moment(day2).tz("America/Guayaquil").diff(moment(day1).tz("America/Guayaquil"),'days',true)+adjust;
			let days = moment(day2)
				.tz('America/Guayaquil')
				.diff(moment(day1).tz('America/Guayaquil') + adjust, 'days', true);
			// console.log('test', day1.format('LLLL'), day2.format('LLLL'), days);
			return days;
		} catch (e) {
			console.log(e);
			return e;
		}
	}
}

class Coordenadas {
	constructor(latitud, longitud) {
		this.latitud = latitud;
		this.longitud = longitud;
	}

	coordenadasDecimales() {
		var stringCoordinates = `${this.latitud} ${this.longitud}`;
		const regex = /((?:[\+-]?[0-9]*[\.,][0-9]+)|(?:[\+-]?[0-9]+))|(?:[N n S s E e W w O o])/gm;
		// const str = ``;
		var coodinates = stringCoordinates.replace(/\s/g, '').match(regex);
		this.lat;
		this.long;
		if (coodinates.length === 2) {
			this.lat = coodinates[0];
			this.long = coodinates[1];
		} else {
			let lat =
				(Number(coodinates[0]) + Number(coodinates[1]) / 60 + Number(coodinates[2]) / 3600) *
				(coodinates.includes('S') || coodinates.includes('s') ? -1 : 1);
			let long =
				(Number(coodinates[4]) + Number(coodinates[5]) / 60 + Number(coodinates[6]) / 3600) *
				(coodinates.includes('W') ||
				coodinates.includes('O') ||
				coodinates.includes('w') ||
				coodinates.includes('o')
					? -1
					: 1);
			this.lat = lat;
			this.long = long;
		}
		return [ this.lat, this.long ];
	}
	coordenadasDMS() {
		return [ this.decimalDegrees2DMS(this.lat, 'Latitude'), this.decimalDegrees2DMS(this.long, 'Longitude') ];
	}
	sign(x) {
		return typeof x === 'number' ? (x ? (x < 0 ? -1 : 1) : x === x ? x : NaN) : NaN;
	}
	decimalDegrees2DMS(value, type) {
		value = Number(value);
		var degrees = Math.trunc(value);
		var submin = Math.abs((value - Math.trunc(value)) * 60);
		var minutes = Math.trunc(submin);
		var subseconds = Math.abs((submin - Math.trunc(submin)) * 60);
		var direction = '';
		if (type == 'Longitude') {
			if (degrees < 0) {
				direction = 'W';
			} else if (degrees > 0) {
				direction = 'E';
			} else if (degrees === 0) {
				if (Object.is(this.sign(degrees), 0)) {
					direction = 'E';
				} else {
					direction = 'W';
				}
			}
		} else if (type == 'Latitude') {
			if (degrees < 0) {
				direction = 'S';
			} else if (degrees > 0) {
				direction = 'N';
			} else if (degrees === 0) {
				if (Object.is(this.sign(degrees), 0)) {
					direction = 'N';
				} else {
					direction = 'S';
				}
			}
		}
		let notation = `${Math.abs(degrees)}\u00b0${minutes}'${subseconds.toFixed(2)}" ${direction}`;
		return notation;
	}
}

class Interrupcion {
	constructor(IntRb) {
		this.IntRb = IntRb;
	}

	createDataForReport(IntRb) {
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
		return {
			localidad: IntRb.interruptionRB.interruptionLevel,
			email_supervision: 'supervision@cnt.gob.ec',
			email_cumplimiento_regulatorio: 'cumplimientoregulatorio@cnt.gob.ec',
			coordinacion_zonal: IntRb.coordinacion_zonal,
			email_self: 'cmarcag@gmail.com',
			operadora: 'CNT',
			date: moment.tz('America/Guayaquil').format('YYYY-MM-DD hh:mm:ss'),
			localidad_selected: localidad_selected,
			email_to_send: IntRb.interruptionEmailAddress,
			date_init: moment(IntRb.interruptionDate.interruptionStart).tz('America/Guayaquil').format('YYYY:MM:DD'),
			hora: moment(IntRb.interruptionDate.interruptionStart).tz('America/Guayaquil').format('hh:mm:ss'),
			SMS: IntRb.interruptionServices.includes('SMS') ? 'X' : '-',
			VOZ: IntRb.interruptionServices.includes('VOZ') ? 'X' : '-',
			DATOS: IntRb.interruptionServices.includes('DATOS') ? 'X' : '-',
			GSM: IntRb.interruptionTechnologies.includes('GSM') ? 'X' : '-',
			UMTS: IntRb.interruptionTechnologies.includes('UMTS') ? 'X' : '-',
			LTE: IntRb.interruptionTechnologies.includes('LTE') ? 'X' : '-',
			tiempo_interrupcion:
				IntRb.interruptionType === 'Scheduled' ? IntRb.interruptionDate.interruptionTime : 'No definido'
		};
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
										// area: RB.interruptionSector,
										area: RB.interruptionRB.interruptionSector,
										// estado_int: 'Inicio',
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
															console.log('test_inte', interrupcion[0]);
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
				// .then(()=>console.log('OK'))
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
		// var Technologies= technologies.map((technology)=>{
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
}

module.exports = {
	Report,
	InterruptionDate,
	Coordenadas,
	Interrupcion
};

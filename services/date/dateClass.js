// const knex = require('knex');
const db = require('../../knex');
var moment = require('moment-timezone');

module.exports = class InterruptionDate {
	constructor(actualDate, id_interruption) {
		this.actualDate = actualDate;
		this.id_interruption = id_interruption;
	}

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
	//Metodo en revision
	async calculateBusinessDays(startDate, endDate = this.actualDate) {
		let day1 = moment(startDate).tz('America/Guayaquil');
		let day2 = moment(endDate).tz('America/Guayaquil');
		let adjust = 1;

		if (day2.isBefore(day1)) {
			return 0;
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
		try {
			let days = moment(day2)
				.tz('America/Guayaquil')
				.diff(moment(day1).tz('America/Guayaquil') + adjust, 'days', true);
			return days;
		} catch (e) {
			return e;
		}
	}
};

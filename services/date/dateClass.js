const knex = require('knex');
var moment = require('moment-timezone');

const db = knex({
	client: 'pg',
	connection: process.env.POSTGRES_URI
});

module.exports = class InterruptionDate {
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
			// const temp = day1;
			// day1 = day2;
			// day2 = temp;
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
};

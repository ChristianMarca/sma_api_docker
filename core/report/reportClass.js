// const knex = require('knex');
const db = require('../../knex');
var moment = require('moment-timezone');
const path = require('path');
const { compile, generatePdf } = require('../../services/pdfGenerator/index');
const _sendMail = require('../../services/email');

// const db = knex({
// 	client: 'pg',
// 	connection: process.env.POSTGRES_URI
// });

module.exports = class Report {
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

	async sendMail(email) {
		return new Promise((resolve, reject) => {
			generatePdf(this.html, this.header, undefined, undefined, 'Reporte').then((pdf) => {
				return _sendMail(undefined, email, 'Reporte de Interrupcion', undefined, undefined, [
					{
						filename: 'Reporte.pdf',
						path: path.join(process.cwd(), `Reporte.pdf`),
						contentType: 'application/pdf'
					}
				])
					.then((data) => {
						resolve(data);
					})
					.catch((error) => {
						reject({ Error: error });
					});
			});
		});
		// await generatePdf(this.html, this.header);
		// return await _sendMail(undefined, email, 'Reporte de Interrupcion', undefined, undefined, [
		// 	{
		// 		filename: 'test.pdf',
		// 		path: path.join(process.cwd(), `test.pdf`),
		// 		contentType: 'application/pdf'
		// 	}
		// ])
		// 	.then((data) => {
		// 		return data;
		// 	})
		// 	.catch((error) => {
		// 		return { Error: error };
		// 	});
	}
};

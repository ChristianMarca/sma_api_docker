// const knex = require('knex');
const db = require('../../knex');
require('dotenv').load();

const verifyRBForCod_Est = async (IntRb, validar = validarCodEstFunction) => {
	var Estaciones = Object.keys(IntRb.interruptionRadioBase.radioBasesAdd).map((key) => {
		return Object.keys(IntRb.interruptionRadioBase.radioBasesAdd[key]).map((key_) => {
			return IntRb.interruptionRadioBase.radioBasesAdd[key][key_];
		});
	});
	var Elements = validar(Estaciones, IntRb)
		.then((data) => {
			IntRb.interruptionRadioBase.radioBasesAddID_BS = data;
			return IntRb;
		})
		.catch((e) => 'Fail');
	return Promise.resolve(Elements);
};

const verifyRB = async (radiobases, validar = validarFunction) => {
	var Elements = Object.keys(radiobases.interruptionRadioBase.radioBasesAdd).map(function(key, index) {
		return validar(radiobases.interruptionRadioBase.radioBasesAdd[key])
			.then((data) => {
				radiobases.interruptionRadioBase.radioBasesAdd[key].interruptionIdBs = data;
				return radiobases.interruptionRadioBase.radioBasesAdd[key];
			})
			.catch((e) => 'Fail');
	});
	return Promise.all(Elements);
};
validarFunction = async (RB) => {
	return new Promise((resolve, reject) => {
		if (!RB.interruptionIdBs) {
			db
				.select('id_bs')
				.from('radiobase')
				.where({
					cell_id: RB.interruptionCode.toUpperCase(),
					nom_sit: RB.interruptionBS.toUpperCase()
				})
				.then((user) => {
					if (user.length) {
						resolve((RB.interruptionIdBs = user[0].id_bs));
					} else {
						reject('Not Found');
					}
				})
				.catch((err) => {
					reject('ERROR');
				});
		} else {
			resolve(RB.interruptionIdBs);
		}
	});
};
validarCodEstFunction = async (RB, IntRb) => {
	return new Promise((resolve, reject) => {
		db.transaction((trx) => {
			trx('usuario')
				.select('id_bs')
				.innerJoin('lnk_operador', 'id_user2', 'id_user')
				.innerJoin('operador', 'id_operadora3', 'id_operadora')
				.innerJoin('radiobase', 'id_operadora2', 'id_operadora')
				.innerJoin('tecnologia', 'id_tec', 'id_tec1')
				.whereIn('tecnologia', IntRb.interruptionTechnologies)
				.andWhere('id_user', IntRb.interruptionIdUser)
				.andWhere('cod_est', 'in', RB)
				.groupBy('id_bs')
				.orderBy('id_bs')
				.then((data) => {
					resolve(data);
				})
				.then(trx.commit) //continua con la operacion
				.catch((err) => {
					return trx.rollback;
				}); //Si no es posible elimna el proces0
		});
	});
	// return newData
};

module.exports = {
	verifyRB,
	verifyRBForCod_Est
};

//Metodo abandonado

// if(!req.body.interruptionRB.interruptionIdBs){
//   // console.log('here',req.body.interruptionRB.interruptionCode)
//   db.select('id_bs')
//       .from('radiobase')
//       .where({
//           cell_id:req.body.interruptionRB.interruptionCode.toUpperCase(),
//           nom_sit:req.body.interruptionRB.interruptionBS.toUpperCase()
//       })
//       .then(user=>{
//           console.log('user',user)
//           if (user.length) {
//               IntRb.interruptionRB.interruptionIdBs=user[0].id_bs;
//               // insertNewInterruption(IntRb,res,db)
//                return res.json(user[0]);
//           }else{
//                res.status(404).json('Not Found')
//           }
//           }).catch(err=>{
//               console.log(err)
//               res.status(400).json('ERROR Getting DB')
//           })
//   //res.status(404).json('No Existe la RB')
// }else{
//   res.json('ok')
//   // insertNewInterruption(IntRb,res,db)
// }

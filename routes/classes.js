const knex = require('knex');
// var moment= require('moment');
var moment = require('moment-timezone');
const path = require('path');
const {compile,generatePdf}=require('../services/pdfGenerator/index');
const _sendMail=require('../services/email');

const db=knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
});

class Report{
    constructor(html,header,id_interruption){
        this.html=html,
        this.header=header,
        this.id_interruption=id_interruption
    }
    updateReport(){
        return new Promise((resolve,reject)=>{
            db.transaction(
              trx=>{
                  return trx('interrupcion_rev')
                      .update({
                        'html':this.html,
                        'codigoreport': this.header.codigoReport,
                        'coordinacionzonal':this.header.coordinacionZonal,
                        'asunto': this.header.asunto
                      })
                      .where('id_rev',this.id_interruption)
                      .then(numberOfUpdatedRows=>{
                          if(numberOfUpdatedRows) {
                              resolve(numberOfUpdatedRows);
                          }
                      })
                      .then(trx.commit)//continua con la operacion
                      .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
              }).catch(err=> {console.log(err);reject({Error:err})})
        })
      }
    rebuildReport(){
    
        return new Promise((resolve, reject)=>{
            var content;
            db.transaction(
                trx=>{
                    return trx('interrupcion_rev')
                        .select('*')
                        .innerJoin('interrupcion',"id_inte","id_inte6")
                        .innerJoin('tipo_interrupcion','id_tipo',"id_tipo1")
                        .innerJoin('operador','id_operadora','id_operadora1')
                        .innerJoin('data_operador','id_data_operador','id_data_operador1')
                        .where('id_inte6',this.id_interruption)
                        .then(data=>{
                          var dataObj=data[0];
                            dataObj.dataReport=moment.tz("America/Guayaquil").format();
                            dataObj.interruptionLevelValue=dataObj[dataObj.nivel_interrupcion.concat('_inte').toLowerCase()];
                            compile('format_generate_init_report',{data:dataObj},undefined)
                            .then(html=>{
                                // content=html;
                                content={
                                html:html,
                                codigoReport:dataObj.codigoreport,
                                coordinacionZonal: dataObj.coordinacionzonal,
                                asunto: dataObj.asunto
                                }
                                processFile()
                            })
                            .catch(error=>{
                                console.log({Error:error})
                                return reject('Fail Generation Report')
                            })
                        }).then(trx.commit)//continua con la operacion
                        .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
                }).catch(err=> {return reject({Error:err})})

                async function  processFile(){
                    resolve(content)
                }
        })
    }

    async sendMail(){
            await generatePdf(this.html,this.header)
            return await _sendMail(undefined,'maibol_33@hotmail.com','Reporte de Interrupcion',undefined,undefined,[{
                filename: 'test.pdf',
                path: path.join(process.cwd(),`test.pdf`),
                contentType: 'application/pdf'
            }])
            .then((data)=>{
                return(data)
            })
            .catch((error)=>{return({Error:error})});
    }
}

class InterruptionDate {
    constructor(actualDate,id_interruption){
        // this.startDate=startDate;
        this.actualDate=actualDate;
        this.id_interruption=id_interruption
        // this.calculateTime.prototype.parent=this;
    }
    
    // init(){
    //     this.calculateTimeMethod();
    // }
    getInterruptionDate(){
        return new Promise((resolve, reject)=>{
            db.transaction(
                trx=>{
                    return trx('interrupcion')
                        .select('*')
                        .where('id_inte',this.id_interruption)
                        .then(data=>{
                          var dataObj=data[0];
                            let actualTime=this.calculateBusinessDays(dataObj.fecha_inicio)
                            resolve(actualTime)
                        }).then(trx.commit)//continua con la operacion
                        .catch(err=>{console.log(err);return trx.rollback})//Si no es posible elimna el proces0
                }).catch(err=> {return reject({Error:err})})

        })
    }

    async calculateBusinessDays( startDate ){
        //Initiallize variables
        // let day1 = moment(this.startDate).utc();
        // let day2 = moment(this.actualDate).utc();
        let day1 = moment(startDate).tz("America/Guayaquil");
        let day2 = moment(this.actualDate).tz("America/Guayaquil");
        let adjust = 1;
        console.log('testa//--/-/',day1.format('YYYY-MM-DD hh:mm:ss'),day2.format('YYYY-MM-DD hh:mm:ss'))
        
        if((day1.dayOfYear() === day2.dayOfYear()) && (day1.year() === day2.year())){
          return 0;
        }
        
        //Check if second date is before first date to switch
        if(day2.isBefore(day1)){
            const temp = day1;
            day1 = day2;
            day2 = temp;
        //   day2 = moment(this.startDate);
        //   day1 = moment(this.actualDate);
        }
      
        //Check if first date starts on weekends
        if(day1.day() === 6) { //Saturday
          //Move date to next week monday
          day1.day(8);
        } else if(day1.day() === 0) { //Sunday
          //Move date to current week monday
          day1.day(1);
        }
      
        //Check if second date starts on weekends
        if(day2.day() === 6) { //Saturday
          //Move date to current week friday
          day2.day(5);
        } else if(day2.day() === 0) { //Sunday
          //Move date to previous week friday
          day2.day(-2);
        }
      
        const day1Week = day1.week();
        let day2Week = day2.week();
      
        //Check if two dates are in different week of the year
        if(day1Week !== day2Week){
          //Check if second date's year is different from first date's year
          if (day2Week < day1Week){
            day2Week += day1Week;
          }
          //Calculate adjust value to be substracted from difference between two dates
          adjust = -2 * (day2Week - day1Week);
        }
        // return day2.diff(day1, 'days',true) + adjust;
        // console.log('asa',day2.diff(day1, 'days',true) + adjust)
        // console.log('safd',moment(),moment.duration(day2.diff(day1)+adjust,'days'),moment.duration(day2.diff(day1)+adjust,'days').asDays())
        try{
            // console.log('tea',day1,day2)
            return day2.diff(day1,'days',true)+adjust;

        }catch(e){
            return e
        }
      }

}

module.exports={
    Report,
    InterruptionDate
};
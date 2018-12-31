// const moment= require('moment');
var moment = require('moment-timezone');
const {logo}= require('./base64Images');
var localLocale = moment();
moment.locale('es');
localLocale.locale(false);

const headerTemplate = `
<div style="font-size: 10px; display: flex; flex-direction: row; justify-content: space-between; width: 100%" id='template'>
  <div class='pageNumber' id='num' style="font-size: 10px;">Page number</div>
  <div class='date' style="font-size: 10px;"></div>
  <div class='title' style="font-size: 10px;"></div>
  <div class='url' style="font-size: 10px;"></div>
  <div class='totalPages' style="font-size: 10px;"></div>
  <script>
    var pageNum = document.getElementById("num");
    pageNum.remove()
    var template = document.getElementById("template")
    template.style.background = 'red';
  </script>
</div>`
const tempHeader_=`
<style>
  table, td, td {
    border: 1px solid black;
    border-collapse: collapse;
  }
  table{
    width: 80%;
    align-content: center;
  align-items: center; 
  }
  .rowTable{
    width: 100%;
  }
  .itemTable{
    padding: 5px;
  }
  .dateClass{
    width: 80%;
  }
  .page{
    width: auto;
  }
  .affair{
    width: 15%!important;
  }
  .description{
    width: auto;
  }
</style>
<div style="width:100%; display: flex; flex-direction:column; align-content:center;align-items:center;" id='template' >
  <div style="font-size: 10px; display: flex; flex-direction: row; justify-content: flex-end; width: 100%">
    <span style="content: url(${logo}); max-height:50px; padding-right:20mm;" class="logo"></span>
  </div>
  <div style="font-size: 10pt; display: flex; flex-direction: column; justify-content: flex-around; width: 100%; height:100%;text-align:center;">
    <div>
      <strong>COORDINACIÓN ZONAL 6</strong>
    </div>
    <div>
      <strong>INFORME TÉCNICO No. IT-CZO6-C-2018-0450</strong>
    </div>
  </div> 
  <table style="width:80%; font-size:10px;">
    <tr>
      <td colspan="4" class="dateClass"><strong>Fecha:</strong> ${localLocale.format('LLLL')}</td>
      <td class="page">
        <div style="font-size: 10px; display: flex; flex-direction: row; justify-content: flex-start; padding-left:10%;">
            <div>Pagina &nbsp;</div>
            <div class='pageNumber' id='num' style="font-size: 10px;">Page number</div>
            <div style="">&nbsp;de&nbsp;</div>
            <div class='totalPages' style="font-size: 10px;"></div>
        </div>
      </td>
    </tr>
    <tr>
      <td class='affair'><strong>Asunto:</strong></td>
      <td colspan="4" class="description">
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      </td>
    </tr>
  </table>
</div>
`;
tempHeader=(asunto,codigoReporte,coordinacionZonal)=>{
  return `
  <style>
    table, td, td {
      border: 1px solid black;
      border-collapse: collapse;
    }
    table{
      width: 80%;
      align-content: center;
    align-items: center; 
    }
    .rowTable{
      width: 100%;
    }
    .itemTable{
      padding: 5px;
    }
    .dateClass{
      width: 80%;
    }
    .page{
      width: auto;
    }
    .affair{
      width: 15%!important;
    }
    .description{
      width: auto;
    }
  </style>
  <div style="width:100%; display: flex; flex-direction:column; align-content:center;align-items:center;" id='template' >
    <div style="font-size: 10px; display: flex; flex-direction: row; justify-content: flex-end; width: 100%">
      <span style="content: url(${logo}); max-height:50px; padding-right:20mm;" class="logo"></span>
    </div>
    <div style="font-size: 10pt; display: flex; flex-direction: column; justify-content: flex-around; width: 100%; height:100%;text-align:center;">
      <div>
        <strong>Coordinacion Zonal ${coordinacionZonal}</strong>
      </div>
      <div>
        <strong>INFORME TÉCNICO ${codigoReporte}</strong>
      </div>
    </div> 
    <table style="width:80%; font-size:10px;">
      <tr>
        <td colspan="4" class="dateClass"><strong>Fecha:</strong> ${localLocale.format('LLLL')}</td>
        <td class="page">
          <div style="font-size: 10px; display: flex; flex-direction: row; justify-content: flex-start; padding-left:10%;">
              <div>Pagina &nbsp;</div>
              <div class='pageNumber' id='num' style="font-size: 10px;">Page number</div>
              <div style="">&nbsp;de&nbsp;</div>
              <div class='totalPages' style="font-size: 10px;"></div>
          </div>
        </td>
      </tr>
      <tr>
        <td class='affair'><strong>Asunto:</strong></td>
        <td colspan="4" class="description">
        ${asunto}
        </td>
      </tr>
    </table>
  </div>
  `
};
const tempFooter = `
<div style="font-size: 10px; display: flex; flex-direction: row; justify-content: space-between; padding-left:5mm;padding-right:5mm; width:100%;" id='templateFooter'>
  <div style="">
    <div style="font-size: 10px;">Luis Cordero 16-50 y Héroes de Verdeloma (593 -7) 2820860</div>
    <div style="font-size: 10px;">1800 567 567 Casilla 1721-1797</div>
    <div style="font-size: 10px;">Cuenca Ecuador</div>
  </div>
  <div style="font-size: 10px; display: flex; flex-direction: row; justify-content: flex-end; padding-left:10%;">
    
      <div>Pagina &nbsp;</div>
      <div class='pageNumber' id='num' style="font-size: 10px;">Page number</div>
      <div style="">&nbsp; de &nbsp;</div>
      <div class='totalPages' style="font-size: 10px;"></div>
  </div>

  <script>
    var pageNum = document.getElementById("num");
    pageNum.remove()
    var template = document.getElementById("template")
    template.style.background = 'red';
  </script>
</div>`

module.exports={
  tempHeader,
  tempFooter
}
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');
const moment= require('moment');
const data = require('./data.json');

compile=async(templateName, data)=>{
  const filePath= path.join(process.cwd(),'templates',`${templateName}.hbs`);
  const html= await fs.readFile(filePath, 'utf-8');
  return hbs.compile(html)(data)
}

hbs.registerHelper('dateFormat',(value,format)=>{
  return moment(value).format(format); 
});

(async()=>{
  try{

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // const content= await compile('format_pdf', data);
    const content= await compile('informe_inicio', data);
    console.log(content)
    await page.setContent(content);
    await page.emulateMedia('screen');
    await page.pdf({
      path: 'test.pdf',
      format: 'A4',
      printBackground: true
    })
    await page.pdf({
      path: 'test1.pdf',
      printBackground: true
    })

    console.log('Success!!!');
    await browser.close();
    process.exit();

  }catch(err){
    console.log('Error ', console.error(err));
  }
})();
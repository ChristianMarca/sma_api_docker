const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');
var moment = require('moment-timezone');
const { tempFooter, tempHeader } = require('./templates/templates');
const { promisify } = require('util');
const juice = require('juice');

const configJuice = {
	applyStyleTags: true,
	removeStyleTags: true,
	preserveMediaQueries: true,
	preserveFontFaces: true,
	applyWidthAttributes: true,
	applyHeightAttributes: true,
	applyAttributesTableElements: true
};

compile = async (templateName, data, path_ = path.join(__dirname, 'templates')) => {
	const filePath = path.join(path_, `${templateName}.hbs`);
	const html = await fs.readFile(filePath, 'utf-8');
	return juice(hbs.compile(html)(data), configJuice);
};

hbs.registerHelper('dateFormat', (value, format) => {
	return moment(value).tz('America/Guayaquil').format(format);
});

const OUT_FILE = 'format_1.html';

generatePdf = async (content, header, _tempHeader, _tempFooter, name_file) => {
	try {
		// const browser = await puppeteer.launch();
		const browser = await puppeteer.launch({
			// headless: false,
			args: [ '--no-sandbox' ]
		});
		const page = await browser.newPage();
		// const use=juice(content, configJuice);
		// console.log(juice(tempHeader, configJuice))
		await promisify(fs.writeFile)(OUT_FILE, content);
		// await page.setContent(content,{ waitUntil: 'networkidle' });
		// await page.emulateMedia('screen');
		// await page.goto(`data:text/html,${content}`, { waitUntil: 'netwoerkidle0' });
		await page.goto(`file://${process.cwd()}/${OUT_FILE}`, { waitUntil: 'networkidle0' });
		await page.pdf({
			path: `${name_file}.pdf`,
			format: 'A4',
			printBackground: true,
			headerTemplate: _tempHeader || tempHeader(header.asunto, header.codigoReport, header.coordinacionZonal),
			footerTemplate: _tempFooter || tempFooter,
			displayHeaderFooter: true,
			margin: {
				top: '65mm',
				right: '25mm',
				bottom: '25mm',
				left: '25mm'
			}
		});
		await browser.close();
		// await process.exit();
	} catch (err) {
		console.log('Error ', console.error(err));
	}
};

module.exports = { compile, generatePdf };

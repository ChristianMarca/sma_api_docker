var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var inLineCss = require('nodemailer-juice');
require('dotenv').load();

var transporter = nodemailer.createTransport(
	smtpTransport({
		service: 'gmail',
		host: 'smtp.gmail.com',
		port: 587,
		starttls: {
			enable: true
		},
		secureConnection: true,
		auth: {
			user: process.env.EMAIL_GMAIL,
			pass: process.env.PASSWORD_GMAIL
		},
		tls: {
			rejectUnauthorized: false
		}
	})
);

_sendMail = (
	from = '<test.sma.app@gmail.com>',
	to,
	subject = 'Register Form Complete',
	text = '',
	html = '<html>Test</html>',
	attachments = []
) => {
	var mailOptions = {
		from,
		to,
		subject,
		text,
		html,
		// attachments:[
		//   {
		//     filename:'test.pdf',
		//     path:'./pdfGenerator/test.pdf'
		//   }
		// ]
		attachments
	};
	//nodemailer verify if email is delivered successfully Pending!!!
	transporter.use('compile', inLineCss());
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				reject(error);
			} else {
				console.log('Email sent: ' + info.response);
				// resolve('Email sent: ' + info.response)
				resolve(info.response);
			}
		});
	});
};

module.exports = _sendMail;

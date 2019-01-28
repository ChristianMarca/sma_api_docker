var nodemailer = require('nodemailer');
// var smtpTransport = require('nodemailer-smtp-transport');
var inLineCss = require('nodemailer-juice');
require('dotenv').load();

//Para Gmail debido a produccion
var transporter = nodemailer.createTransport(
	{
		service: 'gmail',
		host: 'smtp.gmail.com',
		port: 587,
		secure: true,
		auth: {
			type: 'OAuth2',
			user: process.env.EMAIL_GMAIL,
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET_ID,
			refreshToken: process.env.REFRESH_TOKEN,
			accessToken: process.env.ACCESS_TOKEN,
			expires: 1484314697598
		}
	}
	// })
);
//Para servidores SMTP caulquiera
// var transporter = nodemailer.createTransport("SMTP", {
// 	service: 'gmail',
// 	host: 'smtp.gmail.com',
// 	port: 587,
// 	starttls: {
// 		enable: true
// 	},
// 	secureConnection: true,
// 	secure: true,
// 	auth: {
// 		user: process.env.EMAIL_GMAIL,
// 		pass: process.env.PASSWORD_GMAIL
// 	},
// 	tls: {
// 		rejectUnauthorized: false
// 	}
// });

// var transporter = nodemailer.createTransport(transport);

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
				console.log({ Error: error });
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

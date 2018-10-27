var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
require('dotenv').load();

var transporter = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port:587,
  starttls: {
      enable: true
  },
  secureConnection: true,
  auth: {
    user: process.env.EMAIL_GMAIL,
    pass: process.env.PASSWORD_GMAIL
  },
  tls:{
    rejectUnauthorized: false
  }
}));

var mailOptions = {
  from: '<cmarcag@gmail.com>',
  to: 'maibol_33@hotmail.com, cmarcag@hotmail.com',
  subject: 'Test mail in Nodejs',
  text: 'That was easy!',
  attachments:[
    {
      filename:'test.pdf',
      path:'./pdfGenerator/test.pdf'
    }
  ]
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});  
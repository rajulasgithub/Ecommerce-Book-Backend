import path from 'path'
import nodemailer from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import dotenv from "dotenv";
dotenv.config();

const fromEmail = process.env.EMAIL_USER;

let transport;

transport = nodemailer.createTransport({
  host: process.env.MAIL_TRAP_HOST,
  port: process.env.MAIL_TRAP_PORT,
  auth: {
    user: process.env.MAIL_TRAP_USER,
    pass: process.env.MAIL_TRAP_PASS
  },
  secure: false,
});

const handlebarOptions = {
  viewEngine: {
    extname: ".handlebars",
    partialsDir: path.resolve('./views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./views/'),
  extName: ".handlebars"
};


transport.use('compile', hbs(handlebarOptions))

export const sendWelcomeEmail = async (to, subject, template, context) => {
  const mailOptions = {
    from: `"Readify" <${fromEmail}>`,
    template,
    to,
    subject,
    context
  };

  try {
    await transport.sendMail(mailOptions);

  } catch (error) {
    console.log('Nodemailer error sending email to', error);
  }
};

export const sendBlockUnblockEmail = async (to, subject, template, context, blocked) => {
  const mailOptions = {
    from: `"Readify" <${fromEmail}>`,
    template,
    to,
    subject,
    context,

  };
  try {
    await transport.sendMail(mailOptions);
    console.log('Message sent: %s',);
  } catch (error) {
    console.log('Nodemailer error sending email to', error);
  }
};

export const sendDeletUserEmail = async (to, subject, template, context) => {
  const mailOptions = {
    from: `"Readify" <${fromEmail}>`,
    template,
    to,
    subject,
    context,

  };

  try {
    await transport.sendMail(mailOptions)
  } catch (error) {
    console.log('Nodemailer error sending email to', error);
  }
};

export const sendDeleteBookEmail = async (to, subject, template, context) => {
  console.log(subject)
  const mailOptions = {
    from: `"Readify" <${fromEmail}>`,
    template,
    to,
    subject,
    context,

  };

  try {
    await transport.sendMail(mailOptions);
  } catch (error) {
    console.log('Nodemailer error sending email to', error);
  }
};
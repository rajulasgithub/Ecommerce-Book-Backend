import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'

const fromEmail = process.env.MAIL_USER;

let transport;

    transport = nodemailer.createTransport({
        host: process.env.MAIL_TRAP_HOST,
        port: process.env.MAIL_TRAP_PORT,
        auth: {
            user: process.env.MAIL_TRAP_USER,
            pass: process.env.MAIL_TRAP_PASS
        }
    });


const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
};

transport.use('compile', hbs(handlebarOptions))

export const sendWelcomeEmail = async ( to, subject, template, context) => {
    const mailOptions = {
        from: `"Readify"${fromEmail}`,
        template,
        to,
        subject,
        context,
        headers: {
            "X-MT-Category" : 'Reset-password-otp'
        },
    };

    try {
        await transport.sendMail(mailOptions);
        console.log('Message sent: %s',);
      } catch (error) {
        console.log('Nodemailer error sending email to' , error);
      }
};

export const sendBlockUnblockEmail = async ( to, subject, template, context) => {
    const mailOptions = {
        from: `"Readify"${fromEmail}`,
        template,
        to,
        subject,
        context,
        headers: {
            "X-MT-Category" : 'Reset-password-otp'
        },
    };

    try {
        await transport.sendMail(mailOptions);
        console.log('Message sent: %s',);
      } catch (error) {
        console.log('Nodemailer error sending email to' , error);
      }
};

export const sendDeletUserEmail = async ( to, subject, template, context) => {
    const mailOptions = {
        from: `"Readify"${fromEmail}`,
        template,
        to,
        subject,
        context,
        headers: {
            "X-MT-Category" : 'Reset-password-otp'
        },
    };

    try {
        await transport.sendMail(mailOptions);
        console.log('Message sent: %s',);
      } catch (error) {
        console.log('Nodemailer error sending email to' , error);
      }
};
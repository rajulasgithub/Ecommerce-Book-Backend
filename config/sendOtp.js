
// import nodemailer from "nodemailer";


//  export const sendOtpEmail = async (toEmail, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     }
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: toEmail,
//     subject: 'Your OTP Code',
//     text: `Your OTP for password reset is ${otp}. It will expire in 2 minutes.`
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("OTP email sent successfully!");
//   } catch (err) {
//     console.error("Failed to send OTP email:", err);
//     throw err;
//   }
// };


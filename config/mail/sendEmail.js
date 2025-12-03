import nodemailer from "nodemailer"

const sendEmail = async ({ toEmail, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
   from: `"Readify" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}`);
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}

export default sendEmail
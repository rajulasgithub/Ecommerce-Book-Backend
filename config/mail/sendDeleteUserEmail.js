import sendEmail from "./sendEmail.js";

const sendDeleteUserEmail = async (email, firstName) => {
  await sendEmail({
    toEmail: email,
    subject: "Your Account Has Been Deleted",
    html: `
      <h2>Hello ${firstName},</h2>
      <p>Your account has been permanently deleted by the admin.</p>
      <p>If you think this is an error, please contact support immediately.</p>
      <br>
      <p>Regards,<br>Readify Team</p>
    `,
    text: "",
  });
};

export default sendDeleteUserEmail;

import sendEmail from "./sendEmail.js";

const sendBlockStatusEmail = async (email, firstName, isBlocked) => {

  const subject = isBlocked
    ? "Your Account Has Been Blocked"
    : "Your Account Has Been Unblocked";

  const html = `
    <h2>Hello ${firstName},</h2>
    <p>Your account status has been updated.</p>

    ${
      isBlocked
        ? `<p style="color:red;"><strong>Your account is now BLOCKED.</strong></p>
           <p>If you believe this is a mistake, please contact support.</p>`
        : `<p style="color:green;"><strong>Your account is now ACTIVE again.</strong></p>
           <p>You can now log in and continue using our platform.</p>`
    }

    <br>
    <p>Regards,<br>Readify Team</p>
  `;

  // ✔ FIX: Correct way to call your sendEmail function
  await sendEmail({
    toEmail: email,
    subject,
    html
  });
};

export default sendBlockStatusEmail;

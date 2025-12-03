import sendEmail from "./sendEmail.js";

const sendWelcomeEmail = async (toEmail, name, link) => {
  await sendEmail({
    toEmail,
    subject: "Welcome to Readify!",
    text: `Hi ${name}, welcome to our platform! Visit this link to get started: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #111827;">Welcome, ${name}!</h2>
          <p style="color: #6b7280; font-size: 16px;">
            We're excited to have you on board. Get ready to explore all the amazing features we offer.
          </p>
          <a href="${link}" target="_blank" 
            style="
              display: inline-block; 
              margin-top: 20px; 
              padding: 12px 24px; 
              font-size: 16px; 
              color: #ffffff; 
              background-color: #1a73e8; 
              border-radius: 6px; 
              text-decoration: none;
              font-weight: 600;
            "
          >
            Get Started
          </a>
          <p style="margin-top: 25px; color: #9ca3af; font-size: 12px;">
            If you did not sign up for this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  });
};

export default sendWelcomeEmail;

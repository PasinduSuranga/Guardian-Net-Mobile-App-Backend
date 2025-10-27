const nodemailer = require('nodemailer');
require('dotenv').config();

// ---------------------------------------------------------------
// Nodemailer (Email) Setup
// ---------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This is your Gmail "App Password"
  },
});

// ---------------------------------------------------------------
// Helper function to send OTP email
// ---------------------------------------------------------------
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'GuardianNet - Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">GuardianNet Email Verification</h2>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">Thank you for registering with GuardianNet. Your One-Time Password (OTP) is:</p>
          <div style="font-size: 24px; font-weight: bold; color: #fff; background-color: #007bff; text-align: center; padding: 10px 20px; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 16px;">This code will expire in 10 minutes.</p>
          <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
          <p style="font-size: 16px;">Best regards,<br/>The GuardianNet Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error);
    return false;
  }
};

module.exports = { sendOTPEmail };

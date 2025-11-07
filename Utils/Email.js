const nodemailer = require('nodemailer');

// 1. Configure your email transport (e.g., Nodemailer with Gmail, SendGrid, etc.)
// IMPORTANT: Use environment variables (process.env) for credentials!
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

/**
 * Sends a generic email.
 * @param {object} options - Email options.
 * @param {string} options.to - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.text - Plain text body.
 * @param {string} [options.html] - (Optional) HTML body.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: html || text, // html body (defaults to text if not provided)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    // Re-throw the error so the calling function can handle it
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;

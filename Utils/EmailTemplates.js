const sendEmail = require('./Email');

/**
 * Sends an email verification OTP.
 * @param {string} to - Recipient's email address.
 * @param {string} otp - The 6-digit OTP code.
 */
const sendVerificationEmail = async (to, otp) => {
  const subject = 'Verify Your Email Address';
  
  // Use backticks (`) for multi-line strings
  const text = `
    Welcome to Your App Name!
    
    Your verification code is: ${otp}
    
    This code will expire in 10 minutes.
    
    If you did not sign up for this account, you can safely ignore this email.
  `;
  
  // You can also create a fancier HTML version
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to Your App Name!</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
      <p>This code will expire in 10 minutes.</p>
      <hr>
      <p style="font-size: 0.9em; color: #555;">If you did not sign up for this account, you can safely ignore this email.</p>
    </div>
  `;

  // 'sendEmail' is the generic function from utils/email.js
  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

/**
 * Sends a password reset OTP.
 * @param {string} to - Recipient's email address.
 * @param {string} otp - The 6-digit OTP code.
 */
const sendPasswordResetEmail = async (to, otp) => {
  const subject = 'Your Password Reset Request';
  
  const text = `
    Hello,
    
    We received a request to reset the password for your account.
    
    Your password reset OTP is: ${otp}
    
    This code will expire in 10 minutes.
    
    If you did not request a password reset, please ignore this email.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your account.</p>
      <p>Your password reset OTP is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
      <p>This code will expire in 10 minutes.</p>
      <hr>
      <p style="font-size: 0.9em; color: #555;">If you did not request a password reset, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

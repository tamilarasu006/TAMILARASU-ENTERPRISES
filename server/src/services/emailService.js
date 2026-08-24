const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  console.log(`[EMAIL] Preparing to send email to ${to}`);
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.error(`[EMAIL] Missing configuration: EMAIL_HOST or credentials missing`);
    const error = new Error('EMAIL_SERVICE_NOT_CONFIGURED');
    error.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Tamilarasu Enterprises" <noreply@tamilarasu.com>',
    to,
    subject,
    text,
  };

  try {
    console.log(`[EMAIL] Sending email via ${process.env.EMAIL_HOST}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Email successfully sent. MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Provider response error:`, err.message);
    if (err.code === 'EAUTH' || err.response?.includes('Authentication')) {
      const error = new Error('EMAIL_AUTHENTICATION_FAILED');
      error.code = 'EMAIL_AUTHENTICATION_FAILED';
      throw error;
    }
    const error = new Error('EMAIL_CONNECTION_FAILED');
    error.code = 'EMAIL_CONNECTION_FAILED';
    throw error;
  }
};

module.exports = {
  sendEmail,
};

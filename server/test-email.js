require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function test() {
  try {
    await transporter.verify();

    console.log("SMTP connection successful!");

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: "YOUR_TEST_EMAIL@gmail.com",
      subject: "TAMILARASU ENTERPRISES - Test OTP",

      text: `
Your TAMILARASU ENTERPRISES test OTP is 123456.

This is a test email.
      `
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", result.messageId);

  } catch (error) {
    console.error("EMAIL ERROR:");
    console.error(error);
  }
}

test();

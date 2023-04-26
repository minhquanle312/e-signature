const nodemailer = require('nodemailer')

const sendEmail = async (options, userRole) => {
  // * 1. Create a transporter
  const transportOptionsDemo = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  }

  const transportOptionsGmail = {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASSWORD,
    },
  }

  const transporter = nodemailer.createTransport(
    userRole === 'demo' ? transportOptionsDemo : transportOptionsGmail
  )

  // * 2. Define the email options
  const mailOptions = {
    from: 'Quick Chat App <quickchat.minhquanle@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || '<p>Do not reply this email</p>',
  }

  // * 3. Actually send the email
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail

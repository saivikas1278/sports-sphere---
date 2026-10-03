import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EMAIL] Credentials not set in .env. Skipping email sending.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `SportSphere <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending email: ', error);
    return false;
  }
};

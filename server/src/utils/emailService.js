import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EMAIL] Credentials not set in .env. Skipping email sending.');
    return false;
  }

  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `SportSphere <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.text || options.message,
    html: options.html || options.message
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

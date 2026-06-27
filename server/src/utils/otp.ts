import nodemailer from 'nodemailer';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOtpExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 1);
  return expiry;
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Al-Noor Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP - Al-Noor Collection Admin',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#0f0c29;color:#f5f0e8;padding:2rem;border-radius:12px;">
        <h2 style="color:#c9a84c;text-align:center;">✦ Al-Noor Collection ✦</h2>
        <p style="text-align:center;color:#b0a8c0;">Admin Registration OTP</p>
        <div style="text-align:center;margin:2rem 0;">
          <span style="font-size:2.5rem;font-weight:bold;letter-spacing:0.5rem;color:#c9a84c;">${otp}</span>
        </div>
        <p style="color:#8880a0;text-align:center;font-size:0.85rem;">
          This OTP is valid for <strong style="color:#e07070;">1 minute only</strong>.<br/>Do not share this with anyone.
        </p>
      </div>
    `,
  });
};

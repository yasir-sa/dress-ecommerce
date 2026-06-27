import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { signToken } from '../utils/jwt';
import { generateOtp, getOtpExpiry, sendOtpEmail } from '../utils/otp';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required.' });
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    if (existing.provider === 'GOOGLE') {
      res.status(409).json({
        message: 'This email is registered via Google Login. Please use Google to sign in.',
      });
    } else {
      res.status(409).json({ message: 'This email is already registered. Please login.' });
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = generateOtp();
  const otp_expires_at = getOtpExpiry();

  await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
      provider: 'MANUAL',
      otp,
      otp_expires_at,
      email_verified: false,
    },
  });

  await sendOtpEmail(email, otp);

  res.status(200).json({ message: 'OTP sent to your Gmail. Please verify within 1 minute.' });
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: 'Email and OTP are required.' });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    res.status(404).json({ message: 'Admin not found.' });
    return;
  }

  if (admin.email_verified) {
    res.status(400).json({ message: 'Email already verified. Please login.' });
    return;
  }

  if (!admin.otp || !admin.otp_expires_at) {
    res.status(400).json({ message: 'No OTP found. Please register again.' });
    return;
  }

  if (new Date() > admin.otp_expires_at) {
    await prisma.admin.delete({ where: { email } });
    res.status(410).json({
      message: 'OTP expired. Registration cancelled. Please register again.',
      expired: true,
    });
    return;
  }

  if (admin.otp !== otp) {
    res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    return;
  }

  const verified = await prisma.admin.update({
    where: { email },
    data: { email_verified: true, otp: null, otp_expires_at: null, last_login_at: new Date() },
  });

  const token = signToken(verified.id);
  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(200).json({ message: 'Email verified. Welcome!', admin: { id: verified.id, name: verified.name, email: verified.email } });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    res.status(404).json({ message: 'No account found with this email.' });
    return;
  }

  if (admin.provider === 'GOOGLE') {
    res.status(400).json({ message: 'This account uses Google Login. Please sign in with Google.' });
    return;
  }

  if (!admin.email_verified) {
    res.status(403).json({ message: 'Email not verified. Please check your Gmail for OTP.' });
    return;
  }

  if (!admin.is_active) {
    res.status(403).json({ message: 'Your account has been blocked. Contact super admin.' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, admin.password as string);

  if (!passwordMatch) {
    res.status(401).json({ message: 'Incorrect password.' });
    return;
  }

  await prisma.admin.update({ where: { email }, data: { last_login_at: new Date() } });

  const token = signToken(admin.id);
  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(200).json({ message: 'Login successful.', admin: { id: admin.id, name: admin.name, email: admin.email } });
};

// POST /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).admin;
  res.status(200).json({ admin: { id: admin.id, name: admin.name, email: admin.email, can_register_admin: admin.can_register_admin } });
};

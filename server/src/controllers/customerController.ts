import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import prisma from '../config/prisma';
import { signCustomerToken } from '../utils/jwt';
import { generateOtp, getOtpExpiry, sendCustomerOtpEmail } from '../utils/otp';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const isProd = process.env.NODE_ENV === 'production';
const CUSTOMER_COOKIE = 'customer_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /api/customer/register
export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required.' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.email_verified) {
      if (existing.provider === 'GOOGLE') {
        res.status(409).json({ message: 'This email is registered via Google. Please sign in with Google.' });
      } else {
        res.status(409).json({ message: 'Email already registered. Please login.' });
      }
      return;
    }
    // Not verified yet — resend OTP
    const otp = generateOtp();
    const otp_expires_at = getOtpExpiry();
    await prisma.user.update({
      where: { email },
      data: { name, password: await bcrypt.hash(password, 12), otp, otp_expires_at },
    });
    await sendCustomerOtpEmail(email, otp);
    res.status(200).json({ message: 'OTP resent to your email. Please verify within 1 minute.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = generateOtp();
  const otp_expires_at = getOtpExpiry();

  await prisma.user.create({
    data: { name, email, password: hashedPassword, provider: 'MANUAL', otp, otp_expires_at, email_verified: false },
  });

  await sendCustomerOtpEmail(email, otp);
  res.status(200).json({ message: 'OTP sent to your email. Please verify within 1 minute.' });
};

// POST /api/customer/verify-otp
export const verifyCustomerOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: 'Email and OTP are required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(404).json({ message: 'Account not found.' });
    return;
  }

  if (user.email_verified) {
    res.status(400).json({ message: 'Email already verified. Please login.' });
    return;
  }

  if (!user.otp || !user.otp_expires_at) {
    res.status(400).json({ message: 'No OTP found. Please register again.' });
    return;
  }

  if (new Date() > user.otp_expires_at) {
    await prisma.user.delete({ where: { email } });
    res.status(410).json({ message: 'OTP expired. Registration cancelled. Please register again.', expired: true });
    return;
  }

  if (user.otp !== otp) {
    res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    return;
  }

  const verified = await prisma.user.update({
    where: { email },
    data: { email_verified: true, otp: null, otp_expires_at: null, last_login_at: new Date() },
  });

  const token = signCustomerToken(verified.id);
  res.cookie(CUSTOMER_COOKIE, token, COOKIE_OPTIONS);

  res.status(200).json({
    message: 'Account verified. Welcome!',
    user: { id: verified.id, name: verified.name, email: verified.email, profile_image: verified.profile_image },
  });
};

// POST /api/customer/login
export const loginCustomer = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(404).json({ message: 'No account found with this email.' });
    return;
  }

  if (user.provider === 'GOOGLE' && !user.password) {
    res.status(400).json({ message: 'This account uses Google Login. Please sign in with Google.' });
    return;
  }

  if (!user.email_verified) {
    res.status(403).json({ message: 'Email not verified. Please check your email for OTP.' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ message: 'Your account has been blocked.' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password as string);
  if (!passwordMatch) {
    res.status(401).json({ message: 'Incorrect password.' });
    return;
  }

  await prisma.user.update({ where: { email }, data: { last_login_at: new Date() } });

  const token = signCustomerToken(user.id);
  res.cookie(CUSTOMER_COOKIE, token, COOKIE_OPTIONS);

  res.status(200).json({
    message: 'Login successful.',
    user: { id: user.id, name: user.name, email: user.email, profile_image: user.profile_image },
  });
};

// GET /api/customer/me
export const customerMe = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      provider: user.provider,
    },
  });
};

// POST /api/customer/logout
export const logoutCustomer = (_req: Request, res: Response): void => {
  res.clearCookie(CUSTOMER_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

// GET /api/customer/google/callback
export const customerGoogleCallback = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('google-customer', { session: false }, async (err: any, user: any, info: any) => {
    if (err) {
      res.redirect(`${FRONTEND_URL}/customer/login?error=server_error`);
      return;
    }
    if (!user) {
      const msg = info?.message || 'access_denied';
      res.redirect(`${FRONTEND_URL}/customer/login?error=${msg}`);
      return;
    }
    const token = signCustomerToken(user.id);
    res.cookie(CUSTOMER_COOKIE, token, COOKIE_OPTIONS);
    res.redirect(`${FRONTEND_URL}/customer/dashboard`);
  })(req, res, next);
};

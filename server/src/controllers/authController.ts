import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import prisma from '../config/prisma';
import { signToken, signCustomerToken } from '../utils/jwt';
import { generateOtp, getOtpExpiry, sendOtpEmail } from '../utils/otp';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Sets customer_token so admins can also access the customer dashboard
const setCustomerCookie = async (res: Response, email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const customerToken = signCustomerToken(user.id);
    res.cookie('customer_token', customerToken, COOKIE_OPTIONS);
  }
};

// POST /api/auth/register  (only allowed when no admins exist — first/MAIN admin)
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required.' });
    return;
  }

  // Block registration if any verified admin already exists
  const adminCount = await prisma.admin.count({ where: { email_verified: true } });
  if (adminCount > 0) {
    res.status(403).json({ message: 'Registration is closed. Contact the main admin to create an account.' });
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    if (existing.provider === 'GOOGLE') {
      res.status(409).json({ message: 'This email is registered via Google Login.' });
    } else {
      res.status(409).json({ message: 'This email is already registered. Please login.' });
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = generateOtp();
  const otp_expires_at = getOtpExpiry();

  // First admin → MAIN role + full permissions
  await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
      provider: 'MANUAL',
      otp,
      otp_expires_at,
      email_verified: false,
      role: 'MAIN',
      can_register_admin: true,
      can_access_admin_panel: true,
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

  // Sync to users table
  await prisma.user.upsert({
    where: { email },
    update: { name: verified.name, email_verified: true },
    create: {
      name: verified.name,
      email: verified.email,
      password: verified.password,
      provider: verified.provider,
      profile_image: verified.profile_image,
      email_verified: true,
    },
  });

  const token = signToken(verified.id);
  res.cookie('token', token, COOKIE_OPTIONS);
  await setCustomerCookie(res, verified.email);

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

  if (admin.provider === 'GOOGLE' && !admin.password) {
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
  await setCustomerCookie(res, admin.email);

  res.status(200).json({ message: 'Login successful.', admin: { id: admin.id, name: admin.name, email: admin.email } });
};

// POST /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  const cookieOpts = { httpOnly: true, secure: isProd, sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict' };
  res.clearCookie('token', cookieOpts);
  res.clearCookie('customer_token', cookieOpts);
  res.status(200).json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
export const me = async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).admin;
  res.status(200).json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      profile_image: admin.profile_image,
      can_register_admin: admin.can_register_admin,
      provider: admin.provider,
      role: admin.role,
      has_password: !!admin.password,
    },
  });
};

// POST /api/auth/set-password
export const setPassword = async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).admin;
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters.' });
    return;
  }

  if (admin.provider !== 'GOOGLE') {
    res.status(403).json({ message: 'Only Google-registered admins can set a password here.' });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.admin.update({ where: { id: admin.id }, data: { password: hashed } });

  res.status(200).json({ message: 'Password set successfully.' });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    res.status(404).json({ message: 'No account found with this email.' });
    return;
  }

  if (!admin.email_verified) {
    res.status(403).json({ message: 'Email not verified. Please complete registration first.' });
    return;
  }

  const otp = generateOtp();
  const otp_expires_at = getOtpExpiry();

  await prisma.admin.update({ where: { email }, data: { otp, otp_expires_at } });
  await sendOtpEmail(email, otp);

  res.status(200).json({ message: 'OTP sent to your Gmail. Valid for 1 minute.' });
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    res.status(400).json({ message: 'All fields are required.' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ message: 'Passwords do not match.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters.' });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !admin.otp || !admin.otp_expires_at) {
    res.status(400).json({ message: 'Invalid request. Please request OTP again.' });
    return;
  }

  if (new Date() > admin.otp_expires_at) {
    await prisma.admin.update({ where: { email }, data: { otp: null, otp_expires_at: null } });
    res.status(410).json({ message: 'OTP expired. Please request a new OTP.', expired: true });
    return;
  }

  if (admin.otp !== otp) {
    res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({
    where: { email },
    data: { password: hashed, otp: null, otp_expires_at: null },
  });

  res.status(200).json({ message: 'Password reset successfully. Please login.' });
};

// GET /api/auth/admins  (main admin only)
export const listAdmins = async (req: Request, res: Response): Promise<void> => {
  const requester = (req as any).admin;

  if (requester.role !== 'MAIN') {
    res.status(403).json({ message: 'Permission denied.' });
    return;
  }

  const admins = await prisma.admin.findMany({
    where: { id: { not: requester.id } },
    select: {
      id: true,
      name: true,
      email: true,
      provider: true,
      role: true,
      can_access_admin_panel: true,
      can_register_admin: true,
      is_active: true,
      email_verified: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
  });

  res.status(200).json({ admins });
};

// PATCH /api/auth/admin/:id/toggle-access  (MAIN only)
export const toggleAdminAccess = async (req: Request, res: Response): Promise<void> => {
  const requester = (req as any).admin;

  if (requester.role !== 'MAIN') {
    res.status(403).json({ message: 'Permission denied.' });
    return;
  }

  const id = String(req.params.id);
  const { can_access_admin_panel } = req.body;

  if (typeof can_access_admin_panel !== 'boolean') {
    res.status(400).json({ message: 'Invalid value.' });
    return;
  }

  // Block changing MAIN admin access
  const target = await prisma.admin.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!target) { res.status(404).json({ message: 'Admin not found.' }); return; }
  if (target.role === 'MAIN') {
    res.status(403).json({ message: 'Main admin access cannot be changed.' });
    return;
  }

  const updated = await prisma.admin.update({
    where: { id },
    data: { can_access_admin_panel },
    select: { id: true, name: true, can_access_admin_panel: true },
  });

  res.status(200).json({
    message: `Dashboard access ${can_access_admin_panel ? 'granted' : 'revoked'} for ${updated.name}.`,
    admin: updated,
  });
};

// POST /api/auth/create-admin  (MAIN or admin with can_register_admin)
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  const creator = (req as any).admin;

  if (creator.role !== 'MAIN' && !creator.can_register_admin) {
    res.status(403).json({ message: 'You do not have permission to create admins.' });
    return;
  }

  // Only MAIN can set permissions — delegated admins always use defaults
  const isMain = creator.role === 'MAIN';
  const { name, email, password, can_access_admin_panel = true } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required.' });
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'An admin with this email already exists.' });
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
      role: 'ADMIN',
      otp,
      otp_expires_at,
      email_verified: false,
      can_register_admin: false,
      can_access_admin_panel: isMain ? can_access_admin_panel : true,
    },
  });

  await sendOtpEmail(email, otp);

  res.status(200).json({ message: 'OTP sent to new admin email. Please verify.' });
};

// POST /api/auth/verify-new-admin  (MAIN or admin with can_register_admin)
export const verifyNewAdmin = async (req: Request, res: Response): Promise<void> => {
  const creator = (req as any).admin;

  if (creator.role !== 'MAIN' && !creator.can_register_admin) {
    res.status(403).json({ message: 'You do not have permission to verify admins.' });
    return;
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: 'Email and OTP are required.' });
    return;
  }

  const newAdmin = await prisma.admin.findUnique({ where: { email } });

  if (!newAdmin || !newAdmin.otp || !newAdmin.otp_expires_at) {
    res.status(400).json({ message: 'Admin not found or OTP missing.' });
    return;
  }

  if (new Date() > newAdmin.otp_expires_at) {
    await prisma.admin.delete({ where: { email } });
    res.status(410).json({ message: 'OTP expired. Admin creation cancelled. Try again.', expired: true });
    return;
  }

  if (newAdmin.otp !== otp) {
    res.status(400).json({ message: 'Invalid OTP.' });
    return;
  }

  const verified = await prisma.admin.update({
    where: { email },
    data: { email_verified: true, otp: null, otp_expires_at: null },
  });

  // Sync to users table
  await prisma.user.upsert({
    where: { email },
    update: { name: verified.name, email_verified: true },
    create: {
      name: verified.name,
      email: verified.email,
      password: verified.password,
      provider: verified.provider,
      profile_image: verified.profile_image,
      email_verified: true,
    },
  });

  res.status(200).json({
    message: `Admin "${verified.name}" created successfully!`,
    admin: { name: verified.name, email: verified.email },
  });
};

// PATCH /api/auth/admin/:id/toggle-register  (MAIN only)
export const toggleRegisterPermission = async (req: Request, res: Response): Promise<void> => {
  const requester = (req as any).admin;

  if (requester.role !== 'MAIN') {
    res.status(403).json({ message: 'Permission denied.' });
    return;
  }

  const id = String(req.params.id);
  const { can_register_admin } = req.body;

  if (typeof can_register_admin !== 'boolean') {
    res.status(400).json({ message: 'Invalid value.' });
    return;
  }

  const target = await prisma.admin.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!target) { res.status(404).json({ message: 'Admin not found.' }); return; }
  if (target.role === 'MAIN') {
    res.status(403).json({ message: 'Main admin permissions cannot be changed.' });
    return;
  }

  const updated = await prisma.admin.update({
    where: { id },
    data: { can_register_admin },
    select: { id: true, name: true, can_register_admin: true },
  });

  res.status(200).json({
    message: `Register permission ${can_register_admin ? 'granted' : 'revoked'} for ${updated.name}.`,
    admin: updated,
  });
};

// DELETE /api/auth/admin/:id  (MAIN only)
export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  const requester = (req as any).admin;

  if (requester.role !== 'MAIN') {
    res.status(403).json({ message: 'Permission denied.' });
    return;
  }

  const id = String(req.params.id);

  const target = await prisma.admin.findUnique({ where: { id }, select: { role: true, name: true } });
  if (!target) { res.status(404).json({ message: 'Admin not found.' }); return; }
  if (target.role === 'MAIN') {
    res.status(403).json({ message: 'Main admin cannot be deleted.' });
    return;
  }

  await prisma.admin.delete({ where: { id } });

  res.status(200).json({ message: `Admin "${target.name}" deleted successfully.` });
};

// GET /api/auth/google/callback
export const googleCallback = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('google', { session: false }, async (err: any, admin: any, info: any) => {
    if (err) {
      res.redirect(`${FRONTEND_URL}/login?error=server_error`);
      return;
    }
    if (!admin) {
      const msg = info?.message || 'access_denied';
      res.redirect(`${FRONTEND_URL}/login?error=${msg}`);
      return;
    }
    const token = signToken(admin.id);
    res.cookie('token', token, COOKIE_OPTIONS);
    await setCustomerCookie(res, admin.email);
    res.redirect(`${FRONTEND_URL}/admin`);
  })(req, res, next);
};

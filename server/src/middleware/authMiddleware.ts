import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/prisma';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: 'Not authorized. Please login.' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });

    if (!admin || !admin.is_active) {
      res.status(401).json({ message: 'Account not found or blocked.' });
      return;
    }

    if (!admin.can_access_admin_panel) {
      res.status(403).json({ message: 'Dashboard access has been revoked. Contact super admin.' });
      return;
    }

    (req as any).admin = admin;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};

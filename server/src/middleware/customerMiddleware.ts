import { Request, Response, NextFunction } from 'express';
import { verifyCustomerToken } from '../utils/jwt';
import prisma from '../config/prisma';

export const customerProtect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.customer_token;

  if (!token) {
    res.status(401).json({ message: 'Not authorized. Please login.' });
    return;
  }

  try {
    const decoded = verifyCustomerToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.is_active) {
      res.status(401).json({ message: 'Account not found or blocked.' });
      return;
    }

    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};

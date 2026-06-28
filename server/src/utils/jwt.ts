import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET as string;
const EXPIRY = '7d';

export const signToken = (adminId: string): string => {
  return jwt.sign({ adminId }, SECRET, { expiresIn: EXPIRY });
};

export const verifyToken = (token: string): { adminId: string } => {
  return jwt.verify(token, SECRET) as { adminId: string };
};

export const signCustomerToken = (userId: string): string => {
  return jwt.sign({ userId }, SECRET, { expiresIn: EXPIRY });
};

export const verifyCustomerToken = (token: string): { userId: string } => {
  return jwt.verify(token, SECRET) as { userId: string };
};

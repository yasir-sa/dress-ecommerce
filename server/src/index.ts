import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './config/passport';
import './config/customerPassport';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ message: 'Backend Running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

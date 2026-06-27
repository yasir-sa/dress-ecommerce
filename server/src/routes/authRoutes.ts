import { Router } from 'express';
import { register, verifyOtp, login, logout, me } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;

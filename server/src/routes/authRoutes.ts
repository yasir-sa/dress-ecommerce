import { Router } from 'express';
import { register, verifyOtp, login, logout, me, setPassword, forgotPassword, resetPassword, createAdmin, verifyNewAdmin, listAdmins, toggleAdminAccess, toggleRegisterPermission, deleteAdmin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/set-password', protect, setPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/create-admin', protect, createAdmin);
router.post('/verify-new-admin', protect, verifyNewAdmin);
router.get('/admins', protect, listAdmins);
router.patch('/admin/:id/toggle-access', protect, toggleAdminAccess);
router.patch('/admin/:id/toggle-register', protect, toggleRegisterPermission);
router.delete('/admin/:id', protect, deleteAdmin);

export default router;

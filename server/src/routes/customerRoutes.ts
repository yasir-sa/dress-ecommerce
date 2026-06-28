import { Router } from 'express';
import passport from 'passport';
import { registerCustomer, verifyCustomerOtp, loginCustomer, customerMe, logoutCustomer, customerGoogleCallback } from '../controllers/customerController';
import { customerProtect } from '../middleware/customerMiddleware';

const router = Router();

router.post('/register', registerCustomer);
router.post('/verify-otp', verifyCustomerOtp);
router.post('/login', loginCustomer);
router.get('/me', customerProtect, customerMe);
router.post('/logout', customerProtect, logoutCustomer);

router.get('/google', passport.authenticate('google-customer', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', customerGoogleCallback);

export default router;

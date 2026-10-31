import express from 'express';
import { body } from 'express-validator';
import fileUpload from 'express-fileupload';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleAuthCallback,
  verifyEmail
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .isIn(['player', 'organizer', 'fan'])
    .withMessage('Role must be player, organizer, or fan')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

import passport, { isGoogleConfigured } from '../config/passport.js';

// Google OAuth routes
router.get('/google/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      enabled: isGoogleConfigured()
    }
  });
});

router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured on this server.'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_not_configured`);
  }
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
  })(req, res, next);
}, googleAuthCallback);

import os from 'os';

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true
}), uploadAvatar);
router.put('/change-password', protect, changePasswordValidation, changePassword);

export default router;

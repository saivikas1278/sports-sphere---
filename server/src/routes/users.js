import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  getUserStats,
  getUserMatches,
  getUserTournaments,
  searchUsers,
  updateUserTeamStatus,
  getDashboardStats,
  getRecentActivities,
  getNotifications
} from '../controllers/users.js';
import { protect, authorize, optional } from '../middleware/auth.js';

const router = express.Router();

// User profile validation
const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please enter a valid phone number'),
  body('role')
    .optional()
    .isIn(['player', 'organizer', 'admin'])
    .withMessage('Invalid role selection')
];

// Public routes
router.get('/', optional, getUsers);
router.get('/search', searchUsers);

// Protected dashboard routes (must come before :id routes)
router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/dashboard/activities', protect, getRecentActivities);
router.get('/notifications', protect, getNotifications);

// Public user routes with ID
router.get('/:id', optional, getUser);
router.get('/:id/stats', getUserStats);
router.get('/:id/matches', getUserMatches);
router.get('/:id/tournaments', getUserTournaments);

// Protected routes
router.put('/:id', protect, updateUserValidation, updateUser);
router.put('/:id/team-status', protect, updateUserTeamStatus);
router.delete('/:id', protect, deleteUser);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/unfollow', protect, unfollowUser);

export default router;

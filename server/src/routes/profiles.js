import express from 'express';
import {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getLeaderboard,
  addAchievement,
  updateStatistics,
  getProfileStats
} from '../controllers/profiles.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/:userId', optionalAuth, getProfile);
router.get('/:userId/stats', optionalAuth, getProfileStats);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Protected routes
router.use(protect);

router.put('/', updateProfile);
router.post('/:userId/follow', followUser);
router.delete('/:userId/follow', unfollowUser);
router.post('/achievements', addAchievement);
router.put('/statistics', updateStatistics);

export default router;

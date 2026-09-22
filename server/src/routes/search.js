import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/search/users
// @desc    Search users by name or email
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    }).select('firstName lastName avatar email');

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;

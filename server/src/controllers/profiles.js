import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createFollowNotification } from '../utils/notificationUtils.js';

// @desc    Get user profile
// @route   GET /api/profiles/:userId
// @access  Public
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findByUser(req.params.userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Check if current user is following this profile
    const isFollowing = req.user ? 
      profile.followers.some(f => f.user.toString() === req.user.id) : false;

    const profileData = {
      ...profile.toObject(),
      isFollowing
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profiles
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const {
      bio,
      dateOfBirth,
      phone,
      address,
      socialLinks,
      preferences
    } = req.body;

    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      profile = new Profile({ user: req.user.id });
    }

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (socialLinks) updates.socialLinks = { ...profile.socialLinks, ...socialLinks };
    if (preferences) updates.preferences = { ...profile.preferences, ...preferences };

    Object.assign(profile, updates);
    await profile.save();

    await profile.populate('user', 'firstName lastName email avatar');

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Follow user
// @route   POST /api/profiles/:userId/follow
// @access  Private
export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    // Get target user's profile
    let targetProfile = await Profile.findOne({ user: targetUserId });
    if (!targetProfile) {
      targetProfile = new Profile({ user: targetUserId });
      await targetProfile.save();
    }

    // Get current user's profile
    let currentProfile = await Profile.findOne({ user: currentUserId });
    if (!currentProfile) {
      currentProfile = new Profile({ user: currentUserId });
      await currentProfile.save();
    }

    // Check if already following
    const isAlreadyFollowing = targetProfile.followers.some(
      f => f.user.toString() === currentUserId
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Add to target user's followers
    targetProfile.followers.push({ user: currentUserId });
    targetProfile.statistics.totalFollowers += 1;

    // Add to current user's following
    currentProfile.following.push({ user: targetUserId });
    currentProfile.statistics.totalFollowing += 1;

    await Promise.all([targetProfile.save(), currentProfile.save()]);

    // Create notification
    const io = req.app.get('io');
    try {
      await createFollowNotification(targetUserId, currentUserId, io);
    } catch (notificationError) {
      console.error('Failed to create follow notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'User followed successfully',
      data: {
        isFollowing: true,
        followersCount: targetProfile.statistics.totalFollowers
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user'
    });
  }
};

// @desc    Unfollow user
// @route   DELETE /api/profiles/:userId/follow
// @access  Private
export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    // Get profiles
    const targetProfile = await Profile.findOne({ user: targetUserId });
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!targetProfile || !currentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Check if following
    const isFollowing = targetProfile.followers.some(
      f => f.user.toString() === currentUserId
    );

    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Not following this user'
      });
    }

    // Remove from target user's followers
    targetProfile.followers = targetProfile.followers.filter(
      f => f.user.toString() !== currentUserId
    );
    targetProfile.statistics.totalFollowers -= 1;

    // Remove from current user's following
    currentProfile.following = currentProfile.following.filter(
      f => f.user.toString() !== targetUserId
    );
    currentProfile.statistics.totalFollowing -= 1;

    await Promise.all([targetProfile.save(), currentProfile.save()]);

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        isFollowing: false,
        followersCount: targetProfile.statistics.totalFollowers
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow user'
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/profiles/:userId/followers
// @access  Public
export const getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const profile = await Profile.findOne({ user: req.params.userId })
      .populate({
        path: 'followers.user',
        select: 'firstName lastName avatar isVerified',
        options: {
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const total = profile.followers.length;

    res.json({
      success: true,
      data: {
        followers: profile.followers,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers'
    });
  }
};

// @desc    Get user's following
// @route   GET /api/profiles/:userId/following
// @access  Public
export const getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const profile = await Profile.findOne({ user: req.params.userId })
      .populate({
        path: 'following.user',
        select: 'firstName lastName avatar isVerified',
        options: {
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const total = profile.following.length;

    res.json({
      success: true,
      data: {
        following: profile.following,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch following'
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/profiles/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
  try {
    const { sport, limit = 50 } = req.query;

    const profiles = await Profile.getLeaderboard(sport)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
};

// @desc    Add achievement
// @route   POST /api/profiles/achievements
// @access  Private
export const addAchievement = async (req, res) => {
  try {
    const { title, description, category, points = 10, icon } = req.body;

    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Profile({ user: req.user.id });
    }

    const achievement = {
      title,
      description,
      category,
      points,
      icon,
      earnedAt: new Date()
    };

    await profile.addAchievement(achievement);

    res.json({
      success: true,
      data: achievement,
      message: 'Achievement unlocked!'
    });
  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add achievement'
    });
  }
};

// @desc    Update user statistics
// @route   PUT /api/profiles/statistics
// @access  Private
export const updateStatistics = async (req, res) => {
  try {
    const updates = req.body;

    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Profile({ user: req.user.id });
    }

    await profile.updateStatistics(updates);

    res.json({
      success: true,
      data: profile.statistics
    });
  } catch (error) {
    console.error('Update statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update statistics'
    });
  }
};

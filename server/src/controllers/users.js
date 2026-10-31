import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import FitnessContent from '../models/FitnessContent.js';
import { canModify } from '../middleware/authorization.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filters
    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.sport) {
      query['sports.name'] = req.query.sport;
    }

    if (req.query.location) {
      query.$or = [
        { 'location.city': { $regex: req.query.location, $options: 'i' } },
        { 'location.state': { $regex: req.query.location, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -googleId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    const total = await User.countDocuments(query);

    // Pagination result
    const pagination = {};

    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -googleId')
      .populate('following', 'firstName lastName avatar')
      .populate('followers', 'firstName lastName avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check privacy settings
    if (user.preferences.privacy.profileVisibility === 'private' && 
        (!req.user || req.user.id !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Profile is private'
      });
    }

    // Hide stats if user preference is set and viewer is not the user
    if (!user.preferences.privacy.showStats && 
        (!req.user || req.user.id !== user._id.toString())) {
      user.stats = undefined;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check authorization: Owner or Admin
    if (!canModify(targetUser, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile'
      });
    }

    // Role modification checks
    if (req.body.role !== undefined && req.body.role !== targetUser.role) {
      // Normal users cannot change roles
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators can change user roles'
        });
      }

      // Prevent an admin from demoting themselves if they are the last admin
      if (targetUser.role === 'admin' && req.body.role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            error: 'Cannot demote the last remaining administrator'
          });
        }
      }
    }

    const fieldsToUpdate = {};
    const allowedFields = [
      'firstName', 'lastName', 'bio', 'sports', 'location', 
      'dateOfBirth', 'phoneNumber', 'preferences', 'avatar'
    ];

    if (req.user.role === 'admin') {
      allowedFields.push('role', 'isVerified', 'isActive');
    }

    // Only update allowed fields that are provided
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password -googleId');

    // Log admin action to AuditLog
    if (req.user.role === 'admin') {
      const what = req.body.role && req.body.role !== targetUser.role
        ? `Changed role for user ${targetUser.email || targetUser._id} to ${req.body.role}`
        : `Updated user ${targetUser.email || targetUser._id}`;

      await logAudit({
        who: req.user._id || req.user.id,
        what,
        target: {
          model: 'User',
          id: targetUser._id
        },
        details: fieldsToUpdate
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check authorization: Owner or Admin
    if (!canModify(user, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this profile'
      });
    }

    // Prevent deleting the last remaining admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last remaining administrator'
        });
      }
    }

    if (req.user.role === 'admin') {
      await logAudit({
        who: req.user._id || req.user.id,
        what: `Deleted user ${user.email || user._id}`,
        target: {
          model: 'User',
          id: user._id
        }
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Can't follow yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself'
      });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user'
      });
    }

    // Add to following/followers
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/:id/unfollow
// @access  Private
export const unfollowUser = async (req, res, next) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if not following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({
        success: false,
        error: 'Not following this user'
      });
    }

    // Remove from following/followers
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
export const getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('stats preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if stats are public
    if (!user.preferences.privacy.showStats && 
        (!req.user || req.user.id !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        error: 'User statistics are private'
      });
    }

    // Get additional stats
    const teams = await Team.find({ 'players.user': user._id });
    const captainTeams = await Team.find({ captain: user._id });

    const stats = {
      ...user.stats.toObject(),
      teamsPlayed: teams.length,
      teamsCaptained: captainTeams.length,
      winRate: user.stats.matchesPlayed > 0 ? 
        ((user.stats.matchesWon / user.stats.matchesPlayed) * 100).toFixed(2) : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user matches
// @route   GET /api/users/:id/matches
// @access  Public
export const getUserMatches = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find teams where user is a player
    const teams = await Team.find({ 'players.user': user._id });
    const teamIds = teams.map(team => team._id);

    // Find matches for these teams
    const matches = await Match.find({
      $or: [
        { homeTeam: { $in: teamIds } },
        { awayTeam: { $in: teamIds } }
      ]
    })
      .populate('tournament', 'name sport')
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .sort({ scheduledTime: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user tournaments
// @route   GET /api/users/:id/tournaments
// @access  Public
export const getUserTournaments = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find tournaments organized by user
    const organizedTournaments = await Tournament.find({ organizer: user._id })
      .populate('registeredTeams.team', 'name logo')
      .sort({ createdAt: -1 });

    // Find tournaments user participated in
    const teams = await Team.find({ 'players.user': user._id }).populate('tournament');
    const participatedTournaments = teams.map(team => team.tournament).filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        organized: organizedTournaments,
        participated: participatedTournaments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req, res, next) => {
  try {
    const { q, role, sport, location } = req.query;

    let query = {};

    // Text search
    if (q) {
      query.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Sport filter
    if (sport) {
      query['sports.name'] = sport;
    }

    // Location filter
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('firstName lastName avatar role sports location')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user team status
// @route   PUT /api/users/:id/team-status
// @access  Private
export const updateUserTeamStatus = async (req, res, next) => {
  try {
    const { teamId, status } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user can update team status (either their own profile or admin)
    if (!canModify(user, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this user'
      });
    }

    // Update user's current team if status is active
    if (status === 'active') {
      user.currentTeam = teamId;
    } else if (status === 'inactive' && user.currentTeam?.toString() === teamId) {
      user.currentTeam = null;
    }

    // Add or update team in user's teams array
    const existingTeamIndex = user.teams?.findIndex(team => 
      team.team?.toString() === teamId
    );

    if (existingTeamIndex >= 0) {
      user.teams[existingTeamIndex].status = status;
      user.teams[existingTeamIndex].joinedAt = new Date();
    } else {
      if (!user.teams) user.teams = [];
      user.teams.push({
        team: teamId,
        status: status,
        joinedAt: new Date()
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats for authenticated user
// @route   GET /api/users/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log('📊 Dashboard stats requested for user:', userId);

    // Get user with stats
    const user = await User.findById(userId).select('stats');
    console.log('👤 User found:', user ? 'YES' : 'NO');
    
    // Get teams count - teams where user is a player or captain
    const teamsCount = await Team.countDocuments({ 
      $or: [
        { 'players.user': userId },
        { captain: userId }
      ]
    });
    console.log('👥 Teams count:', teamsCount);

    // Get tournaments count - find teams user is part of, then get unique tournaments
    const userTeams = await Team.find({
      $or: [
        { 'players.user': userId },
        { captain: userId }
      ]
    }).distinct('tournament');
    console.log('🏆 User teams tournaments:', userTeams.length);

    // Also get tournaments organized by user
    const organizedTournaments = await Tournament.countDocuments({
      organizer: userId
    });
    console.log('🏆 Organized tournaments:', organizedTournaments);

    const tournamentsCount = userTeams.length + organizedTournaments;

    // Get videos watched count (from fitness service)
    let videosWatched = 0;
    let completedWorkouts = 0;

    try {
      videosWatched = await FitnessContent.countDocuments({
        'userProgress.user': userId,
        type: 'video',
        'userProgress.completedAt': { $exists: true }
      });

      completedWorkouts = await FitnessContent.countDocuments({
        'userProgress.user': userId,
        type: { $in: ['workout-plan', 'challenge'] },
        'userProgress.completedAt': { $exists: true }
      });
    } catch (fitnessError) {
      console.log('Fitness data not available yet:', fitnessError.message);
      // Default to 0 if fitness collection doesn't exist or has issues
    }

    console.log('💪 Videos watched:', videosWatched);
    console.log('💪 Completed workouts:', completedWorkouts);

    const stats = {
      tournaments: tournamentsCount,
      teams: teamsCount,
      watchedVideos: videosWatched,
      completedWorkouts: completedWorkouts,
      userStats: user?.stats || {}
    };

    console.log('📈 Final dashboard stats:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    next(error);
  }
};

// @desc    Get recent activities for dashboard
// @route   GET /api/users/dashboard/activities
// @access  Private
export const getRecentActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const activities = [];

    // Get user's teams first
    const userTeams = await Team.find({
      $or: [
        { 'players.user': userId },
        { captain: userId }
      ]
    }).select('_id');

    const teamIds = userTeams.map(team => team._id);

    // Get recent matches involving user's teams
    const recentMatches = await Match.find({
      $or: [
        { homeTeam: { $in: teamIds } },
        { awayTeam: { $in: teamIds } },
        { createdBy: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('homeTeam', 'name')
    .populate('awayTeam', 'name')
    .select('title status sport createdAt homeTeam awayTeam');

    recentMatches.forEach(match => {
      activities.push({
        id: match._id,
        type: 'match',
        title: `Match: ${match.title || `${match.homeTeam?.name} vs ${match.awayTeam?.name}`}`,
        description: `${match.sport} match`,
        status: match.status,
        date: match.createdAt,
        icon: 'FaBaseballBall'
      });
    });

    // Get recent tournaments involving user
    const recentTournaments = await Tournament.find({
      $or: [
        { organizer: userId },
        { registeredTeams: { $in: teamIds } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .select('name status sport dates.tournamentStart');

    recentTournaments.forEach(tournament => {
      activities.push({
        id: tournament._id,
        type: 'tournament',
        title: `Tournament: ${tournament.name}`,
        description: `${tournament.sport} tournament`,
        status: tournament.status,
        date: tournament.dates?.tournamentStart || tournament.createdAt,
        icon: 'FaTrophy'
      });
    });

    // Get recent team activities
    const recentTeams = await Team.find({
      $or: [
        { captain: userId },
        { 'players.user': userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .select('name sport createdAt registrationDetails.registrationStatus');

    recentTeams.forEach(team => {
      activities.push({
        id: team._id,
        type: 'team',
        title: `Team: ${team.name}`,
        description: `${team.sport} team`,
        status: team.registrationDetails?.registrationStatus || 'active',
        date: team.createdAt,
        icon: 'FaUsers'
      });
    });

    // Sort activities by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: activities.slice(0, 5) // Return top 5 activities
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    next(error);
  }
};

// @desc    Get notifications for user
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = [];

    // Get user's teams
    const userTeams = await Team.find({
      $or: [
        { 'players.user': userId },
        { captain: userId }
      ]
    }).select('_id tournament');

    const teamIds = userTeams.map(team => team._id);
    const tournamentIds = userTeams.map(team => team.tournament).filter(Boolean);

    // Get upcoming tournaments
    const upcomingTournaments = await Tournament.find({
      $or: [
        { organizer: userId },
        { _id: { $in: tournamentIds } },
        { registeredTeams: { $in: teamIds } }
      ],
      'dates.tournamentStart': { $gte: new Date() },
      status: { $in: ['open', 'ongoing'] }
    })
    .sort({ 'dates.tournamentStart': 1 })
    .limit(3)
    .select('name dates.tournamentStart sport');

    upcomingTournaments.forEach(tournament => {
      const daysUntil = Math.ceil((new Date(tournament.dates.tournamentStart) - new Date()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: tournament._id,
        type: 'tournament',
        text: `Tournament "${tournament.name}" starts in ${daysUntil} days`,
        time: tournament.dates.tournamentStart,
        priority: daysUntil <= 3 ? 'high' : 'normal'
      });
    });

    // Get upcoming matches
    const upcomingMatches = await Match.find({
      $or: [
        { homeTeam: { $in: teamIds } },
        { awayTeam: { $in: teamIds } }
      ],
      scheduledTime: { $gte: new Date() },
      status: 'scheduled'
    })
    .sort({ scheduledTime: 1 })
    .limit(3)
    .populate('homeTeam', 'name')
    .populate('awayTeam', 'name')
    .select('title scheduledTime homeTeam awayTeam');

    upcomingMatches.forEach(match => {
      const hoursUntil = Math.ceil((new Date(match.scheduledTime) - new Date()) / (1000 * 60 * 60));
      notifications.push({
        id: match._id,
        type: 'match',
        text: `Match "${match.homeTeam?.name} vs ${match.awayTeam?.name}" in ${hoursUntil} hours`,
        time: match.scheduledTime,
        priority: hoursUntil <= 24 ? 'high' : 'normal'
      });
    });

    // Sort by priority and time
    notifications.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return new Date(a.time) - new Date(b.time);
    });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Notifications error:', error);
    next(error);
  }
};

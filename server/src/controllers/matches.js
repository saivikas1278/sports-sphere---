import { validationResult } from 'express-validator';
import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Scorecard from '../models/Scorecard.js';
import User from '../models/User.js';
import { emitScoreUpdate, emitMatchEvent } from '../utils/socketHandlers.js';

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
export const getMatches = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filters
    if (req.query.tournament) {
      query.tournament = req.query.tournament;
    }

    if (req.query.team) {
      query.$or = [
        { homeTeam: req.query.team },
        { awayTeam: req.query.team }
      ];
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.scheduledTime = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const matches = await Match.find(query)
      .populate('tournament', 'name sport logo')
      .populate('homeTeam', 'name logo shortName')
      .populate('awayTeam', 'name logo shortName')
      .populate('referee.main', 'firstName lastName')
      .sort({ scheduledTime: 1 })
      .limit(limit * 1)
      .skip(startIndex);

    const total = await Match.countDocuments(query);

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
      count: matches.length,
      total,
      pagination,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single match
// @route   GET /api/matches/:id
// @access  Public
export const getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament', 'name sport logo')
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('referee.main', 'firstName lastName avatar')
      .populate('referee.assistants', 'firstName lastName avatar')
      .populate('events.player', 'firstName lastName avatar')
      .populate('playerStats.player', 'firstName lastName avatar');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new match
// @route   POST /api/matches
// @access  Private (Organizer only)
export const createMatch = async (req, res, next) => {
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

    // Verify tournament exists and user is organizer
    const tournament = await Tournament.findById(req.body.tournament);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to create matches for this tournament'
      });
    }

    // Verify teams exist and are registered for tournament
    const homeTeam = await Team.findById(req.body.homeTeam);
    const awayTeam = await Team.findById(req.body.awayTeam);

    if (!homeTeam || !awayTeam) {
      return res.status(404).json({
        success: false,
        error: 'One or both teams not found'
      });
    }

    if (!tournament.registeredTeams.includes(homeTeam._id) || 
        !tournament.registeredTeams.includes(awayTeam._id)) {
      return res.status(400).json({
        success: false,
        error: 'Teams must be registered for the tournament'
      });
    }

    const match = await Match.create(req.body);

    // Add match to tournament
    tournament.matches.push(match._id);
    await tournament.save();

    res.status(201).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match
// @route   PUT /api/matches/:id
// @access  Private (Organizer only)
export const updateMatch = async (req, res, next) => {
  try {
    let match = await Match.findById(req.params.id).populate('tournament');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Make sure user is tournament organizer
    if (match.tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this match'
      });
    }

    // Don't allow certain updates after match starts
    if (match.status === 'live' || match.status === 'completed') {
      const restrictedFields = ['homeTeam', 'awayTeam', 'scheduledTime'];
      const hasRestrictedField = restrictedFields.some(field => req.body[field]);
      
      if (hasRestrictedField) {
        return res.status(400).json({
          success: false,
          error: 'Cannot modify match details after it starts'
        });
      }
    }

    match = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private (Organizer only)
export const deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('tournament');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Make sure user is tournament organizer
    if (match.tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this match'
      });
    }

    // Don't allow deletion of completed matches
    if (match.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete completed matches'
      });
    }

    await match.deleteOne();

    // Remove match from tournament
    const tournament = await Tournament.findById(match.tournament._id);
    tournament.matches = tournament.matches.filter(
      matchId => matchId.toString() !== match._id.toString()
    );
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match score
// @route   PUT /api/matches/:id/score
// @access  Private (Organizer/Team members)
export const updateMatchScore = async (req, res, next) => {
  try {
    const { homeScore, awayScore, events, notes, weather, venue } = req.body;

    const match = await Match.findById(req.params.id)
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization - tournament organizer or team members
    const isOrganizer = match.tournament.organizer.toString() === req.user.id;
    const isTeamMember = match.homeTeam.players.some(p => p.user?.toString() === req.user.id) ||
                        match.awayTeam.players.some(p => p.user?.toString() === req.user.id);

    if (!isOrganizer && !isTeamMember) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this match'
      });
    }

    // Find or create scorecard
    let scorecard = await Scorecard.findOne({ match: match._id });
    if (!scorecard) {
      scorecard = new Scorecard({
        match: match._id,
        homeTeam: match.homeTeam._id,
        awayTeam: match.awayTeam._id,
        sport: match.sport || match.tournament.sport
      });
    }

    // Update scorecard
    if (homeScore !== undefined) scorecard.homeScore = homeScore;
    if (awayScore !== undefined) scorecard.awayScore = awayScore;
    if (events) scorecard.events = events;
    if (notes) scorecard.notes = notes;
    if (weather) scorecard.weather = weather;
    if (venue) scorecard.venue = venue;
    
    scorecard.lastUpdated = new Date();
    await scorecard.save();

    // Update match score for quick access
    if (homeScore !== undefined || awayScore !== undefined) {
      match.score = {
        home: homeScore !== undefined ? homeScore : (match.score?.home || 0),
        away: awayScore !== undefined ? awayScore : (match.score?.away || 0)
      };
      await match.save();
    }

    // Emit score update via socket
    const io = req.app.get('io');
    if (io) {
      emitScoreUpdate(io, match._id, match.tournament._id, homeScore, awayScore, {
        type: 'score_update',
        homeScore: scorecard.homeScore,
        awayScore: scorecard.awayScore,
        events: scorecard.events
      });
    }

    res.status(200).json({
      success: true,
      data: scorecard,
      message: 'Score updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add match event
// @route   POST /api/matches/:id/events
// @access  Private (Organizer only)
export const addMatchEvent = async (req, res, next) => {
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

    const match = await Match.findById(req.params.id).populate('tournament');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Make sure user is tournament organizer
    if (match.tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this match'
      });
    }

    // Add event
    await match.addEvent(req.body);

    // Emit match event via socket
    const io = req.app.get('io');
    emitMatchEvent(io, match._id, match.tournament._id, req.body);

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start match
// @route   PUT /api/matches/:id/start
// @access  Private (Organizer only)
export const startMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization - tournament organizer or team members
    const isOrganizer = match.tournament.organizer.toString() === req.user.id;
    const isTeamMember = match.homeTeam.players.some(p => p.user?.toString() === req.user.id) ||
                        match.awayTeam.players.some(p => p.user?.toString() === req.user.id);

    if (!isOrganizer && !isTeamMember) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to start this match'
      });
    }

    if (match.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Match cannot be started'
      });
    }

    // Start the match
    match.status = 'ongoing';
    match.actualStartTime = new Date();
    await match.save();

    // Create scorecard if it doesn't exist
    let scorecard = await Scorecard.findOne({ match: match._id });
    if (!scorecard) {
      scorecard = new Scorecard({
        match: match._id,
        homeTeam: match.homeTeam._id,
        awayTeam: match.awayTeam._id,
        sport: match.sport || match.tournament.sport,
        events: [],
        statistics: {},
        homeScore: 0,
        awayScore: 0
      });
      await scorecard.save();
    }

    // Emit match status change via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`match-${match._id}`).emit('match-status-changed', {
        matchId: match._id,
        status: 'ongoing',
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: match,
      scorecard: scorecard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update player statistics for a match
// @route   PATCH /api/matches/:id/player-stats
// @access  Private (Organizer/Team members)
export const updateMatchPlayerStats = async (req, res, next) => {
  try {
    const { playerStats } = req.body;

    const match = await Match.findById(req.params.id)
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization - tournament organizer or team members
    const isOrganizer = match.tournament.organizer.toString() === req.user.id;
    const isTeamMember = match.homeTeam.players.some(p => p.user?.toString() === req.user.id) ||
                        match.awayTeam.players.some(p => p.user?.toString() === req.user.id);

    if (!isOrganizer && !isTeamMember) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update player stats for this match'
      });
    }

    if (match.status === 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update player stats for a scheduled match'
      });
    }

    match.playerStats = playerStats;
    await match.save();

    res.status(200).json({
      success: true,
      data: match.playerStats,
      message: 'Player stats updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End match
// @route   PUT /api/matches/:id/end
// @access  Private (Organizer only)
export const endMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('tournament homeTeam awayTeam');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Make sure user is tournament organizer
    if (match.tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to end this match'
      });
    }

    if (match.status !== 'live') {
      return res.status(400).json({
        success: false,
        error: 'Match is not live'
      });
    }

    await match.endMatch();

    // Update team stats
    const homeResult = {
      result: match.result.isDraw ? 'draw' : (match.result.winner?.toString() === match.homeTeam._id.toString() ? 'win' : 'loss'),
      goalsFor: match.score.home,
      goalsAgainst: match.score.away
    };

    const awayResult = {
      result: match.result.isDraw ? 'draw' : (match.result.winner?.toString() === match.awayTeam._id.toString() ? 'win' : 'loss'),
      goalsFor: match.score.away,
      goalsAgainst: match.score.home
    };

    await match.homeTeam.updateStats(homeResult);
    await match.awayTeam.updateStats(awayResult);

    // Update individual user stats
    const allPlayers = [
      ...match.homeTeam.players,
      ...match.awayTeam.players
    ];

    for (const player of allPlayers) {
      if (player.user) {
        const user = await User.findById(player.user);
        if (user) {
          user.stats.matchesPlayed = (user.stats.matchesPlayed || 0) + 1;
          
          const isHomeTeam = match.homeTeam.players.some(p => p.user?.toString() === player.user.toString());
          const isAwayTeam = match.awayTeam.players.some(p => p.user?.toString() === player.user.toString());
          
          if ((isHomeTeam && homeResult.result === 'win') || 
              (isAwayTeam && awayResult.result === 'win')) {
            user.stats.matchesWon = (user.stats.matchesWon || 0) + 1;
          }
          await user.save({ validateBeforeSave: false });
        }
      }
    }

    // Emit match status change via socket
    const io = req.app.get('io');
    io.to(`match-${match._id}`).emit('match-status-changed', {
      matchId: match._id,
      status: 'completed',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live matches
// @route   GET /api/matches/live
// @access  Public
export const getLiveMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .populate('tournament', 'name sport logo')
      .populate('homeTeam', 'name logo shortName')
      .populate('awayTeam', 'name logo shortName')
      .sort({ actualStartTime: -1 });

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming matches
// @route   GET /api/matches/upcoming
// @access  Public
export const getUpcomingMatches = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const matches = await Match.find({ 
      status: 'scheduled',
      scheduledTime: { $gte: new Date() }
    })
      .populate('tournament', 'name sport logo')
      .populate('homeTeam', 'name logo shortName')
      .populate('awayTeam', 'name logo shortName')
      .sort({ scheduledTime: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match statistics
// @route   GET /api/matches/:id/stats
// @access  Public
// @desc    Update final match result
// @route   PUT /api/matches/:id/result
// @access  Private (Organizer/Team members)
export const updateMatchResult = async (req, res, next) => {
  try {
    const { homeScore, awayScore, winner, events, notes, weather, venue } = req.body;

    const match = await Match.findById(req.params.id)
      .populate('tournament')
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization
    const isOrganizer = match.tournament.organizer.toString() === req.user.id;
    const isTeamMember = match.homeTeam.players.some(p => p.user?.toString() === req.user.id) ||
                        match.awayTeam.players.some(p => p.user?.toString() === req.user.id);

    if (!isOrganizer && !isTeamMember) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this match'
      });
    }

    // Update match result
    match.result = {
      homeScore: homeScore || 0,
      awayScore: awayScore || 0,
      winner: winner || null,
      isDraw: homeScore === awayScore
    };
    match.score = {
      home: homeScore || 0,
      away: awayScore || 0
    };
    match.status = 'completed';
    match.actualEndTime = new Date();
    await match.save();

    // Update scorecard
    let scorecard = await Scorecard.findOne({ match: match._id });
    if (scorecard) {
      scorecard.homeScore = homeScore || 0;
      scorecard.awayScore = awayScore || 0;
      scorecard.winner = winner;
      if (events) scorecard.events = events;
      if (notes) scorecard.notes = notes;
      if (weather) scorecard.weather = weather;
      if (venue) scorecard.venue = venue;
      scorecard.completed = true;
      scorecard.lastUpdated = new Date();
      await scorecard.save();
    }

    // Update team stats
    const homeResult = {
      result: match.result.isDraw ? 'draw' : (match.result.winner?.toString() === match.homeTeam._id.toString() ? 'win' : 'loss'),
      goalsFor: homeScore || 0,
      goalsAgainst: awayScore || 0
    };

    const awayResult = {
      result: match.result.isDraw ? 'draw' : (match.result.winner?.toString() === match.awayTeam._id.toString() ? 'win' : 'loss'),
      goalsFor: awayScore || 0,
      goalsAgainst: homeScore || 0
    };

    // Update team statistics if they have updateStats method
    if (typeof match.homeTeam.updateStats === 'function') {
      await match.homeTeam.updateStats(homeResult);
    }
    if (typeof match.awayTeam.updateStats === 'function') {
      await match.awayTeam.updateStats(awayResult);
    }

    // Update individual user stats
    const allPlayers = [
      ...match.homeTeam.players,
      ...match.awayTeam.players
    ];

    for (const player of allPlayers) {
      if (player.user) {
        const user = await User.findById(player.user);
        if (user) {
          user.stats.matchesPlayed = (user.stats.matchesPlayed || 0) + 1;
          
          const isHomeTeam = match.homeTeam.players.some(p => p.user?.toString() === player.user.toString());
          const isAwayTeam = match.awayTeam.players.some(p => p.user?.toString() === player.user.toString());
          
          if ((isHomeTeam && homeResult.result === 'win') || 
              (isAwayTeam && awayResult.result === 'win')) {
            user.stats.matchesWon = (user.stats.matchesWon || 0) + 1;
          }
          await user.save({ validateBeforeSave: false });
        }
      }
    }

    // Emit match completion via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`match-${match._id}`).emit('match-completed', {
        matchId: match._id,
        result: match.result,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: match,
      message: 'Match completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match statistics
// @route   GET /api/matches/:id/stats
// @access  Public
export const getMatchStats = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .populate('playerStats.player', 'firstName lastName avatar');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const scorecard = await Scorecard.findOne({ match: match._id });

    const stats = {
      matchInfo: {
        id: match._id,
        status: match.status,
        score: match.score,
        duration: match.duration,
        events: scorecard?.events || []
      },
      teamStats: {
        home: {
          team: match.homeTeam,
          stats: match.statistics?.home || {}
        },
        away: {
          team: match.awayTeam,
          stats: match.statistics?.away || {}
        }
      },
      playerStats: match.playerStats || [],
      events: scorecard?.events || [],
      scorecard: scorecard
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

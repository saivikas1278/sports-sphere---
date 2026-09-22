import { validationResult } from 'express-validator';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Scorecard from '../models/Scorecard.js';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import { emitBracketUpdate } from '../utils/socketHandlers.js';
import cloudinary from '../config/cloudinary.js';

// Helper function to create tournament bracket and schedule matches
const generateTournamentSchedule = async (tournament) => {
  try {
    console.log(`[TOURNAMENT] Generating schedule for tournament: ${tournament.name}`);
    
    const teams = await Team.find({ 
      tournament: tournament._id,
      'registrationDetails.registrationStatus': 'approved'
    });
    
    if (teams.length < 2) {
      throw new Error('At least 2 teams required to generate schedule');
    }
    
    const matches = [];
    const tournamentStart = new Date(tournament.dates.tournamentStart);
    const tournamentEnd = new Date(tournament.dates.tournamentEnd);
    const totalDays = Math.ceil((tournamentEnd - tournamentStart) / (1000 * 60 * 60 * 24));
    
    console.log(`[TOURNAMENT] Tournament runs for ${totalDays} days with ${teams.length} teams`);
    
    if (tournament.format === 'single-elimination') {
      return generateSingleEliminationSchedule(tournament, teams, tournamentStart, totalDays);
    } else if (tournament.format === 'round-robin') {
      return generateRoundRobinSchedule(tournament, teams, tournamentStart, totalDays);
    } else if (tournament.format === 'double-elimination') {
      return generateDoubleEliminationSchedule(tournament, teams, tournamentStart, totalDays);
    }
    
  } catch (error) {
    console.error('[TOURNAMENT] Error generating schedule:', error);
    throw error;
  }
};

// Single Elimination Tournament Schedule
const generateSingleEliminationSchedule = async (tournament, teams, startDate, totalDays) => {
  const matches = [];
  const bracket = { rounds: [] };
  
  // Shuffle teams for random seeding
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // Calculate number of rounds needed
  const numRounds = Math.ceil(Math.log2(shuffledTeams.length));
  const daysPerRound = Math.floor(totalDays / numRounds);
  
  console.log(`[SINGLE-ELIMINATION] ${numRounds} rounds needed, ${daysPerRound} days per round`);
  
  let currentTeams = [...shuffledTeams];
  let matchNumber = 1;
  
  for (let round = 1; round <= numRounds; round++) {
    const roundMatches = [];
    const roundDate = new Date(startDate.getTime() + (round - 1) * daysPerRound * 24 * 60 * 60 * 1000);
    
    // If odd number of teams, one gets a bye
    if (currentTeams.length % 2 === 1) {
      const byeTeam = currentTeams.pop();
      console.log(`[SINGLE-ELIMINATION] Round ${round}: ${byeTeam.name} gets a bye`);
    }
    
    // Create matches for this round
    for (let i = 0; i < currentTeams.length; i += 2) {
      if (i + 1 < currentTeams.length) {
        const homeTeam = currentTeams[i];
        const awayTeam = currentTeams[i + 1];
        
        const match = {
          tournament: tournament._id,
          homeTeam: homeTeam._id,
          awayTeam: awayTeam._id,
          matchNumber: matchNumber++,
          round: getRoundName(round, numRounds),
          venue: tournament.venue,
          scheduledTime: new Date(roundDate.getTime() + (i / 2) * 2 * 60 * 60 * 1000), // 2 hours apart
          status: 'scheduled',
          officials: {
            umpires: [],
            referee: ''
          }
        };
        
        roundMatches.push(match);
        matches.push(match);
      }
    }
    
    bracket.rounds.push({
      round: round,
      name: getRoundName(round, numRounds),
      matches: roundMatches.length
    });
    
    // For next round, assume teams advance (this will be updated when matches are completed)
    currentTeams = currentTeams.slice(0, Math.floor(currentTeams.length / 2));
  }
  
  // Create matches in database
  const createdMatches = await Match.create(matches);
  
  // Create initial scorecards for all matches
  for (const match of createdMatches) {
    await createInitialScorecard(match);
  }
  
  // Update tournament with bracket info
  tournament.brackets = bracket;
  tournament.matches = createdMatches.map(m => m._id);
  await tournament.save();
  
  console.log(`[SINGLE-ELIMINATION] Created ${createdMatches.length} matches`);
  return { matches: createdMatches, bracket };
};

// Round Robin Tournament Schedule
const generateRoundRobinSchedule = async (tournament, teams, startDate, totalDays) => {
  const matches = [];
  const numTeams = teams.length;
  const totalMatches = (numTeams * (numTeams - 1)) / 2;
  const matchesPerDay = Math.ceil(totalMatches / totalDays);
  
  console.log(`[ROUND-ROBIN] ${totalMatches} total matches, ${matchesPerDay} matches per day`);
  
  let matchNumber = 1;
  let currentDate = new Date(startDate);
  let matchesOnCurrentDay = 0;
  
  // Generate all possible match combinations
  for (let i = 0; i < numTeams; i++) {
    for (let j = i + 1; j < numTeams; j++) {
      // Check if we need to move to next day
      if (matchesOnCurrentDay >= matchesPerDay) {
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        matchesOnCurrentDay = 0;
      }
      
      const match = {
        tournament: tournament._id,
        homeTeam: teams[i]._id,
        awayTeam: teams[j]._id,
        matchNumber: matchNumber++,
        round: 'round-robin',
        venue: tournament.venue,
        scheduledTime: new Date(currentDate.getTime() + matchesOnCurrentDay * 2 * 60 * 60 * 1000),
        status: 'scheduled',
        officials: {
          umpires: [],
          referee: ''
        }
      };
      
      matches.push(match);
      matchesOnCurrentDay++;
    }
  }
  
  // Create matches in database
  const createdMatches = await Match.create(matches);
  
  // Create initial scorecards
  for (const match of createdMatches) {
    await createInitialScorecard(match);
  }
  
  // Update tournament
  tournament.matches = createdMatches.map(m => m._id);
  tournament.brackets = {
    format: 'round-robin',
    totalRounds: 1,
    matchesPerTeam: numTeams - 1
  };
  await tournament.save();
  
  console.log(`[ROUND-ROBIN] Created ${createdMatches.length} matches`);
  return { matches: createdMatches, bracket: tournament.brackets };
};

// Helper function to get round names
const getRoundName = (round, totalRounds) => {
  if (totalRounds - round === 0) return 'final';
  if (totalRounds - round === 1) return 'semi-final';
  if (totalRounds - round === 2) return 'quarter-final';
  return `round-${round}`;
};

// Create initial scorecard for a match
const createInitialScorecard = async (match) => {
  try {
    const homeTeam = await Team.findById(match.homeTeam).populate('players.user');
    const awayTeam = await Team.findById(match.awayTeam).populate('players.user');
    
    const scorecard = await Scorecard.create({
      match: match._id,
      sportsCategory: 'cricket', // Default to cricket, can be made dynamic
      cricket: {
        innings: [
          {
            team: homeTeam._id,
            runs: 0,
            wickets: 0,
            overs: 0,
            balls: 0,
            extras: {
              wides: 0,
              noBalls: 0,
              byes: 0,
              legByes: 0
            },
            batsmen: homeTeam.players.slice(0, 2).map(player => ({
              player: `${player.user.firstName} ${player.user.lastName}`,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              isOut: false
            })),
            bowlers: []
          }
        ]
      },
      status: 'not-started'
    });
    
    // Link scorecard to match
    match.scorecard = scorecard._id;
    await match.save();
    
    return scorecard;
  } catch (error) {
    console.error('[SCORECARD] Error creating initial scorecard:', error);
    throw error;
  }
};

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
export const getTournaments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filters
    if (req.query.sport) {
      query.sport = req.query.sport;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.city) {
      query['venue.city'] = { $regex: req.query.city, $options: 'i' };
    }
    
    if (req.query.organizer) {
      query.organizer = req.query.organizer;
    }

    // Date filters
    if (req.query.startDate) {
      query['dates.tournamentStart'] = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
      query['dates.tournamentEnd'] = { $lte: new Date(req.query.endDate) };
    }

    // Visibility filter (only show public tournaments for non-authenticated users)
    if (!req.user) {
      query.visibility = 'public';
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'firstName lastName avatar')
      .populate('registeredTeams', 'name logo teamSize')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    const total = await Tournament.countDocuments(query);

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
      count: tournaments.length,
      total,
      pagination,
      data: tournaments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'firstName lastName avatar email')
      .populate({
        path: 'registeredTeams',
        populate: {
          path: 'captain players.user',
          select: 'firstName lastName avatar'
        }
      })
      .populate('matches');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if user can view private tournament
    if (tournament.visibility === 'private' && (!req.user || req.user.id !== tournament.organizer._id.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to private tournament'
      });
    }

    res.status(200).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tournament
// @route   POST /api/tournaments
// @access  Private (Organizer only)
export const createTournament = async (req, res, next) => {
  try {
    console.log('[TOURNAMENT] Create tournament request received');
    console.log('[TOURNAMENT] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[TOURNAMENT] User:', req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    } : 'No user');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[TOURNAMENT] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Add organizer to req.body
    req.body.organizer = req.user.id;
    console.log('[TOURNAMENT] Creating tournament with organizer:', req.user.id);

    const tournament = await Tournament.create(req.body);
    console.log('[TOURNAMENT] Tournament created successfully:', tournament._id);

    res.status(201).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('[TOURNAMENT] Error creating tournament:', error);
    next(error);
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Organizer only)
export const updateTournament = async (req, res, next) => {
  try {
    let tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Make sure user is tournament organizer
    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authorized to update this tournament'
      });
    }

    // Don't allow certain fields to be updated after tournament starts
    if (tournament.status !== 'draft' && tournament.status !== 'open') {
      const restrictedFields = ['sport', 'format', 'maxTeams', 'dates'];
      const hasRestrictedField = restrictedFields.some(field => req.body[field]);
      
      if (hasRestrictedField) {
        return res.status(400).json({
          success: false,
          error: 'Cannot modify tournament structure after registration closes'
        });
      }
    }

    tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Organizer only)
export const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Make sure user is tournament organizer
    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authorized to delete this tournament'
      });
    }

    // Don't allow deletion if tournament has started
    if (tournament.status === 'ongoing' || tournament.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tournament that has started or completed'
      });
    }

    await tournament.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register team for tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
export const registerTeamForTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check registration status
    if (tournament.registrationStatus !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Tournament registration is not open'
      });
    }

    // Check if tournament is full
    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    // Create team
    const teamData = {
      ...req.body,
      captain: req.user.id,
      tournament: tournament._id,
      sport: tournament.sport
    };

    const team = await Team.create(teamData);

    // Update team status for all players (simplified approach)
    if (teamData.players && teamData.players.length > 0) {
      const User = (await import('../models/User.js')).default;
      
      for (const player of teamData.players) {
        try {
          await User.findByIdAndUpdate(
            player.user,
            {
              currentTeam: team._id,
              $push: {
                teams: {
                  team: team._id,
                  status: 'active',
                  joinedAt: new Date()
                }
              }
            },
            { new: true }
          );
        } catch (playerError) {
          console.error(`Error updating team status for player ${player.user}:`, playerError);
          // Continue with other players even if one fails
        }
      }
    }

    // Add team to tournament
    tournament.registeredTeams.push(team._id);
    await tournament.save();

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unregister team from tournament
// @route   DELETE /api/tournaments/:id/unregister
// @access  Private
export const unregisterTeamFromTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Find user's team in this tournament
    const team = await Team.findOne({
      tournament: tournament._id,
      captain: req.user.id
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found in this tournament'
      });
    }

    // Check if tournament allows late withdrawal
    if (tournament.status !== 'open' && !tournament.settings.allowLateRegistration) {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw after registration closes'
      });
    }

    // Remove team from tournament
    tournament.registeredTeams = tournament.registeredTeams.filter(
      teamId => teamId.toString() !== team._id.toString()
    );
    await tournament.save();

    // Delete team
    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team unregistered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve team registration
// @route   PUT /api/tournaments/:id/registrations/:teamId/approve
// @access  Private (Organizer only)
export const approveTournamentRegistration = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    const team = await Team.findById(req.params.teamId);

    if (!tournament || !team) {
      return res.status(404).json({
        success: false,
        error: 'Tournament or team not found'
      });
    }

    // Make sure user is tournament organizer
    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    team.registrationDetails.registrationStatus = 'approved';
    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject team registration
// @route   PUT /api/tournaments/:id/registrations/:teamId/reject
// @access  Private (Organizer only)
export const rejectTournamentRegistration = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    const team = await Team.findById(req.params.teamId);

    if (!tournament || !team) {
      return res.status(404).json({
        success: false,
        error: 'Tournament or team not found'
      });
    }

    // Make sure user is tournament organizer
    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    team.registrationDetails.registrationStatus = 'rejected';
    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament bracket
// @route   GET /api/tournaments/:id/bracket
// @access  Public
export const getTournamentBracket = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name logo')
      .populate('matches');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bracket: tournament.brackets,
        teams: tournament.registeredTeams,
        matches: tournament.matches
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tournament bracket
// @route   PUT /api/tournaments/:id/bracket
// @access  Private (Organizer only)
export const updateTournamentBracket = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Make sure user is tournament organizer
    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    tournament.brackets = req.body.bracket;
    await tournament.save();

    // Emit bracket update via socket
    const io = req.app.get('io');
    emitBracketUpdate(io, tournament._id, tournament.brackets);

    res.status(200).json({
      success: true,
      data: tournament.brackets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament standings
// @route   GET /api/tournaments/:id/standings
// @access  Public
export const getTournamentStandings = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('standings.team', 'name logo');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tournament.standings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament matches
// @route   GET /api/tournaments/:id/matches
// @access  Public
export const getTournamentMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ tournament: req.params.id })
      .populate('homeTeam', 'name logo')
      .populate('awayTeam', 'name logo')
      .sort({ scheduledTime: 1 });

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start tournament and generate schedule
// @route   POST /api/tournaments/:id/start
// @access  Private (Organizer only)
export const startTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Make sure user is tournament organizer
    if (tournament.organizer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to start this tournament'
      });
    }

    // Check if tournament can be started
    if (tournament.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Tournament must be in open status to start'
      });
    }

    // Check minimum teams
    const approvedTeams = await Team.countDocuments({
      tournament: tournament._id,
      'registrationDetails.registrationStatus': 'approved'
    });

    if (approvedTeams < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 approved teams required to start tournament'
      });
    }

    // Generate tournament schedule
    const scheduleResult = await generateTournamentSchedule(tournament);

    // Update tournament status
    tournament.status = 'ongoing';
    tournament.registrationStatus = 'closed';
    await tournament.save();

    // Send notifications to all team captains
    const teams = await Team.find({
      tournament: tournament._id,
      'registrationDetails.registrationStatus': 'approved'
    }).populate('captain');

    for (const team of teams) {
      await Notification.create({
        recipient: team.captain._id,
        type: 'tournament_started',
        title: 'Tournament Started',
        message: `${tournament.name} has started! Check your match schedule.`,
        data: {
          tournamentId: tournament._id,
          teamId: team._id
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tournament started successfully',
      data: {
        tournament,
        matches: scheduleResult.matches,
        bracket: scheduleResult.bracket
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament schedule/matches with auto-generation
// @route   GET /api/tournaments/:id/schedule
// @access  Public
export const getTournamentSchedule = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // If tournament is ongoing but has no matches, generate them
    if (tournament.status === 'ongoing' && (!tournament.matches || tournament.matches.length === 0)) {
      console.log('[TOURNAMENT] Auto-generating schedule for ongoing tournament');
      await generateTournamentSchedule(tournament);
    }

    const matches = await Match.find({ tournament: tournament._id })
      .populate('homeTeam', 'name logo shortName')
      .populate('awayTeam', 'name logo shortName')
      .populate('scorecard')
      .sort({ scheduledTime: 1 });

    // Group matches by round/date for better organization
    const groupedMatches = groupMatchesByRound(matches);

    res.status(200).json({
      success: true,
      data: {
        tournament: {
          id: tournament._id,
          name: tournament.name,
          status: tournament.status,
          format: tournament.format,
          brackets: tournament.brackets
        },
        schedule: groupedMatches,
        totalMatches: matches.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to group matches by round
const groupMatchesByRound = (matches) => {
  const grouped = {};
  
  matches.forEach(match => {
    const roundKey = match.round || 'general';
    if (!grouped[roundKey]) {
      grouped[roundKey] = [];
    }
    grouped[roundKey].push(match);
  });
  
  return grouped;
};

// @desc    Update match result and advance tournament
// @route   PUT /api/tournaments/:id/matches/:matchId/result
// @access  Private (Organizer or Team Captain)
export const updateMatchResult = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { winner, homeScore, awayScore, details } = req.body;

    const match = await Match.findById(matchId)
      .populate('homeTeam awayTeam tournament');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization
    const tournament = match.tournament;
    const isOrganizer = tournament.organizer.toString() === req.user.id;
    const isTeamCaptain = (
      match.homeTeam.captain.toString() === req.user.id ||
      match.awayTeam.captain.toString() === req.user.id
    );

    if (!isOrganizer && !isTeamCaptain) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update match result'
      });
    }

    // Update match result
    match.result = {
      winner: winner,
      homeScore: homeScore,
      awayScore: awayScore,
      details: details
    };
    match.status = 'completed';
    await match.save();

    // Update tournament standings if round-robin
    if (tournament.format === 'round-robin') {
      await updateRoundRobinStandings(tournament._id, match);
    }

    // Check if tournament round is complete and advance
    if (tournament.format === 'single-elimination' || tournament.format === 'double-elimination') {
      await checkAndAdvanceTournament(tournament._id);
    }

    // Update scorecard status
    if (match.scorecard) {
      await Scorecard.findByIdAndUpdate(match.scorecard, {
        status: 'completed',
        'result.winner': winner,
        'result.homeScore': homeScore,
        'result.awayScore': awayScore
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

// Helper function to update round-robin standings
const updateRoundRobinStandings = async (tournamentId, match) => {
  try {
    const tournament = await Tournament.findById(tournamentId);
    const { winner, homeScore, awayScore } = match.result;
    
    // Initialize standings if not exist
    if (!tournament.standings) {
      tournament.standings = [];
    }
    
    // Update or create standings for both teams
    const teams = [match.homeTeam._id, match.awayTeam._id];
    
    for (const teamId of teams) {
      let teamStanding = tournament.standings.find(s => s.team.toString() === teamId.toString());
      
      if (!teamStanding) {
        teamStanding = {
          team: teamId,
          played: 0,
          won: 0,
          lost: 0,
          points: 0,
          for: 0,
          against: 0
        };
        tournament.standings.push(teamStanding);
      }
      
      teamStanding.played += 1;
      
      if (teamId.toString() === match.homeTeam._id.toString()) {
        teamStanding.for += homeScore;
        teamStanding.against += awayScore;
        if (winner === 'home') {
          teamStanding.won += 1;
          teamStanding.points += 3; // 3 points for win
        } else {
          teamStanding.lost += 1;
        }
      } else {
        teamStanding.for += awayScore;
        teamStanding.against += homeScore;
        if (winner === 'away') {
          teamStanding.won += 1;
          teamStanding.points += 3;
        } else {
          teamStanding.lost += 1;
        }
      }
    }
    
    // Sort standings by points, then by goal difference
    tournament.standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      return (b.for - b.against) - (a.for - a.against);
    });
    
    await tournament.save();
  } catch (error) {
    console.error('[STANDINGS] Error updating standings:', error);
  }
};

// Helper function to check and advance tournament
const checkAndAdvanceTournament = async (tournamentId) => {
  try {
    const tournament = await Tournament.findById(tournamentId);
    const allMatches = await Match.find({ tournament: tournamentId });
    
    // Check if current round is complete
    const currentRoundMatches = allMatches.filter(m => m.round === getCurrentRound(tournament));
    const completedMatches = currentRoundMatches.filter(m => m.status === 'completed');
    
    if (completedMatches.length === currentRoundMatches.length && currentRoundMatches.length > 0) {
      // Round is complete, advance to next round
      await advanceToNextRound(tournament, completedMatches);
    }
  } catch (error) {
    console.error('[TOURNAMENT] Error advancing tournament:', error);
  }
};

// Helper function to get current round
const getCurrentRound = (tournament) => {
  // This would be implemented based on tournament structure
  // For now, return a default
  return 'quarter-final';
};

// Helper function to advance to next round
const advanceToNextRound = async (tournament, completedMatches) => {
  try {
    console.log(`[TOURNAMENT] Advancing ${tournament.name} to next round`);
    
    // Get winners from completed matches
    const winners = completedMatches.map(match => {
      return match.result.winner === 'home' ? match.homeTeam : match.awayTeam;
    });
    
    // Generate next round matches if winners exist
    if (winners.length >= 2) {
      // This would generate the next round matches
      // Implementation depends on tournament format
      console.log(`[TOURNAMENT] ${winners.length} teams advance to next round`);
    } else if (winners.length === 1) {
      // Tournament complete
      tournament.status = 'completed';
      tournament.winner = winners[0];
      await tournament.save();
      console.log(`[TOURNAMENT] Tournament ${tournament.name} completed!`);
    }
  } catch (error) {
    console.error('[TOURNAMENT] Error advancing to next round:', error);
  }
};

// @desc    Search tournaments
// @route   GET /api/tournaments/search
// @access  Public
export const searchTournaments = async (req, res, next) => {
  try {
    const { q, sport, location, dateFrom, dateTo, lat, lng, radius } = req.query;

    let query = {};

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Sport filter
    if (sport) {
      query.sport = sport;
    }

    // Location filter (text based)
    if (location && (!lat || !lng)) {
      query.$or = [
        { 'venue.city': { $regex: location, $options: 'i' } },
        { 'venue.state': { $regex: location, $options: 'i' } }
      ];
    }

    // Geospatial filter
    if (lat && lng) {
      const radiusInMeters = (parseInt(radius) || 50) * 1000; // default 50km
      query['venue.location'] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // GeoJSON is [lng, lat]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query['dates.tournamentStart'] = {};
      if (dateFrom) {
        query['dates.tournamentStart'].$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query['dates.tournamentStart'].$lte = new Date(dateTo);
      }
    }

    // Only show public tournaments for non-authenticated users
    if (!req.user) {
      query.visibility = 'public';
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'firstName lastName avatar')
      .populate('registeredTeams', 'name logo')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });
  } catch (error) {
    next(error);
  }
};

import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Tournament from '../models/Tournament.js';
import { canModify } from '../middleware/authorization.js';
import { logAudit } from '../utils/auditLogger.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Scorecard from '../models/Scorecard.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Profile from '../models/Profile.js';
import { emitBracketUpdate, emitScoreUpdate, emitNotification } from '../utils/socketHandlers.js';
import cloudinary from '../config/cloudinary.js';
import {
  createInitialCricketState,
  applyDelivery,
  undoDelivery,
  calculateMetrics,
  determineMatchResult
} from '../utils/cricketScoringEngine.js';
import {
  createInitialPointsState,
  applyPoint,
  undoPoint,
  resolveConfig,
  getActiveSetStatus
} from '../utils/pointsScoringEngine.js';

// Helper function to create tournament bracket and schedule matches
const generateTournamentSchedule = async (tournament) => {
  try {
    console.log(`[TOURNAMENT] Generating schedule for tournament: ${tournament.name}`);
    
    const approvedRegisteredTeamIds = (tournament.registeredTeams || [])
      .filter(rt => rt.status === 'approved')
      .map(rt => rt.team?._id || rt.team);

    const teams = await Team.find({ 
      $or: [
        { _id: { $in: approvedRegisteredTeamIds } },
        { tournament: tournament._id, 'registrationDetails.registrationStatus': 'approved' }
      ]
    });
    
    if (teams.length < 2) {
      throw new Error('At least 2 approved teams required to generate schedule');
    }
    
    const matches = [];
    const tournamentStart = tournament.dates?.tournamentStart ? new Date(tournament.dates.tournamentStart) : new Date();
    const tournamentEnd = tournament.dates?.tournamentEnd ? new Date(tournament.dates.tournamentEnd) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(1, Math.ceil((tournamentEnd - tournamentStart) / (1000 * 60 * 60 * 24)));
    
    console.log(`[TOURNAMENT] Tournament runs for ${totalDays} days with ${teams.length} teams`);
    
    if (tournament.format === 'single-elimination') {
      return generateSingleEliminationSchedule(tournament, teams, tournamentStart, totalDays);
    } else if (tournament.format === 'round-robin') {
      return generateRoundRobinSchedule(tournament, teams, tournamentStart, totalDays);
    } else if (tournament.format === 'double-elimination') {
      return generateDoubleEliminationSchedule(tournament, teams, tournamentStart, totalDays);
    } else {
      return generateSingleEliminationSchedule(tournament, teams, tournamentStart, totalDays);
    }
    
  } catch (error) {
    console.error('[TOURNAMENT] Error generating schedule:', error);
    throw error;
  }
};

// Single Elimination Tournament Schedule with Automatic Bye Progression and Next Match Links
const generateSingleEliminationSchedule = async (tournament, teams, startDate, totalDays) => {
  const N = teams.length;
  if (N < 2) {
    throw new Error('At least 2 approved teams required to generate single-elimination bracket');
  }

  // Shuffle teams for initial seeding
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  // S: bracket capacity (next power of 2)
  const S = Math.pow(2, Math.ceil(Math.log2(N)));
  const numRounds = Math.log2(S);
  const byesCount = S - N;
  const round1MatchesCount = (N - byesCount) / 2;
  const daysPerRound = Math.max(1, Math.floor(totalDays / numRounds));

  console.log(`[SINGLE-ELIMINATION] Teams: ${N}, Bracket Size: ${S}, Rounds: ${numRounds}, Byes: ${byesCount}, R1 Matches: ${round1MatchesCount}`);

  // Map to store match objects per round: roundMatchesMap[r] = array of match objects
  const roundMatchesMap = {};
  for (let r = 1; r <= numRounds; r++) {
    roundMatchesMap[r] = [];
  }

  // 1. Instantiate future round matches (Round 2 to Round R) from Final down to Round 2
  for (let r = 2; r <= numRounds; r++) {
    const numMatchesInRound = S / Math.pow(2, r);
    const roundDate = new Date(startDate.getTime() + (r - 1) * daysPerRound * 24 * 60 * 60 * 1000);

    for (let p = 0; p < numMatchesInRound; p++) {
      roundMatchesMap[r].push({
        _id: new mongoose.Types.ObjectId(),
        tournament: tournament._id,
        round: r,
        roundName: getRoundName(r, numRounds),
        position: p,
        matchNumber: 0, // assigned sequentially later
        homeTeam: null,
        awayTeam: null,
        nextMatchId: null,
        nextSlot: null,
        venue: tournament.venue,
        scheduledTime: new Date(roundDate.getTime() + p * 2 * 60 * 60 * 1000),
        status: 'scheduled',
        officials: { umpires: [], referee: '' }
      });
    }
  }

  // 2. Wire nextMatchId and nextSlot for rounds 2 through R-1
  for (let r = 2; r < numRounds; r++) {
    for (let p = 0; p < roundMatchesMap[r].length; p++) {
      const parentMatch = roundMatchesMap[r + 1][Math.floor(p / 2)];
      roundMatchesMap[r][p].nextMatchId = parentMatch._id;
      roundMatchesMap[r][p].nextSlot = p % 2 === 0 ? 'teamA' : 'teamB';
    }
  }

  // 3. Handle Round 1 and Round 2 Bye Allocations
  const round1Date = new Date(startDate.getTime());

  if (byesCount === 0) {
    // Exact power of two (4, 8, 16...): all teams play in Round 1
    for (let p = 0; p < round1MatchesCount; p++) {
      const homeTeam = shuffledTeams[2 * p];
      const awayTeam = shuffledTeams[2 * p + 1];
      const parentMatch = roundMatchesMap[2] ? roundMatchesMap[2][Math.floor(p / 2)] : null;

      roundMatchesMap[1].push({
        _id: new mongoose.Types.ObjectId(),
        tournament: tournament._id,
        round: 1,
        roundName: getRoundName(1, numRounds),
        position: p,
        matchNumber: 0,
        homeTeam: homeTeam._id || homeTeam,
        awayTeam: awayTeam._id || awayTeam,
        nextMatchId: parentMatch ? parentMatch._id : null,
        nextSlot: parentMatch ? (p % 2 === 0 ? 'teamA' : 'teamB') : null,
        venue: tournament.venue,
        scheduledTime: new Date(round1Date.getTime() + p * 2 * 60 * 60 * 1000),
        status: 'scheduled',
        officials: { umpires: [], referee: '' }
      });
    }
  } else {
    // Non-power of two (e.g. 5, 11 teams): byes advance directly to Round 2 at generation time
    // First byesCount teams get byes into the first byesCount slots of Round 2
    for (let s = 0; s < byesCount; s++) {
      const byeTeam = shuffledTeams[s];
      const r2Match = roundMatchesMap[2][Math.floor(s / 2)];
      if (s % 2 === 0) {
        r2Match.homeTeam = byeTeam._id || byeTeam;
      } else {
        r2Match.awayTeam = byeTeam._id || byeTeam;
      }
      console.log(`[BYE] Team ${byeTeam.name || byeTeam._id} advanced automatically to Round 2 match ${Math.floor(s / 2)}, slot ${s % 2 === 0 ? 'teamA' : 'teamB'}`);
    }

    // The remaining (N - byesCount) teams play in the round1MatchesCount matches
    for (let m = 0; m < round1MatchesCount; m++) {
      const homeTeam = shuffledTeams[byesCount + 2 * m];
      const awayTeam = shuffledTeams[byesCount + 2 * m + 1];

      // Round 2 slot to feed into
      const r2SlotIndex = byesCount + m;
      const targetR2Match = roundMatchesMap[2][Math.floor(r2SlotIndex / 2)];
      const targetSlot = r2SlotIndex % 2 === 0 ? 'teamA' : 'teamB';

      roundMatchesMap[1].push({
        _id: new mongoose.Types.ObjectId(),
        tournament: tournament._id,
        round: 1,
        roundName: getRoundName(1, numRounds),
        position: m,
        matchNumber: 0,
        homeTeam: homeTeam._id || homeTeam,
        awayTeam: awayTeam._id || awayTeam,
        nextMatchId: targetR2Match._id,
        nextSlot: targetSlot,
        venue: tournament.venue,
        scheduledTime: new Date(round1Date.getTime() + m * 2 * 60 * 60 * 1000),
        status: 'scheduled',
        officials: { umpires: [], referee: '' }
      });
    }
  }

  // 4. Flatten all matches, assign matchNumbers sequentially, and build bracket structure
  const allMatches = [];
  const bracket = { rounds: [] };
  let matchNumberCounter = 1;

  for (let r = 1; r <= numRounds; r++) {
    const rMatches = roundMatchesMap[r] || [];
    rMatches.forEach((m) => {
      m.matchNumber = matchNumberCounter++;
      m.sport = tournament.sport ? tournament.sport.toLowerCase() : 'cricket';
      m.sportType = tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard';
      allMatches.push(m);
    });

    bracket.rounds.push({
      round: r,
      name: getRoundName(r, numRounds),
      matches: rMatches.length
    });
  }

  // Insert matches in database
  const createdMatches = await Match.create(allMatches);

  // Create initial scorecards for scheduled matches that have both teams ready
  for (const match of createdMatches) {
    if (match.homeTeam && match.awayTeam) {
      await createInitialScorecard(match);
    }
  }

  // Update tournament with bracket and matches
  tournament.brackets = bracket;
  tournament.matches = createdMatches.map((m) => m._id);
  await tournament.save();

  console.log(`[SINGLE-ELIMINATION] Generated ${createdMatches.length} linked bracket matches for ${N} teams`);
  return { matches: createdMatches, bracket };
};

// Double Elimination Tournament Schedule (Winners Bracket, Losers Bracket, and Grand Finals)
const generateDoubleEliminationSchedule = async (tournament, teams, startDate, totalDays) => {
  const N = teams.length;
  if (N < 2) {
    throw new Error('At least 2 approved teams required to generate double-elimination bracket');
  }

  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  const matches = [];
  const bracket = { format: 'double-elimination', rounds: [] };
  let matchNumber = 1;
  const daysStep = Math.max(1, Math.floor(totalDays / 4));

  // Pre-generate IDs for downstream rounds so feeder matches can link cleanly
  const wbFinalsId = new mongoose.Types.ObjectId();
  const lbFinalsId = new mongoose.Types.ObjectId();
  const grandFinalsId = new mongoose.Types.ObjectId();

  const half = Math.floor(N / 2);
  const lbCount = Math.max(1, Math.floor(half / 2));
  const lbR1Ids = Array.from({ length: lbCount }, () => new mongoose.Types.ObjectId());

  // 1. Winners Bracket Round 1
  const wbR1Matches = [];
  for (let i = 0; i < half; i++) {
    const targetLbId = lbR1Ids[Math.floor(i / 2)] || lbR1Ids[0];
    wbR1Matches.push({
      _id: new mongoose.Types.ObjectId(),
      tournament: tournament._id,
      round: 1,
      roundName: 'Winners Round 1',
      matchNumber: matchNumber++,
      position: i,
      homeTeam: shuffledTeams[2 * i]?._id || shuffledTeams[2 * i],
      awayTeam: shuffledTeams[2 * i + 1]?._id || shuffledTeams[2 * i + 1],
      sport: tournament.sport ? tournament.sport.toLowerCase() : 'cricket',
      sportType: tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard',
      nextMatchId: half === 1 ? grandFinalsId : wbFinalsId,
      nextSlot: i % 2 === 0 ? 'teamA' : 'teamB',
      loserMatchId: half === 1 ? lbFinalsId : targetLbId,
      loserSlot: i % 2 === 0 ? 'teamA' : 'teamB',
      bracketType: 'winners',
      venue: tournament.venue,
      scheduledTime: new Date(startDate.getTime() + i * 2 * 60 * 60 * 1000),
      status: 'scheduled',
      officials: { umpires: [], referee: '' }
    });
  }
  matches.push(...wbR1Matches);

  bracket.rounds.push({
    round: 1,
    name: 'Winners Round 1',
    bracketType: 'winners',
    matches: wbR1Matches.length
  });

  // 2. Winners Finals
  const wbFinalsMatch = {
    _id: wbFinalsId,
    tournament: tournament._id,
    round: 2,
    roundName: 'Winners Finals',
    matchNumber: matchNumber++,
    position: 0,
    homeTeam: wbR1Matches.length === 1 ? wbR1Matches[0].homeTeam : null,
    awayTeam: wbR1Matches.length === 1 ? wbR1Matches[0].awayTeam : null,
    sport: tournament.sport ? tournament.sport.toLowerCase() : 'cricket',
    sportType: tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard',
    nextMatchId: grandFinalsId,
    nextSlot: 'teamA',
    loserMatchId: lbFinalsId,
    loserSlot: 'teamB',
    bracketType: 'winners',
    venue: tournament.venue,
    scheduledTime: new Date(startDate.getTime() + daysStep * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    officials: { umpires: [], referee: '' }
  };
  matches.push(wbFinalsMatch);

  bracket.rounds.push({
    round: 2,
    name: 'Winners Finals',
    bracketType: 'winners',
    matches: 1
  });

  // 3. Losers Bracket Round 1
  const lbR1Matches = [];
  for (let i = 0; i < lbCount; i++) {
    lbR1Matches.push({
      _id: lbR1Ids[i],
      tournament: tournament._id,
      round: 3,
      roundName: 'Losers Round 1',
      matchNumber: matchNumber++,
      position: i,
      homeTeam: null,
      awayTeam: null,
      sport: tournament.sport ? tournament.sport.toLowerCase() : 'cricket',
      sportType: tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard',
      nextMatchId: lbFinalsId,
      nextSlot: i % 2 === 0 ? 'teamA' : 'teamB',
      loserMatchId: null,
      loserSlot: null,
      bracketType: 'losers',
      venue: tournament.venue,
      scheduledTime: new Date(startDate.getTime() + 2 * daysStep * 24 * 60 * 60 * 1000 + i * 2 * 60 * 60 * 1000),
      status: 'scheduled',
      officials: { umpires: [], referee: '' }
    });
  }
  matches.push(...lbR1Matches);

  bracket.rounds.push({
    round: 3,
    name: 'Losers Round 1',
    bracketType: 'losers',
    matches: lbR1Matches.length
  });

  // 4. Losers Finals
  const lbFinalsMatch = {
    _id: lbFinalsId,
    tournament: tournament._id,
    round: 4,
    roundName: 'Losers Finals',
    matchNumber: matchNumber++,
    position: 0,
    homeTeam: null,
    awayTeam: null,
    sport: tournament.sport ? tournament.sport.toLowerCase() : 'cricket',
    sportType: tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard',
    nextMatchId: grandFinalsId,
    nextSlot: 'teamB',
    loserMatchId: null,
    loserSlot: null,
    bracketType: 'losers',
    venue: tournament.venue,
    scheduledTime: new Date(startDate.getTime() + 3 * daysStep * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    officials: { umpires: [], referee: '' }
  };
  matches.push(lbFinalsMatch);

  bracket.rounds.push({
    round: 4,
    name: 'Losers Finals',
    bracketType: 'losers',
    matches: 1
  });

  // 5. Grand Finals
  const grandFinalsMatch = {
    _id: grandFinalsId,
    tournament: tournament._id,
    round: 5,
    roundName: 'Grand Finals',
    matchNumber: matchNumber++,
    position: 0,
    homeTeam: null,
    awayTeam: null,
    sport: tournament.sport ? tournament.sport.toLowerCase() : 'cricket',
    sportType: tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard',
    nextMatchId: null,
    nextSlot: null,
    loserMatchId: null,
    loserSlot: null,
    bracketType: 'finals',
    venue: tournament.venue,
    scheduledTime: new Date(startDate.getTime() + 4 * daysStep * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    officials: { umpires: [], referee: '' }
  };
  matches.push(grandFinalsMatch);

  bracket.rounds.push({
    round: 5,
    name: 'Grand Finals',
    bracketType: 'finals',
    matches: 1
  });

  const createdMatches = await Match.create(matches);

  for (const m of createdMatches) {
    if (m.homeTeam && m.awayTeam) {
      await createInitialScorecard(m);
    }
  }

  tournament.matches = createdMatches.map(m => m._id);
  tournament.brackets = bracket;
  await tournament.save();

  console.log(`[DOUBLE-ELIMINATION] Created ${createdMatches.length} matches across Winners, Losers, and Grand Finals`);
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
        sport: tournament.sport ? tournament.sport.toLowerCase() : 'cricket',
        sportType: tournament.sport?.toLowerCase() === 'cricket' ? 'cricket' : 'standard',
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
  
  const roundMap = {};
  createdMatches.forEach((m) => {
    const rNum = Math.ceil(m.matchNumber / Math.max(1, Math.floor(numTeams / 2)));
    const rName = `Round ${rNum}`;
    m.round = rName;
    m.roundName = rName;
    if (!roundMap[rName]) roundMap[rName] = 0;
    roundMap[rName]++;
  });

  tournament.brackets = {
    format: 'round-robin',
    totalRounds: Object.keys(roundMap).length,
    matchesPerTeam: numTeams - 1,
    rounds: Object.keys(roundMap).map((name, idx) => ({
      round: idx + 1,
      name,
      matches: roundMap[name]
    }))
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
    if (!match.homeTeam || !match.awayTeam) {
      return null;
    }
    const homeTeam = await Team.findById(match.homeTeam).populate('players.user');
    const awayTeam = await Team.findById(match.awayTeam).populate('players.user');
    if (!homeTeam || !awayTeam) return null;
    
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
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filters
    if (req.query.sport) {
      query.sport = req.query.sport.toLowerCase();
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

    // Visibility and draft filtering
    if (req.user) {
      if (req.query.my === 'true') {
        query.organizer = req.user.id;
      } else if (req.user.role === 'admin') {
        // Admins can see everything
      } else if (!req.query.organizer) {
        // Authenticated users: see public non-draft tournaments OR tournaments they organize
        query.$or = [
          { visibility: 'public', status: { $ne: 'draft' } },
          { organizer: req.user.id }
        ];
      }
    } else {
      // Non-authenticated users: strictly public and published (non-draft)
      query.visibility = 'public';
      if (!query.status) {
        query.status = { $ne: 'draft' };
      }
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'firstName lastName avatar email')
      .populate('registeredTeams.team', 'name logo teamSize')
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
        path: 'registeredTeams.team',
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

    const organizerId = tournament.organizer?._id?.toString() || tournament.organizer?.toString();
    const currentUserId = req.user?.id?.toString() || req.user?._id?.toString();
    const isOrganizer = !!currentUserId && !!organizerId && currentUserId === organizerId;
    const isAdmin = req.user && req.user.role === 'admin';

    // Check if tournament is draft (unpublished)
    if (tournament.status === 'draft' && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'This tournament is currently unpublished in draft mode.'
      });
    }

    // Check if user can view private tournament
    if (tournament.visibility === 'private' && !isOrganizer && !isAdmin) {
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

// @desc    Get tournaments for current user (organized and/or registered)
// @route   GET /api/tournaments/my
// @access  Private
export const getMyTournaments = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    // Find all teams where current user is captain or player
    const userTeams = await Team.find({
      $or: [
        { captain: userId },
        { 'players.user': userId }
      ]
    }).select('_id name shortName logo captain players');

    const userTeamIds = userTeams.map(t => t._id);

    let query = {};
    const { type, role } = req.query;

    if (type === 'registrations' || role === 'player' || role === 'participant') {
      // User specifically requested their tournament registrations
      query = { 'registeredTeams.team': { $in: userTeamIds } };
    } else if (role === 'organizer') {
      // Specifically requested tournaments they organized
      query = { organizer: userId };
    } else {
      // Default: include tournaments they organized OR where their team is registered
      query = {
        $or: [
          { organizer: userId },
          { 'registeredTeams.team': { $in: userTeamIds } }
        ]
      };
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'firstName lastName avatar email')
      .populate({
        path: 'registeredTeams.team',
        select: 'name shortName logo captain players',
        populate: {
          path: 'captain players.user',
          select: 'firstName lastName avatar'
        }
      })
      .sort({ createdAt: -1 });

    const data = tournaments.map(t => {
      const doc = t.toObject ? t.toObject() : t;

      // Find the specific registration subdocument for the user's team
      const myReg = doc.registeredTeams?.find(rt => {
        const teamObj = rt.team;
        if (!teamObj) return false;
        const teamIdStr = (teamObj._id || teamObj).toString();
        const isMyTeam = userTeamIds.some(id => id.toString() === teamIdStr);
        const isCaptain = (teamObj.captain?._id || teamObj.captain)?.toString() === userId.toString();
        const isPlayer = teamObj.players?.some(p => (p.user?._id || p.user)?.toString() === userId.toString());
        return isMyTeam || isCaptain || isPlayer;
      });

      if (myReg) {
        doc.myRegistration = myReg;
        doc.registrationStatus = myReg.status; // 'pending' | 'approved' | 'rejected'
        doc.registeredTeam = myReg.team;

        const teamObj = myReg.team;
        if (teamObj) {
          const isCaptain = (teamObj.captain?._id || teamObj.captain)?.toString() === userId.toString();
          doc.myRole = isCaptain ? `Captain (${teamObj.name})` : `Player (${teamObj.name})`;
        }
      }

      return doc;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data
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

    // Auto-populate valid exhibition/quick match dates if omitted
    if (!req.body.dates || !req.body.dates.registrationStart) {
      req.body.dates = {
        registrationStart: new Date(Date.now() - 3600 * 1000),
        registrationEnd: new Date(Date.now() + 15 * 60 * 1000),
        tournamentStart: new Date(Date.now() + 20 * 60 * 1000),
        tournamentEnd: new Date(Date.now() + 24 * 3600 * 1000)
      };
    }

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

    // Make sure user is tournament organizer or admin
    if (!canModify(tournament, req.user)) {
      return res.status(403).json({
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

    // Log admin action to AuditLog
    if (req.user.role === 'admin') {
      const what = req.body.isVerified !== undefined
        ? (req.body.isVerified ? `Verified tournament "${tournament.name}"` : `Unverified tournament "${tournament.name}"`)
        : `Updated tournament "${tournament.name}"`;

      await logAudit({
        who: req.user._id || req.user.id,
        what,
        target: {
          model: 'Tournament',
          id: tournament._id
        },
        details: req.body
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

    // Make sure user is tournament organizer or admin
    if (!canModify(tournament, req.user)) {
      return res.status(403).json({
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

    if (req.user.role === 'admin') {
      await logAudit({
        who: req.user._id || req.user.id,
        what: `Deleted tournament "${tournament.name}"`,
        target: {
          model: 'Tournament',
          id: tournament._id
        }
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
    if (tournament.status !== 'open' && tournament.registrationStatus !== 'open') {
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

    let team;
    if (req.body.teamId) {
      team = await Team.findById(req.body.teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Selected team not found'
        });
      }
      team.tournament = tournament._id;
      await team.save();
    } else {
      // Create team
      const teamData = {
        ...req.body,
        captain: req.user.id,
        tournament: tournament._id,
        sport: tournament.sport
      };

      team = await Team.create(teamData);
    }

    // Check if this team is already registered
    const isTeamAlreadyRegistered = tournament.registeredTeams.some(
      rt => (rt.team?._id || rt.team)?.toString() === team._id.toString()
    );
    if (isTeamAlreadyRegistered) {
      return res.status(400).json({
        success: false,
        error: 'This team is already registered for this tournament'
      });
    }

    // Determine registration status based on tournament settings
    const registrationStatus = tournament.settings?.requireApproval ? 'pending' : 'approved';

    // Update team status for all players
    if (team.players && team.players.length > 0) {
      const User = (await import('../models/User.js')).default;
      
      for (const player of team.players) {
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
        }
      }
    }

    // Add team to tournament
    tournament.registeredTeams.push({ 
      team: team._id, 
      status: registrationStatus,
      registeredAt: new Date()
    });
    await tournament.save();

    // Notify tournament organizer
    try {
      if (tournament.organizer && tournament.organizer.toString() !== req.user.id.toString()) {
        const notif = await Notification.create({
          recipient: tournament.organizer,
          sender: req.user.id,
          type: 'tournament_registration',
          title: 'New Team Registration',
          message: `${team.name} has registered for ${tournament.name}`,
          data: {
            tournamentId: tournament._id,
            teamId: team._id
          }
        });
        const io = req.app?.get('io');
        if (io) emitNotification(io, tournament.organizer, notif);
      }
    } catch (notifErr) {
      console.warn('Could not send registration notification to organizer:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: registrationStatus === 'approved' 
        ? 'Registration successful! You have joined the tournament.' 
        : 'Registration submitted and pending organizer approval.',
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
      rt => rt.team.toString() !== team._id.toString()
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

    // Make sure user is tournament organizer or admin
    if (!canModify(tournament, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    team.registrationDetails.registrationStatus = 'approved';
    await team.save();

    // Update tournament registeredTeams status
    const rtIndex = tournament.registeredTeams.findIndex(
      rt => (rt.team?._id || rt.team)?.toString() === req.params.teamId.toString()
    );
    if (rtIndex !== -1) {
      tournament.registeredTeams[rtIndex].status = 'approved';
      await tournament.save();
    }

    // Send notification to team captain
    try {
      if (team.captain) {
        const notif = await Notification.create({
          recipient: team.captain,
          sender: req.user.id,
          type: 'tournament_registration',
          title: 'Registration Approved! 🎉',
          message: `Your team "${team.name}" has been approved for "${tournament.name}"!`,
          data: {
            tournamentId: tournament._id,
            teamId: team._id
          }
        });
        const io = req.app?.get('io');
        if (io) emitNotification(io, team.captain, notif);
      }
    } catch (notifErr) {
      console.warn('Could not send approval notification:', notifErr.message);
    }

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

    // Update tournament registeredTeams status
    const rtIndex = tournament.registeredTeams.findIndex(
      rt => (rt.team?._id || rt.team)?.toString() === req.params.teamId.toString()
    );
    if (rtIndex !== -1) {
      tournament.registeredTeams[rtIndex].status = 'rejected';
      await tournament.save();
    }

    // Send notification to team captain
    try {
      if (team.captain) {
        await Notification.create({
          recipient: team.captain,
          sender: req.user.id,
          type: 'tournament_registration',
          title: 'Registration Update',
          message: `Your registration for "${team.name}" in "${tournament.name}" was not accepted.`,
          data: {
            tournamentId: tournament._id,
            teamId: team._id
          }
        });
      }
    } catch (notifErr) {
      console.warn('Could not send rejection notification:', notifErr.message);
    }

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
      .populate({
        path: 'matches',
        populate: { path: 'homeTeam awayTeam', select: 'name logo' }
      });

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
    if (!['open', 'draft', 'ongoing'].includes(tournament.status)) {
      return res.status(400).json({
        success: false,
        error: 'Tournament must be in open or draft status to start'
      });
    }

    // Check minimum teams across both registeredTeams array and Team collection
    const approvedTeamIds = (tournament.registeredTeams || [])
      .filter(rt => rt.status === 'approved')
      .map(rt => rt.team?._id || rt.team);

    const approvedTeams = await Team.countDocuments({
      $or: [
        { _id: { $in: approvedTeamIds } },
        { tournament: tournament._id, 'registrationDetails.registrationStatus': 'approved' }
      ]
    });

    if (approvedTeams < 2) {
      return res.status(400).json({
        success: false,
        error: `At least 2 approved teams required to start tournament (currently approved: ${approvedTeams})`
      });
    }

    // Generate tournament schedule
    const scheduleResult = await generateTournamentSchedule(tournament);

    // Update tournament status
    tournament.status = 'ongoing';
    tournament.registrationStatus = 'closed';
    await tournament.save();

    // Send notifications to all team captains
    try {
      const teams = await Team.find({
        $or: [
          { _id: { $in: approvedTeamIds } },
          { tournament: tournament._id, 'registrationDetails.registrationStatus': 'approved' }
        ]
      }).populate('captain');

      for (const team of teams) {
        if (team.captain?._id || team.captain) {
          await Notification.create({
            recipient: team.captain._id || team.captain,
            type: 'tournament_started',
            title: 'Tournament Started',
            message: `${tournament.name} has started! Check your match schedule.`,
            data: {
              tournamentId: tournament._id,
              teamId: team._id
            }
          });
        }
      }
    } catch (notifErr) {
      console.warn('Could not dispatch tournament started notifications:', notifErr.message);
    }

    // Emit real-time bracket update to viewers
    try {
      const io = req.app.get('io');
      if (io) {
        emitBracketUpdate(io, tournament._id, tournament.brackets || scheduleResult?.bracket);
      }
    } catch (socketErr) {
      console.warn('Could not emit bracket update:', socketErr.message);
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

// Helper function to advance winner into next round or crown champion (Prompt 3.1)
export const advanceTournamentWinner = async (tournament, match, winnerId, io = null) => {
  const isKnockout = tournament?.format === 'single-elimination' ||
                     tournament?.format === 'double-elimination' ||
                     match.nextMatchId !== undefined ||
                     match.round !== undefined;

  // 1. Advance Winner into next match
  if (match.nextMatchId) {
    const slotField = match.nextSlot === 'teamB' ? 'awayTeam' : 'homeTeam';
    const updatedNextMatch = await Match.findByIdAndUpdate(match.nextMatchId, {
      [slotField]: winnerId
    }, { new: true }).populate('homeTeam awayTeam');

    if (io && tournament && updatedNextMatch) {
      const tourneyId = tournament._id || tournament;
      const payload = {
        matchId: updatedNextMatch._id,
        homeTeam: updatedNextMatch.homeTeam,
        awayTeam: updatedNextMatch.awayTeam,
        status: updatedNextMatch.status,
        score: updatedNextMatch.score,
        event: 'Winner advanced to next round'
      };
      io.to(`tournament-${tourneyId}`).emit('match-score-updated', payload);
      io.to(`tournament_${tourneyId}`).emit('match-score-updated', payload);
    }
  } else if (isKnockout && tournament) {
    const tourneyId = tournament._id || tournament;
    await Tournament.findByIdAndUpdate(tourneyId, {
      status: 'completed',
      champion: winnerId
    });
  }

  // 2. Advance Loser into losers bracket (Double Elimination)
  if (match.loserMatchId) {
    const homeTeamId = (match.homeTeam?._id || match.homeTeam)?.toString();
    const awayTeamId = (match.awayTeam?._id || match.awayTeam)?.toString();
    const winnerIdStr = winnerId?.toString();

    let loserId = null;
    if (homeTeamId && homeTeamId === winnerIdStr) {
      loserId = match.awayTeam?._id || match.awayTeam;
    } else if (awayTeamId && awayTeamId === winnerIdStr) {
      loserId = match.homeTeam?._id || match.homeTeam;
    }

    if (loserId) {
      const loserSlotField = match.loserSlot === 'teamB' ? 'awayTeam' : 'homeTeam';
      const updatedLoserMatch = await Match.findByIdAndUpdate(match.loserMatchId, {
        [loserSlotField]: loserId
      }, { new: true }).populate('homeTeam awayTeam');

      if (io && tournament && updatedLoserMatch) {
        const tourneyId = tournament._id || tournament;
        const loserPayload = {
          matchId: updatedLoserMatch._id,
          homeTeam: updatedLoserMatch.homeTeam,
          awayTeam: updatedLoserMatch.awayTeam,
          status: updatedLoserMatch.status,
          score: updatedLoserMatch.score,
          event: 'Loser relegated to losers bracket'
        };
        io.to(`tournament-${tourneyId}`).emit('match-score-updated', loserPayload);
        io.to(`tournament_${tourneyId}`).emit('match-score-updated', loserPayload);
      }
    }
  }

  if (io && tournament) {
    const tourneyId = tournament._id || tournament;
    const updatedTournament = await Tournament.findById(tourneyId);
    emitBracketUpdate(io, tourneyId, updatedTournament?.brackets || {});
  }
};

// @desc    Update match result and advance tournament
// @route   PUT /api/tournaments/:id/matches/:matchId/result
// @access  Private (Organizer or Team Captain)
export const updateMatchResult = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { winner, homeScore, awayScore, details } = req.body;

    const match = await Match.findById(matchId).populate('homeTeam awayTeam tournament');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization
    const tournament = match.tournament;
    const isOrganizer = tournament?.organizer && tournament.organizer.toString() === req.user.id;
    const isTeamCaptain = Boolean(
      (match.homeTeam?.captain && match.homeTeam.captain.toString() === req.user.id) ||
      (match.awayTeam?.captain && match.awayTeam.captain.toString() === req.user.id)
    );
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isTeamCaptain && !isAdmin) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update match result'
      });
    }

    const isKnockout = tournament.format === 'single-elimination' ||
                       tournament.format === 'double-elimination' ||
                       match.nextMatchId !== undefined ||
                       match.round !== undefined;

    const hScore = homeScore !== undefined ? Number(homeScore) : match.score?.home ?? 0;
    const aScore = awayScore !== undefined ? Number(awayScore) : match.score?.away ?? 0;

    // 1. Knockout validation: No ties allowed
    if (isKnockout && hScore === aScore && !winner) {
      return res.status(400).json({
        success: false,
        error: 'A winner must be determined. Knockout matches cannot end in a tie.'
      });
    }

    // Determine winner ID
    let winnerId = null;
    const homeTeamId = match.homeTeam?._id || match.homeTeam;
    const awayTeamId = match.awayTeam?._id || match.awayTeam;

    if (winner === 'home' || winner === 'teamA') {
      winnerId = homeTeamId;
    } else if (winner === 'away' || winner === 'teamB') {
      winnerId = awayTeamId;
    } else if (winner) {
      const winnerStr = winner.toString();
      if (homeTeamId && homeTeamId.toString() === winnerStr) {
        winnerId = homeTeamId;
      } else if (awayTeamId && awayTeamId.toString() === winnerStr) {
        winnerId = awayTeamId;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid winner: specified team does not belong to this match.'
        });
      }
    } else {
      if (hScore > aScore) winnerId = homeTeamId;
      else if (aScore > hScore) winnerId = awayTeamId;
    }

    if (isKnockout && !winnerId) {
      return res.status(400).json({
        success: false,
        error: 'A valid winner must be specified for a knockout match.'
      });
    }

    // 2. Edit Protection Check
    const isAlreadyCompleted = match.status === 'completed';
    const previousWinnerId = match.result?.winner ? match.result.winner.toString() : null;
    const winnerChanged = isAlreadyCompleted && previousWinnerId && previousWinnerId !== winnerId.toString();

    if (winnerChanged && match.nextMatchId) {
      const nextMatch = await Match.findById(match.nextMatchId);
      if (nextMatch) {
        const nextStarted = nextMatch.status === 'live' ||
                            nextMatch.status === 'completed' ||
                            (nextMatch.score && (nextMatch.score.home > 0 || nextMatch.score.away > 0));
        if (nextStarted) {
          return res.status(400).json({
            success: false,
            error: 'Cannot edit match result: the next round match has already started or completed.'
          });
        }
      }
    }

    // 3. Update current match result & score
    match.result = {
      winner: winnerId,
      homeScore: hScore,
      awayScore: aScore,
      isDraw: false,
      details
    };
    match.score = {
      home: hScore,
      away: aScore
    };
    match.status = 'completed';
    await match.save();

    // 4. Automated Progression (Winners & Losers brackets)
    const ioInstance = req.app.get('io');
    await advanceTournamentWinner(tournament, match, winnerId, ioInstance);

    // Update round-robin standings if applicable
    if (tournament.format === 'round-robin') {
      await updateRoundRobinStandings(tournament._id, match);
    }

    // Update scorecard status if exists
    if (match.scorecard) {
      await Scorecard.findByIdAndUpdate(match.scorecard, {
        status: 'completed',
        'result.winner': winnerId,
        'result.homeScore': hScore,
        'result.awayScore': aScore
      });
    }

    // Emit live events
    const io = req.app.get('io');
    if (io) {
      emitScoreUpdate(io, match._id, tournament._id, match.score.home, match.score.away, 'Match completed');
      const updatedTournament = await Tournament.findById(tournament._id);
      emitBracketUpdate(io, tournament._id, updatedTournament?.brackets || {});
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match score (live)
// @route   PUT /api/tournaments/:id/matches/:matchId/score
// @access  Private (Organizer or Team Captain)
export const updateMatchScore = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { homeScore, awayScore, status, event } = req.body;

    const match = await Match.findById(matchId).populate('homeTeam awayTeam tournament');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check authorization
    const tournament = match.tournament;
    const isOrganizer = tournament?.organizer && tournament.organizer.toString() === req.user.id;
    const isTeamCaptain = Boolean(
      (match.homeTeam?.captain && match.homeTeam.captain.toString() === req.user.id) ||
      (match.awayTeam?.captain && match.awayTeam.captain.toString() === req.user.id)
    );

    if (!isOrganizer && !isTeamCaptain) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update match score'
      });
    }

    // Update match score
    if (homeScore !== undefined) match.score.home = homeScore;
    if (awayScore !== undefined) match.score.away = awayScore;
    if (status !== undefined) match.status = status;
    
    await match.save();

    // Emit live Socket.io event
    const io = req.app.get('io');
    if (io) {
      emitScoreUpdate(io, match._id, tournament._id, match.score.home, match.score.away, event || 'Score updated');
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
    if (!tournament) return;
    const allMatches = await Match.find({ tournament: tournamentId });
    if (!allMatches || allMatches.length === 0) return;

    // Group matches by round name
    const roundsMap = {};
    allMatches.forEach(m => {
      const r = m.round || 'Round 1';
      if (!roundsMap[r]) roundsMap[r] = [];
      roundsMap[r].push(m);
    });

    for (const [roundName, roundMatches] of Object.entries(roundsMap)) {
      const allCompleted = roundMatches.every(m => m.status === 'completed');
      if (allCompleted && roundMatches.length > 0) {
        await advanceToNextRound(tournament, roundMatches, allMatches, roundName);
      }
    }
  } catch (error) {
    console.error('[TOURNAMENT] Error advancing tournament:', error);
  }
};

// Helper function to advance to next round with bracket slot population
const advanceToNextRound = async (tournament, completedMatches, allMatches, currentRoundName) => {
  try {
    console.log(`[TOURNAMENT] Advancing ${tournament.name} from completed round: ${currentRoundName}`);
    
    // Extract winners from completed matches
    const winners = completedMatches.map(match => {
      if (match.result && match.result.winner === 'away') {
        return match.awayTeam;
      }
      return match.homeTeam;
    }).filter(Boolean);

    // If only one match in this round and it's a final, mark tournament as completed
    if (completedMatches.length === 1 && currentRoundName.toLowerCase().includes('final')) {
      tournament.status = 'completed';
      if (winners.length > 0) {
        tournament.winner = winners[0];
      }
      await tournament.save();
      console.log(`[TOURNAMENT] Tournament ${tournament.name} concluded with winner:`, tournament.winner);
      return;
    }

    // Find subsequent matches that have unassigned homeTeam or awayTeam
    const subsequentMatches = allMatches.filter(m => m.round !== currentRoundName && (!m.homeTeam || !m.awayTeam));
    
    for (let i = 0; i < winners.length; i += 2) {
      const nextMatch = subsequentMatches[Math.floor(i / 2)];
      if (nextMatch) {
        let changed = false;
        if (!nextMatch.homeTeam && winners[i]) {
          nextMatch.homeTeam = winners[i];
          changed = true;
        }
        if (!nextMatch.awayTeam && winners[i + 1]) {
          nextMatch.awayTeam = winners[i + 1];
          changed = true;
        }
        if (changed) {
          await nextMatch.save();
          console.log(`[TOURNAMENT] Seeded winner into next match ${nextMatch._id} (${nextMatch.round})`);
        }
      }
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
      query.status = { $ne: 'draft' };
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

// @desc    Update cricket match ball-by-ball score
// @route   PUT /api/tournaments/:id/matches/:matchId/cricket-ball
// @access  Protected
export const updateCricketBall = async (req, res, next) => {
  try {
    const { id, matchId } = req.params;
    const { action } = req.body;
    
    // Find tournament and match
    const tournament = await Tournament.findById(id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    
    const match = await Match.findById(matchId).populate('homeTeam awayTeam tournament');
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

    // Authorization check
    const isOrganizer = tournament?.organizer && tournament.organizer.toString() === req.user.id;
    const isTeamCaptain = Boolean(
      (match.homeTeam?.captain && match.homeTeam.captain.toString() === req.user.id) ||
      (match.awayTeam?.captain && match.awayTeam.captain.toString() === req.user.id)
    );
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isTeamCaptain && !isAdmin) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update match score'
      });
    }
    
    // Initialize cricketData if not exists
    if (!match.cricketData || !match.cricketData.innings || match.cricketData.innings.length === 0) {
      match.cricketData = createInitialCricketState(
        match.homeTeam?._id || match.homeTeam,
        match.awayTeam?._id || match.awayTeam,
        match.cricketData?.maxOvers || 20,
        match.cricketData?.maxWickets || 10
      );
      match.sportType = 'cricket';
    }

    // Ensure status is live if scheduled
    if (match.status === 'scheduled') {
      match.status = 'live';
    }

    const homeName = match.homeTeam?.name || 'Home Team';
    const awayName = match.awayTeam?.name || 'Away Team';
    const wasCompleted = match.status === 'completed';

    // Apply delivery or action via pure cricket scoring engine
    const updatedCricketState = applyDelivery(match.cricketData, req.body, { home: homeName, away: awayName });
    match.cricketData = updatedCricketState;

    // Synchronize standard scores
    match.score.home = updatedCricketState.innings[0]?.runs || 0;
    match.score.away = updatedCricketState.innings[1]?.runs || 0;

    const io = req.app.get('io');

    // If action was undo and match was previously completed but is no longer completed
    if (action === 'undo' && wasCompleted && !updatedCricketState.isCompleted) {
      match.status = 'live';
      match.result = {
        winner: null,
        homeScore: match.score.home,
        awayScore: match.score.away,
        isDraw: false,
        details: null
      };
    }

    // If match is now completed (target reached, all out, or overs finished in Innings 2)
    if (updatedCricketState.isCompleted) {
      match.status = 'completed';
      const winnerId = updatedCricketState.winner;
      match.result = {
        winner: winnerId,
        homeScore: match.score.home,
        awayScore: match.score.away,
        isDraw: updatedCricketState.winner === null,
        details: updatedCricketState.resultText
      };

      // Trigger Prompt 3.1 automated winner progression
      if (winnerId) {
        await advanceTournamentWinner(tournament, match, winnerId, io);
      }
    }
    
    await match.save();
    
    // Emit socket events
    if (io) {
      const liveCricketPayload = {
        matchId: match._id,
        score: match.score,
        cricketData: match.cricketData,
        status: match.status,
        resultText: match.cricketData.resultText,
        winner: match.cricketData.winner
      };
      io.to(`tournament_${id}`).emit('match-score-updated', liveCricketPayload);
      io.to(`tournament-${id}`).emit('match-score-updated', liveCricketPayload);
      emitScoreUpdate(io, match._id, tournament._id, match.score.home, match.score.away, match.cricketData.resultText || 'Cricket delivery scored', {
        cricketData: match.cricketData,
        status: match.status,
        resultText: match.cricketData.resultText,
        winner: match.cricketData.winner
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

// @desc    Update points-based sport match score (Badminton, Volleyball, etc.)
// @route   PUT /api/tournaments/:id/matches/:matchId/points-score
// @access  Protected
export const updatePointsScore = async (req, res, next) => {
  try {
    const { id, matchId } = req.params;
    const { action, sport, config } = req.body;

    const tournament = await Tournament.findById(id);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });

    const match = await Match.findById(matchId).populate('homeTeam awayTeam tournament');
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

    // Authorization check
    const isOrganizer = tournament?.organizer && tournament.organizer.toString() === req.user.id;
    const isTeamCaptain = Boolean(
      (match.homeTeam?.captain && match.homeTeam.captain.toString() === req.user.id) ||
      (match.awayTeam?.captain && match.awayTeam.captain.toString() === req.user.id)
    );
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isTeamCaptain && !isAdmin) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update match score'
      });
    }

    // Determine sport from tournament, match, or request
    const sportType = sport || match.setsData?.sport || tournament.sport || 'badminton';

    // Initialize setsData if not present
    if (!match.setsData || !match.setsData.sets || match.setsData.sets.length === 0) {
      match.setsData = createInitialPointsState(
        sportType,
        match.homeTeam?._id || match.homeTeam,
        match.awayTeam?._id || match.awayTeam,
        config || match.setsData?.config
      );
      match.sportType = 'points';
    } else {
      if (!match.setsData.homeTeam && match.homeTeam) {
        match.setsData.homeTeam = match.homeTeam._id || match.homeTeam;
      }
      if (!match.setsData.awayTeam && match.awayTeam) {
        match.setsData.awayTeam = match.awayTeam._id || match.awayTeam;
      }
    }

    // Ensure status is live if scheduled
    if (match.status === 'scheduled') {
      match.status = 'live';
    }

    const homeName = match.homeTeam?.name || 'Home Team';
    const awayName = match.awayTeam?.name || 'Away Team';
    const wasCompleted = match.status === 'completed';

    // Apply point / action via pure points scoring engine
    const updatedPointsState = applyPoint(match.setsData, req.body, { home: homeName, away: awayName });
    match.setsData = updatedPointsState;

    // Update overall score with sets won
    match.score.home = updatedPointsState.homeSetsWon;
    match.score.away = updatedPointsState.awaySetsWon;

    const io = req.app.get('io');

    // If action was undo and match was completed but is no longer completed
    if (action === 'undo' && wasCompleted && !updatedPointsState.isCompleted) {
      match.status = 'live';
      match.result = {
        winner: null,
        homeScore: match.score.home,
        awayScore: match.score.away,
        isDraw: false,
        details: null
      };
    }

    // If match is completed
    if (updatedPointsState.isCompleted) {
      match.status = 'completed';
      let winnerId = null;
      if (updatedPointsState.winner === 'home') {
        winnerId = match.homeTeam?._id || match.homeTeam;
      } else if (updatedPointsState.winner === 'away') {
        winnerId = match.awayTeam?._id || match.awayTeam;
      } else if (updatedPointsState.winner) {
        winnerId = updatedPointsState.winner;
      }

      match.setsData.winner = winnerId;
      match.result = {
        winner: winnerId,
        homeScore: match.score.home,
        awayScore: match.score.away,
        isDraw: false,
        details: updatedPointsState.resultText
      };

      // Trigger Prompt 3.1 winner progression
      if (winnerId) {
        await advanceTournamentWinner(tournament, match, winnerId, io);
      }
    }

    await match.save();

    // Emit live events
    if (io) {
      const livePointsPayload = {
        matchId: match._id,
        score: match.score,
        setsData: match.setsData,
        status: match.status,
        resultText: match.setsData.resultText,
        winner: match.setsData.winner
      };
      io.to(`tournament_${id}`).emit('match-score-updated', livePointsPayload);
      io.to(`tournament-${id}`).emit('match-score-updated', livePointsPayload);
      emitScoreUpdate(io, match._id, tournament._id, match.score.home, match.score.away, match.setsData.resultText || 'Points updated', {
        setsData: match.setsData,
        status: match.status,
        resultText: match.setsData.resultText,
        winner: match.setsData.winner
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

// @desc    Broadcast announcement to all team captains in a tournament
// @route   POST /api/tournaments/:id/broadcast
// @access  Protected (Organizer only)
export const broadcastTournamentMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, title, priority = 'high' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Broadcast message content is required'
      });
    }

    const tournament = await Tournament.findById(id).populate('registeredTeams.team');
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Authorization: owner (organizer) or platform admin
    const userId = (req.user._id || req.user.id).toString();
    const isOrganizer = tournament.organizer && tournament.organizer.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only tournament organizer or platform administrators can broadcast messages'
      });
    }

    // Collect captains of approved and pending teams
    const eligibleRegistrations = (tournament.registeredTeams || []).filter(
      (rt) => rt && (rt.status === 'approved' || rt.status === 'pending')
    );

    const captainIds = [];
    for (const reg of eligibleRegistrations) {
      let teamDoc = reg.team;
      if (!teamDoc || !teamDoc.captain) {
        teamDoc = await Team.findById(reg.team?._id || reg.team).select('captain name');
      }
      if (teamDoc && teamDoc.captain) {
        const capIdStr = (teamDoc.captain._id || teamDoc.captain).toString();
        if (!captainIds.includes(capIdStr)) {
          captainIds.push(capIdStr);
        }
      }
    }

    const broadcastTitle = (title && title.trim()) || `Broadcast: ${tournament.name}`;
    const broadcastText = message.trim();
    const io = req.app.get('io');

    // Create notifications for all unique captains
    const createdNotifications = [];
    for (const captainId of captainIds) {
      const notification = await Notification.create({
        recipient: captainId,
        sender: req.user._id || req.user.id,
        type: 'tournament_broadcast',
        title: broadcastTitle,
        message: broadcastText,
        data: {
          tournamentId: tournament._id,
          url: `/tournaments/${tournament._id}`
        },
        priority: priority === 'urgent' ? 'urgent' : priority === 'medium' ? 'medium' : 'high'
      });
      createdNotifications.push(notification);

      if (io) {
        emitNotification(io, captainId, notification);
      }
    }

    // Persist broadcast in Message collection as an announcement
    const savedMessage = await Message.create({
      roomType: 'tournament',
      roomId: tournament._id,
      sender: req.user._id || req.user.id,
      text: broadcastText,
      isAnnouncement: true
    });
    await savedMessage.populate('sender', 'firstName lastName avatar');

    // Emit live broadcast event to the tournament room
    if (io) {
      const broadcastPayload = {
        _id: savedMessage._id,
        tournamentId: tournament._id,
        tournamentName: tournament.name,
        title: broadcastTitle,
        message: broadcastText,
        priority,
        sender: {
          _id: req.user._id || req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          avatar: req.user.avatar
        },
        recipientsCount: captainIds.length,
        createdAt: savedMessage.createdAt
      };
      io.to(`tournament-${tournament._id}`).emit('tournament:broadcast', broadcastPayload);
      io.to(`tournament_${tournament._id}`).emit('tournament:broadcast', broadcastPayload);
      io.to(`tournament_${tournament._id}`).emit('new_message', savedMessage);
    }

    res.status(201).json({
      success: true,
      message: `Broadcast successfully sent to ${captainIds.length} team captains`,
      data: {
        _id: savedMessage._id,
        tournamentId: tournament._id,
        title: broadcastTitle,
        text: broadcastText,
        recipientsCount: captainIds.length,
        createdAt: savedMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error broadcasting tournament message:', error);
    next(error);
  }
};

// @desc    Get sent broadcasts for a tournament
// @route   GET /api/tournaments/:id/broadcasts
// @access  Protected
export const getTournamentBroadcasts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const broadcasts = await Message.find({
      roomType: 'tournament',
      roomId: tournament._id,
      isAnnouncement: true
    })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: broadcasts.length,
      data: broadcasts
    });
  } catch (error) {
    console.error('Error fetching tournament broadcasts:', error);
    next(error);
  }
};

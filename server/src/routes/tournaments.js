import express from 'express';
import { body } from 'express-validator';
import {
  getTournaments,
  getTournament,
  getMyTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  registerTeamForTournament,
  unregisterTeamFromTournament,
  approveTournamentRegistration,
  rejectTournamentRegistration,
  getTournamentBracket,
  updateTournamentBracket,
  getTournamentStandings,
  getTournamentMatches,
  getTournamentSchedule,
  startTournament,
  updateMatchResult,
  updateMatchScore,
  updateCricketBall,
  updatePointsScore,
  searchTournaments,
  broadcastTournamentMessage,
  getTournamentBroadcasts
} from '../controllers/tournaments.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { tournamentBroadcastLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Tournament validation rules
const tournamentValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('sport')
    .isIn(['football', 'basketball', 'cricket', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'chess', 'other'])
    .withMessage('Invalid sport selection'),
  body('format')
    .isIn(['single-elimination', 'double-elimination', 'round-robin', 'swiss', 'league'])
    .withMessage('Invalid tournament format'),
  body('maxTeams')
    .isInt({ min: 2, max: 64 })
    .withMessage('Maximum teams must be between 2 and 64'),
  body('dates.registrationStart')
    .optional()
    .isISO8601()
    .withMessage('Invalid registration start date'),
  body('dates.registrationEnd')
    .optional()
    .isISO8601()
    .withMessage('Invalid registration end date'),
  body('dates.tournamentStart')
    .optional()
    .isISO8601()
    .withMessage('Invalid tournament start date'),
  body('dates.tournamentEnd')
    .optional()
    .isISO8601()
    .withMessage('Invalid tournament end date')
];

// Public routes (with optional auth to identify logged in organizer/user)
router.get('/', optionalAuth, getTournaments);
router.get('/search', optionalAuth, searchTournaments);
router.get('/my', protect, getMyTournaments);
router.get('/:id', optionalAuth, getTournament);
router.get('/:id/bracket', optionalAuth, getTournamentBracket);
router.get('/:id/standings', optionalAuth, getTournamentStandings);
router.get('/:id/matches', optionalAuth, getTournamentMatches);
router.get('/:id/schedule', optionalAuth, getTournamentSchedule);

// Protected routes
router.post('/', protect, tournamentValidation, createTournament);
router.put('/:id', protect, updateTournament);
router.delete('/:id', protect, deleteTournament);

// Tournament management routes
router.post('/:id/start', protect, startTournament);
router.put('/:id/matches/:matchId/result', protect, updateMatchResult);
router.put('/:id/matches/:matchId/score', protect, updateMatchScore);
router.put('/:id/matches/:matchId/cricket-ball', protect, updateCricketBall);
router.put('/:id/matches/:matchId/points-score', protect, updatePointsScore);

// Team registration routes
router.post('/:id/register', protect, registerTeamForTournament);
router.delete('/:id/unregister', protect, unregisterTeamFromTournament);

// Organizer management routes
router.put('/:id/registrations/:teamId/approve', protect, approveTournamentRegistration);
router.put('/:id/registrations/:teamId/reject', protect, rejectTournamentRegistration);
router.put('/:id/bracket', protect, updateTournamentBracket);

// Tournament communication & broadcast routes
router.post('/:id/broadcast', protect, tournamentBroadcastLimiter, broadcastTournamentMessage);
router.get('/:id/broadcasts', protect, getTournamentBroadcasts);
router.get('/:id/broadcast', protect, getTournamentBroadcasts);

export default router;

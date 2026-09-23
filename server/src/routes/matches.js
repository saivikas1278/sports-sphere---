import express from 'express';
import { body } from 'express-validator';
import {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  updateMatchScore,
  updateMatchResult,
  addMatchEvent,
  startMatch,
  endMatch,
  getLiveMatches,
  getUpcomingMatches,
  getMatchStats,
  updateMatchPlayerStats
} from '../controllers/matches.js';
import { protect, authorize, optional } from '../middleware/auth.js';

const router = express.Router();

// Match validation rules
const matchValidation = [
  body('homeTeam').isMongoId().withMessage('Invalid home team ID'),
  body('awayTeam').isMongoId().withMessage('Invalid away team ID'),
  body('tournament').isMongoId().withMessage('Invalid tournament ID'),
  body('scheduledTime').isISO8601().withMessage('Invalid scheduled time'),
  body('round').notEmpty().withMessage('Round is required')
];

const scoreUpdateValidation = [
  body('homeScore').isInt({ min: 0 }).withMessage('Home score must be a non-negative integer'),
  body('awayScore').isInt({ min: 0 }).withMessage('Away score must be a non-negative integer')
];

const eventValidation = [
  body('type').isIn(['goal', 'point', 'card', 'substitution', 'timeout', 'injury', 'foul', 'other']).withMessage('Invalid event type'),
  body('team').isMongoId().withMessage('Invalid team ID'),
  body('description').notEmpty().withMessage('Event description is required')
];

// Public routes
router.get('/', optional, getMatches);
router.get('/live', getLiveMatches);
router.get('/upcoming', getUpcomingMatches);
router.get('/:id', optional, getMatch);
router.get('/:id/stats', getMatchStats);

// Protected routes (Organizer only)
router.post('/', protect, authorize('organizer'), matchValidation, createMatch);
router.put('/:id', protect, authorize('organizer'), updateMatch);
router.delete('/:id', protect, authorize('organizer'), deleteMatch);

// Match management routes (accessible to organizers and team members)
router.patch('/:id/score', protect, updateMatchScore);
router.patch('/:id/player-stats', protect, updateMatchPlayerStats);
router.patch('/:id/result', protect, updateMatchResult);
router.post('/:id/events', protect, eventValidation, addMatchEvent);
router.patch('/:id/start', protect, startMatch);
router.put('/:id/end', protect, authorize('organizer'), endMatch);

export default router;

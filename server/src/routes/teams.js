import express from 'express';
import { body } from 'express-validator';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
  getTeamStats,
  getTeamMatches,
  sendTeamInvitation,
  respondToInvitation,
  updatePlayerRole,
  getMyInvitations
} from '../controllers/teams.js';
import { protect, authorize, optional } from '../middleware/auth.js';

const router = express.Router();

// Team validation rules
const teamValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters'),
  body('tournament')
    .isMongoId()
    .withMessage('Invalid tournament ID'),
  body('sport')
    .isIn(['football', 'basketball', 'cricket', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'chess', 'other'])
    .withMessage('Invalid sport selection')
];

const playerValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['captain', 'player', 'substitute', 'coach']).withMessage('Invalid role'),
  body('jerseyNumber').optional().isInt({ min: 1, max: 99 }).withMessage('Jersey number must be between 1 and 99'),
  body('position').optional().isString().withMessage('Position must be a string')
];

const inviteValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['captain', 'player', 'substitute', 'coach']).withMessage('Invalid role')
];

const roleValidation = [
  body('role').isIn(['captain', 'player', 'substitute', 'coach']).withMessage('Invalid role')
];


// Protected special routes (Must be before /:id)
router.get('/invitations', protect, getMyInvitations);

// Public routes
router.get('/', optional, getTeams);
router.get('/:id', optional, getTeam);
router.get('/:id/stats', getTeamStats);
router.get('/:id/matches', getTeamMatches);

// Protected routes
router.post('/', protect, teamValidation, createTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);

// Team management routes
router.post('/:id/players', protect, playerValidation, addPlayerToTeam);
router.delete('/:id/players/:userId', protect, removePlayerFromTeam);
router.put('/:id/players/:userId/role', protect, roleValidation, updatePlayerRole);

// Invitations
router.post('/:id/invitations', protect, inviteValidation, sendTeamInvitation);
router.put('/:id/invitations/:inviteId', protect, respondToInvitation);

export default router;

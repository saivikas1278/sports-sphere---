import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import {
  getFitnessContent,
  getFitnessContentById,
  createFitnessContent,
  updateFitnessContent,
  deleteFitnessContent,
  rateFitnessContent,
  bookmarkFitnessContent,
  trackProgress,
  getUserProgress,
  searchFitnessContent,
  getFeaturedContent,
  getContentByCategory,
  getUserStats
} from '../controllers/fitness.js';
import { protect, authorize, optional } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'), false);
    }
  }
});

// Fitness content validation rules
const fitnessContentValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['strength', 'cardio', 'flexibility', 'yoga', 'pilates', 'meditation', 'dance', 'martial-arts', 'sports-specific', 'rehabilitation'])
    .withMessage('Invalid category'),
  body('type')
    .isIn(['video', 'article', 'workout-plan', 'challenge'])
    .withMessage('Invalid content type'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number')
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Review cannot exceed 500 characters')
];

const progressValidation = [
  body('progress')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('timeSpent')
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Public routes
router.get('/', optional, getFitnessContent);
router.get('/featured', getFeaturedContent);
router.get('/category/:category', getContentByCategory);
router.get('/search', searchFitnessContent);
router.get('/:id', optional, getFitnessContentById);

// Protected routes
router.post('/', protect, authorize('organizer'), upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), fitnessContentValidation, createFitnessContent);

router.put('/:id', protect, authorize('organizer'), updateFitnessContent);
router.delete('/:id', protect, authorize('organizer'), deleteFitnessContent);

// User interaction routes
router.post('/:id/rate', protect, ratingValidation, rateFitnessContent);
router.post('/:id/bookmark', protect, bookmarkFitnessContent);
router.post('/:id/progress', protect, progressValidation, trackProgress);
router.get('/:id/progress', protect, getUserProgress);
router.get('/stats', protect, getUserStats);

export default router;

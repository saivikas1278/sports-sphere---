import express from 'express';
import { getPlatformSettings, updatePlatformSettings } from '../controllers/adminSettings.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPlatformSettings);
router.put('/', protect, authorize('admin'), updatePlatformSettings);

export default router;

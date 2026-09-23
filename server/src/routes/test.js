import express from 'express';
import { protect } from '../middleware/auth.js';
import { uploadImage, uploadVideo } from '../utils/uploadUtils.js';
import { getCloudinaryTimestamp } from '../utils/timeSync.js';

const router = express.Router();

// @desc    Test image upload
// @route   POST /api/test/upload-image
// @access  Private
router.post('/upload-image', protect, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('[TEST] Testing image upload...');
    const result = await uploadImage(req.files.image.tempFilePath);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        timestamp: Math.round(Date.now() / 1000)
      }
    });
  } catch (error) {
    console.error('[TEST] Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Test server timestamp
// @route   GET /api/test/timestamp
// @access  Public
router.get('/timestamp', async (req, res) => {
  try {
    const serverTime = new Date();
    const localTimestamp = Math.round(Date.now() / 1000);
    const cloudinaryTimestamp = await getCloudinaryTimestamp();
    
    res.json({
      success: true,
      data: {
        serverTime: serverTime.toISOString(),
        localTimestamp: localTimestamp,
        cloudinaryTimestamp: cloudinaryTimestamp,
        timezoneOffset: serverTime.getTimezoneOffset(),
        cloudinaryTime: new Date(cloudinaryTimestamp * 1000).toISOString(),
        timeDifference: {
          localVsCloudinary: localTimestamp - cloudinaryTimestamp
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get timestamp information',
      error: error.message
    });
  }
});

export default router;

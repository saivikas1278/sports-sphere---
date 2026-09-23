import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { getCloudinaryTimestamp, isValidTimestamp } from './timeSync.js';

/**
 * Upload file to Cloudinary with proper error handling and timestamp management
 * @param {string} filePath - Local file path
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get a synchronized timestamp from the real internet time
    const currentTimestamp = await getCloudinaryTimestamp();

    // Default options with synchronized timestamp
    const defaultOptions = {
      timestamp: currentTimestamp,
      quality: 'auto:good',
      fetch_format: 'auto'
    };

    // Merge options
    const uploadOptions = {
      ...defaultOptions,
      ...options
    };

    console.log('[uploadToCloudinary] Uploading with options:', uploadOptions);

    // Perform upload with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          uploadOptions.timestamp = await getCloudinaryTimestamp();
        }
        
        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        
        console.log('[uploadToCloudinary] Upload successful:', {
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: result.resource_type
        });

        return result;
      } catch (error) {
        retryCount++;
        console.error(`[uploadToCloudinary] Attempt ${retryCount} failed:`, error.message);
        
        if (error.message.includes('Stale request') && retryCount < maxRetries) {
          console.log('[uploadToCloudinary] Retrying with fresh timestamp...');
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // If it's not a stale request error or we've exhausted retries, throw the error
        throw error;
      }
    }
  } catch (error) {
    console.error('[uploadToCloudinary] Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Upload image to Cloudinary with optimized settings
 * @param {string} filePath - Local file path
 * @param {object} options - Additional options
 * @returns {Promise<object>} Upload result
 */
export const uploadImage = async (filePath, options = {}) => {
  const imageOptions = {
    resource_type: 'image',
    folder: 'sportsphere/posts/images',
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  };

  return uploadToCloudinary(filePath, imageOptions);
};

/**
 * Upload video to Cloudinary with optimized settings
 * @param {string} filePath - Local file path
 * @param {object} options - Additional options
 * @returns {Promise<object>} Upload result
 */
export const uploadVideo = async (filePath, options = {}) => {
  const videoOptions = {
    resource_type: 'video',
    folder: 'sportsphere/posts/videos',
    quality: 'auto:good',
    ...options
  };

  return uploadToCloudinary(filePath, videoOptions);
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type ('image' or 'video')
 * @returns {Promise<object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    console.log('[deleteFromCloudinary] Deletion result:', result);
    return result;
  } catch (error) {
    console.error('[deleteFromCloudinary] Deletion failed:', error);
    throw new Error(`Deletion failed: ${error.message}`);
  }
};

/**
 * Generate video thumbnail
 * @param {string} videoUrl - Video URL
 * @returns {string} Thumbnail URL
 */
export const generateVideoThumbnail = (videoUrl) => {
  try {
    // Extract public ID from video URL
    const urlParts = videoUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split('.')[0];
    
    // Generate thumbnail URL
    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 640, height: 360, crop: 'fill', quality: 'auto:good' }
      ]
    });
    
    return thumbnailUrl;
  } catch (error) {
    console.error('[generateVideoThumbnail] Failed to generate thumbnail:', error);
    return null;
  }
};

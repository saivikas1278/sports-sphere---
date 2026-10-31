import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standardize uploads directory relative to the server package root (server/uploads)
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload file locally (replacing Cloudinary)
 * @param {string} filePath - Local temporary file path
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with local URL
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Attempt to extract extension from mimetype or original filename if possible, otherwise fallback to .jpg or .mp4
    let ext = path.extname(filePath);
    if (!ext) {
      ext = options.resource_type === 'video' ? '.mp4' : '.jpg';
    }

    const filename = `${options.resource_type || 'file'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    const destination = path.join(uploadsDir, filename);

    // Copy file to local static directory
    fs.copyFileSync(filePath, destination);
    
    console.log(`[uploadUtils] File saved locally at: ${destination}`);

    const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';

    // Return mock Cloudinary response object with absolute local URL
    return {
      public_id: filename,
      secure_url: `${baseUrl}/uploads/${filename}`,
      resource_type: options.resource_type || 'image',
      duration: 0 // Dummy value for videos
    };
  } catch (error) {
    console.error('[uploadUtils] Local upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export const uploadImage = async (filePath, options = {}) => {
  return uploadToCloudinary(filePath, { ...options, resource_type: 'image' });
};

export const uploadVideo = async (filePath, options = {}) => {
  return uploadToCloudinary(filePath, { ...options, resource_type: 'video' });
};

/**
 * Delete file locally
 * @param {string} publicId - Local filename or URL
 * @returns {Promise<object>} Result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const filename = path.basename(publicId);
    const targetFile = path.join(uploadsDir, filename);
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
      console.log(`[uploadUtils] File removed locally: ${targetFile}`);
    }
    return { result: 'ok' };
  } catch (error) {
    console.error('[uploadUtils] Local deletion failed:', error);
    return { result: 'error', error: error.message };
  }
};

export default {
  uploadToCloudinary,
  uploadImage,
  uploadVideo,
  deleteFromCloudinary
};

import fs from 'fs';
import path from 'path';

// Resolve uploads directory dynamically relative to project root
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

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

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const filePath = path.join(uploadsDir, publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[uploadUtils] File deleted locally: ${filePath}`);
    }
    return { result: 'ok' };
  } catch (error) {
    console.error('[uploadUtils] Deletion failed:', error);
    throw new Error(`Deletion failed: ${error.message}`);
  }
};

export const generateVideoThumbnail = (videoUrl) => {
  // Return a generic fallback image or just return the video URL itself
  // Without FFMPEG locally, we cannot easily generate true thumbnails.
  return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800';
};

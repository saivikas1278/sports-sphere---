import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FaVideo, FaImage, FaTimes, FaTag, FaMapMarkerAlt } from 'react-icons/fa';
import { showToast } from '../../utils/toast';

const VideoUploadForm = ({ onSuccess }) => {
  const { user } = useSelector(state => state.auth);
  const [isExpanded, setIsExpanded] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        showToast('Please select a valid video file', 'error');
        return;
      }
      
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        showToast('Video size should be less than 100MB', 'error');
        return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setIsExpanded(true);
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      showToast('Please select a video to upload', 'error');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // In a real app, you would upload the files to a server/cloud storage
      // and save the post data to your database
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
      
      // Mock successful upload with a new post object
      const newPost = {
        id: Date.now().toString(),
        user: {
          id: user.id,
          name: user.fullName,
          avatar: user.avatar || '/assets/avatars/default.jpg'
        },
        videoUrl: videoPreview, // In a real app, this would be the URL from cloud storage
        thumbnailUrl: thumbnailPreview || '', // In a real app, this would be the URL from cloud storage
        caption,
        location,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString()
      };
      
      showToast('Video posted successfully!', 'success');
      
      // Reset form
      setCaption('');
      setLocation('');
      setTags('');
      clearVideo();
      clearThumbnail();
      setIsExpanded(false);
      
      // Notify parent component
      if (onSuccess) {
        onSuccess(newPost);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      showToast('Failed to upload video. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 md:mb-6 transition-all duration-300">
      <div className="p-4">
        <div className="flex space-x-3">
          <img 
            src={user?.avatar || '/assets/avatars/default.jpg'} 
            alt={user?.fullName || 'User'} 
            className="w-10 h-10 rounded-full object-cover border-2 border-primary-100"
          />
          
          {!isExpanded ? (
            <div 
              className="flex-grow bg-gray-100 rounded-full px-4 py-2 flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setIsExpanded(true)}
            >
              <span className="text-gray-500">Share a video from your sports journey...</span>
            </div>
          ) : (
            <div className="flex-grow">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Share something about this video..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[80px] resize-none"
              />
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Video preview */}
            {videoPreview && (
              <div className="relative">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={videoPreview} 
                    className="w-full h-full object-contain" 
                    controls
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <button 
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100"
                  onClick={clearVideo}
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {/* Thumbnail preview */}
            {thumbnailPreview && (
              <div className="relative inline-block">
                <img 
                  src={thumbnailPreview} 
                  alt="Thumbnail" 
                  className="h-12 md:h-20 rounded-lg border border-gray-200" 
                />
                <button 
                  className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100"
                  onClick={clearThumbnail}
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}
            
            {/* Additional fields */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <FaMapMarkerAlt className="text-gray-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="bg-transparent focus:outline-none text-sm w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <FaTag className="text-gray-500" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Add tags (comma separated)"
                  className="bg-transparent focus:outline-none text-sm w-full"
                />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex space-x-2">
                {!videoFile && (
                  <button 
                    type="button"
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => videoInputRef.current.click()}
                  >
                    <FaVideo />
                    <span>Video</span>
                  </button>
                )}
                
                <button 
                  type="button"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => thumbnailInputRef.current.click()}
                >
                  <FaImage />
                  <span>Thumbnail</span>
                </button>
                
                <input
                  type="file"
                  ref={videoInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoChange}
                />
                
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </div>
              
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setIsExpanded(false);
                    clearVideo();
                    clearThumbnail();
                    setCaption('');
                    setLocation('');
                    setTags('');
                  }}
                >
                  Cancel
                </button>
                
                <button 
                  type="button" 
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!videoFile || isUploading}
                  onClick={handleSubmit}
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Posting...</span>
                    </div>
                  ) : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadForm;

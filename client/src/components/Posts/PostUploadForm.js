import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaCamera, FaVideo, FaTimesCircle, FaImage, FaGlobeAmericas, FaUsers, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { createPost } from '../../redux/slices/postSlice';
import LoadingSpinner from '../UI/LoadingSpinner';
import GradientButton from '../UI/GradientButton';

const PostUploadForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { loading } = useSelector(state => state.posts);
  const { isDark } = useTheme();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    sport: '',
    tags: '',
    privacy: 'public'
  });
  const [selectedFiles, setSelectedFiles] = useState({
    images: [],
    videos: []
  });
  const [previews, setPreviews] = useState({
    images: [],
    videos: []
  });
  
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const sports = [
    'football', 'cricket', 'basketball', 'volleyball', 'badminton', 
    'kabaddi', 'tennis', 'hockey', 'general'
  ];

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: FaGlobeAmericas },
    { value: 'friends', label: 'Friends', icon: FaUsers },
    { value: 'private', label: 'Private', icon: FaLock }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (type, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate file types
    const validFiles = files.filter(file => {
      if (type === 'images' && !file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (type === 'videos' && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a valid video file`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    // Update form type based on files
    const newType = type === 'images' ? 'image' : 'video';
    setFormData(prev => ({ ...prev, type: newType }));

    // Add new files
    setSelectedFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...validFiles]
    }));

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => ({
          ...prev,
          [type]: [...prev[type], {
            file,
            url: reader.result,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (type, index) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
    setPreviews(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));

    // Reset type if no files remain
    if (selectedFiles.images.length + selectedFiles.videos.length === 1) {
      setFormData(prev => ({ ...prev, type: 'text' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('[PostUploadForm] Submit button clicked');
    console.log('[PostUploadForm] Form data:', formData);
    console.log('[PostUploadForm] Selected files:', selectedFiles);
    console.log('[PostUploadForm] User:', user);
    console.log('[PostUploadForm] Loading state:', loading);
    
    if (!formData.title.trim()) {
      console.log('[PostUploadForm] Validation failed: No title');
      toast.error('Please enter a title for your post');
      return;
    }

    if (!formData.content.trim()) {
      console.log('[PostUploadForm] Validation failed: No content');
      toast.error('Please enter some content for your post');
      return;
    }

    try {
      const postData = {
        ...formData,
        images: selectedFiles.images,
        videos: selectedFiles.videos
      };

      console.log('[PostUploadForm] Sending post data:', postData);
      console.log('[PostUploadForm] Dispatching createPost action...');
      
      const result = await dispatch(createPost(postData)).unwrap();
      
      console.log('[PostUploadForm] Post created successfully:', result);
      toast.success('Post created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        type: 'text',
        sport: '',
        tags: '',
        privacy: 'public'
      });
      setSelectedFiles({ images: [], videos: [] });
      setPreviews({ images: [], videos: [] });
      setShowForm(false);
      
      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error('[PostUploadForm] Error creating post:', error);
      toast.error(error || 'Failed to create post');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'text',
      sport: '',
      tags: '',
      privacy: 'public'
    });
    setSelectedFiles({ images: [], videos: [] });
    setPreviews({ images: [], videos: [] });
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className={`text-center py-4 md:py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <p>Please log in to create posts</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-4 md:mb-8">
      {!showForm ? (
        <div 
          onClick={() => setShowForm(true)}
          className={`
            p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
            ${isDark 
              ? 'border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-750' 
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <FaCamera className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Share your sports journey
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Post photos, videos, achievements, or thoughts
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`
          rounded-xl shadow-lg border
          ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className={`px-4 md:px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Create Post
              </h3>
              <button
                onClick={resetForm}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <FaTimesCircle className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar || '/default-avatar.png'}
                alt={user.firstName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center space-x-2">
                  <select
                    name="privacy"
                    value={formData.privacy}
                    onChange={handleInputChange}
                    className={`
                      text-sm px-2 py-1 rounded border-none outline-none cursor-pointer
                      ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
                    `}
                  >
                    {privacyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Give your post a title..."
                className={`
                  w-full p-3 rounded-lg border-2 transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-blue-400'
                  }
                  focus:outline-none
                `}
                maxLength={100}
              />
            </div>

            {/* Content Input */}
            <div>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="What's on your mind? Share your thoughts, achievements, or experiences..."
                rows={4}
                className={`
                  w-full p-3 rounded-lg border-2 transition-colors resize-none
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-blue-400'
                  }
                  focus:outline-none
                `}
                maxLength={2000}
              />
              <div className={`text-right text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.content.length}/2000
              </div>
            </div>

            {/* File Previews */}
            {(previews.images.length > 0 || previews.videos.length > 0) && (
              <div className="space-y-4">
                {/* Image Previews */}
                {previews.images.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Images ({previews.images.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {previews.images.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile('images', index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Previews */}
                {previews.videos.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Videos ({previews.videos.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previews.videos.map((preview, index) => (
                        <div key={index} className="relative group">
                          <video
                            src={preview.url}
                            className="w-full h-40 object-cover rounded-lg"
                            controls
                          />
                          <button
                            type="button"
                            onClick={() => removeFile('videos', index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sport Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sport Category
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleInputChange}
                  className={`
                    w-full p-3 rounded-lg border-2 transition-colors
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-400'
                    }
                    focus:outline-none
                  `}
                >
                  <option value="">Select a sport</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="fitness, training, goals (comma separated)"
                  className={`
                    w-full p-3 rounded-lg border-2 transition-colors
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-blue-400'
                    }
                    focus:outline-none
                  `}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Media Upload Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                    ${isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  <FaImage />
                  <span className="hidden sm:inline">Images</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                    ${isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  <FaVideo />
                  <span className="hidden sm:inline">Video</span>
                </button>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect('images', e)}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileSelect('videos', e)}
                  className="hidden"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`
                    px-4 md:px-6 py-2 rounded-lg transition-colors
                    ${isDark 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-800'
                    }
                  `}
                >
                  Cancel
                </button>
                <GradientButton
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="px-4 md:px-6 py-2"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="small" />
                      <span>Posting...</span>
                    </div>
                  ) : (
                    'Post'
                  )}
                </GradientButton>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostUploadForm;

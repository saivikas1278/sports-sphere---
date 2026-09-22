import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FaCamera, FaTimesCircle, FaTags, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PhotoUploadForm = ({ onSuccess }) => {
  const { user } = useSelector(state => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      toast.error('Please select an image to upload');
      return;
    }
    
    if (!caption.trim()) {
      toast.error('Please add a caption to your post');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call for upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create tags array from comma-separated string
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag !== '');
      
      // Create new post object
      const newPost = {
        id: `temp-${Date.now()}`,
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
        },
        imageUrl: previewUrl, // In a real app, this would be the URL from the server
        caption,
        location: location || null,
        tags: tagsArray,
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        sport: tagsArray[0] || 'general'
      };
      
      // Call the onSuccess callback with the new post
      onSuccess(newPost);
      
      // Reset form
      setCaption('');
      setLocation('');
      setTags('');
      setSelectedImage(null);
      setPreviewUrl('');
      setShowForm(false);
      
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setCaption('');
    setLocation('');
    setTags('');
    setSelectedImage(null);
    setPreviewUrl('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 md:mb-6">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <FaCamera />
          </div>
          <span className="text-gray-600">Share a photo moment...</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Photo Post</h3>
            <button 
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimesCircle />
            </button>
          </div>
          
          {/* Image preview */}
          {previewUrl ? (
            <div className="relative mb-4">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-64 object-contain bg-black rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewUrl('');
                }}
                className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-1 text-gray-700 hover:text-red-500"
              >
                <FaTimesCircle />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current.click()}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center mb-4 cursor-pointer hover:bg-gray-50"
            >
              <FaCamera className="text-xl md:text-3xl text-gray-400 mb-2" />
              <p className="text-gray-500">Click to select an image</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
          
          {/* Caption */}
          <div className="mb-4">
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <textarea
              id="caption"
              placeholder="Write a caption for your photo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              required
            />
          </div>
          
          {/* Location */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              <FaMapMarkerAlt className="inline mr-1" /> Location (optional)
            </label>
            <input
              type="text"
              id="location"
              placeholder="Add location"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          
          {/* Tags */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              <FaTags className="inline mr-1" /> Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              placeholder="E.g., basketball, nba, slam"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading || !selectedImage || !caption.trim()}
            >
              {loading ? 'Uploading...' : 'Post Photo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhotoUploadForm;

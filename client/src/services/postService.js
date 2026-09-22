import api from './api.js';

const postService = {
  // Get all posts with filters
  getPosts: async (params = {}) => {
    const response = await api.get('/posts', { params });
    return response;
  },

  // Get single post
  getPost: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response;
  },

  // Create new post
  createPost: async (postData) => {
    console.log('[postService] Creating post with data:', postData);
    
    const formData = new FormData();
    
    // Add text fields
    Object.keys(postData).forEach(key => {
      if (key !== 'images' && key !== 'videos') {
        console.log(`[postService] Adding field ${key}:`, postData[key]);
        formData.append(key, postData[key]);
      }
    });

    // Add images
    if (postData.images && postData.images.length > 0) {
      console.log(`[postService] Adding ${postData.images.length} images`);
      postData.images.forEach((image, index) => {
        console.log(`[postService] Adding image ${index}:`, image.name);
        formData.append('images', image);
      });
    }

    // Add videos
    if (postData.videos && postData.videos.length > 0) {
      console.log(`[postService] Adding ${postData.videos.length} videos`);
      postData.videos.forEach((video, index) => {
        console.log(`[postService] Adding video ${index}:`, video.name);
        formData.append('videos', video);
      });
    }

    console.log('[postService] Making API call to /posts');
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('[postService] API response:', response);
    return response;
  },

  // Update post
  updatePost: async (id, postData) => {
    const response = await api.put(`/posts/${id}`, postData);
    return response;
  },

  // Delete post
  deletePost: async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response;
  },

  // Like/unlike post
  likePost: async (id) => {
    const response = await api.post(`/posts/${id}/like`);
    return response;
  },

  // Add comment to post
  addComment: async (id, content) => {
    const response = await api.post(`/posts/${id}/comments`, { content });
    return response;
  },

  // Get user's posts
  getUserPosts: async (userId, params = {}) => {
    const response = await api.get(`/posts/user/${userId}`, { params });
    return response;
  },

  // Share post
  sharePost: async (id) => {
    const response = await api.post(`/posts/${id}/share`);
    return response;
  },

  // Save post
  savePost: async (id) => {
    const response = await api.post(`/posts/${id}/save`);
    return response;
  },

  // Report post
  reportPost: async (id, reason) => {
    const response = await api.post(`/posts/${id}/report`, { reason });
    return response;
  },

  // Get featured posts
  getFeaturedPosts: async () => {
    const response = await api.get('/posts', { 
      params: { featured: true, limit: 6 } 
    });
    return response;
  },

  // Get posts by sport
  getPostsBySport: async (sport, params = {}) => {
    const response = await api.get('/posts', { 
      params: { sport, ...params } 
    });
    return response;
  },

  // Get trending posts
  getTrendingPosts: async (params = {}) => {
    const response = await api.get('/posts', { 
      params: { sort: '-views,-likes', ...params } 
    });
    return response;
  },

  // Search posts
  searchPosts: async (query, params = {}) => {
    const response = await api.get('/posts', { 
      params: { search: query, ...params } 
    });
    return response;
  }
};

export default postService;

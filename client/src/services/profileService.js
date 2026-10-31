import api from './api.js';

const profileService = {
  // Get user profile
  getProfile: async (userId) => {
    const response = await api.get(`/profiles/${userId}`);
    return response;
  },

  // Update current user's profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profiles', profileData);
    return response;
  },

  // Follow user
  followUser: async (userId) => {
    const response = await api.post(`/profiles/${userId}/follow`);
    return response;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const response = await api.delete(`/profiles/${userId}/follow`);
    return response;
  },

  // Get user's followers
  getFollowers: async (userId, params = {}) => {
    const response = await api.get(`/profiles/${userId}/followers`, { params });
    return response;
  },

  // Get user's following
  getFollowing: async (userId, params = {}) => {
    const response = await api.get(`/profiles/${userId}/following`, { params });
    return response;
  },

  // Get leaderboard
  getLeaderboard: async (sport = null) => {
    const params = sport ? { sport } : {};
    const response = await api.get('/profiles/leaderboard', { params });
    return response;
  },

  // Add achievement
  addAchievement: async (achievementData) => {
    const response = await api.post('/profiles/achievements', achievementData);
    return response;
  },

  // Update user statistics
  updateStatistics: async (stats) => {
    const response = await api.put('/profiles/statistics', stats);
    return response;
  },

  // Get user activity feed
  getActivityFeed: async (userId, params = {}) => {
    // This would combine posts, achievements, matches, etc.
    const [posts, matches] = await Promise.all([
      api.get(`/posts/user/${userId}`, { params: { limit: 5 } }),
      api.get('/matches', { params: { participant: userId, limit: 5 } })
    ]);

    return {
      success: true,
      data: {
        posts: posts.data?.posts || [],
        matches: matches.data?.matches || []
      }
    };
  },

  // Search profiles
  searchProfiles: async (query, params = {}) => {
    const response = await api.get('/users/search', { 
      params: { q: query, ...params } 
    });
    return response;
  },

  // Get sport-specific stats
  getSportStats: async (userId, sport) => {
    const response = await api.get(`/profiles/${userId}/stats/${sport}`);
    return response;
  },

  // Get user profile statistics
  getProfileStats: async (userId) => {
    const response = await api.get(`/profiles/${userId}/stats`);
    return response;
  }
};

export default profileService;

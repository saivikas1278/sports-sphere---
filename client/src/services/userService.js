import api from './api';

const userService = {
  // Get all users for player selection
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/users?${queryString}`);
    return response;
  },

  // Search users by name or email
  searchUsers: async (query) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response;
  },

  // Get user profile
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response;
  },

  // Update user profile
  updateProfile: async (userId, data) => {
    const response = await api.put(`/users/${userId}`, data);
    return response;
  },

  // Update user team status
  updateTeamStatus: async (userId, teamId, status) => {
    const response = await api.put(`/users/${userId}/team-status`, {
      teamId,
      status
    });
    return response;
  },

  // Update user role (admin action)
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/users/${userId}`, { role });
    return response;
  },

  // Delete user (admin action)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response;
  },

  // Get users by sport preference
  getUsersBySport: async (sport) => {
    const response = await api.get(`/users/by-sport/${sport}`);
    return response;
  }
};

export default userService;

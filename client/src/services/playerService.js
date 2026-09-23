import api from './api';

const playerService = {
  // Get player statistics
  getPlayerStats: async (userId) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response;
  },

  // Get player match history
  getPlayerMatches: async (userId) => {
    const response = await api.get(`/users/${userId}/matches`);
    return response;
  },

  // Update individual player statistics for a match
  updateMatchPlayerStats: async (matchId, playerStatsData) => {
    const response = await api.patch(`/matches/${matchId}/player-stats`, playerStatsData);
    return response;
  }
};

export default playerService;
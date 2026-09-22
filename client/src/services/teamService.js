import api from './api';

const teamService = {
  // Get all teams
  getTeams: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/teams?${queryString}`);
    return response;
  },

  // Get team by ID
  getTeam: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response;
  },

  // Create team
  createTeam: async (teamData) => {
    const formData = new FormData();
    
    // Append team data
    Object.keys(teamData).forEach(key => {
      if (teamData[key] instanceof File) {
        formData.append(key, teamData[key]);
      } else if (Array.isArray(teamData[key])) {
        formData.append(key, JSON.stringify(teamData[key]));
      } else {
        formData.append(key, teamData[key]);
      }
    });

    const response = await api.post('/teams', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Update team
  updateTeam: async (id, data) => {
    const response = await api.put(`/teams/${id}`, data);
    return response;
  },

  // Delete team
  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response;
  },

  // Join team
  joinTeam: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/join`);
    return response;
  },

  // Leave team
  leaveTeam: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/leave`);
    return response;
  },

  // Send join request
  sendJoinRequest: async (teamId, message = '') => {
    const response = await api.post(`/teams/${teamId}/join-request`, { message });
    return response;
  },

  // Accept join request
  acceptJoinRequest: async (teamId, userId) => {
    const response = await api.post(`/teams/${teamId}/join-request/${userId}/accept`);
    return response;
  },

  // Reject join request
  rejectJoinRequest: async (teamId, userId) => {
    const response = await api.post(`/teams/${teamId}/join-request/${userId}/reject`);
    return response;
  },

  // Get join requests
  getJoinRequests: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/join-requests`);
    return response;
  },

  // Update member role
  updateMemberRole: async (teamId, memberId, role) => {
    const response = await api.put(`/teams/${teamId}/players/${memberId}/role`, { role });
    return response;
  },

  // Remove member
  removeMember: async (teamId, memberId) => {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return response;
  },

  // Get team members
  getMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response;
  },

  // Get my teams
  getMyTeams: async () => {
    const response = await api.get('/teams/my');
    return response;
  },

  // Get teams I manage
  getManagedTeams: async () => {
    const response = await api.get('/teams/managed');
    return response;
  },

  // Search teams
  searchTeams: async (query) => {
    const response = await api.get(`/teams/search?q=${encodeURIComponent(query)}`);
    return response;
  },

  // Get teams by sport
  getTeamsBySport: async (sport) => {
    const response = await api.get(`/teams/sport/${sport}`);
    return response;
  },

  // Get teams by location
  getTeamsByLocation: async (location) => {
    const response = await api.get(`/teams/location/${encodeURIComponent(location)}`);
    return response;
  },

  // Get teams looking for players
  getTeamsLookingForPlayers: async () => {
    const response = await api.get('/teams/looking-for-players');
    return response;
  },

  // Upload team logo
  uploadLogo: async (teamId, logo) => {
    const formData = new FormData();
    formData.append('logo', logo);
    
    const response = await api.post(`/teams/${teamId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Get team statistics
  getStatistics: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/statistics`);
    return response;
  },

  // Get team matches
  getMatches: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/matches`);
    return response;
  },

  // Get team tournaments
  getTournaments: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/tournaments`);
    return response;
  },

  // Invite player to team
  invitePlayer: async (teamId, userId, role = 'player') => {
    const response = await api.post(`/teams/${teamId}/invitations`, { userId, role });
    return response;
  },

  // Get team invitations (for current user)
  getInvitations: async () => {
    const response = await api.get('/teams/invitations');
    return response;
  },

  // Accept team invitation
  acceptInvitation: async (teamId, invitationId) => {
    const response = await api.put(`/teams/${teamId}/invitations/${invitationId}`, { status: 'accepted' });
    return response;
  },

  // Reject team invitation
  rejectInvitation: async (teamId, invitationId) => {
    const response = await api.put(`/teams/${teamId}/invitations/${invitationId}`, { status: 'declined' });
    return response;
  },

  // Get team achievements
  getAchievements: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/achievements`);
    return response;
  },

  // Add team achievement
  addAchievement: async (teamId, achievementData) => {
    const response = await api.post(`/teams/${teamId}/achievements`, achievementData);
    return response;
  },

  // Update team achievement
  updateAchievement: async (teamId, achievementId, achievementData) => {
    const response = await api.put(`/teams/${teamId}/achievements/${achievementId}`, achievementData);
    return response;
  },

  // Delete team achievement
  deleteAchievement: async (teamId, achievementId) => {
    const response = await api.delete(`/teams/${teamId}/achievements/${achievementId}`);
    return response;
  },

  // Get team roster
  getRoster: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/roster`);
    return response;
  },

  // Update team roster
  updateRoster: async (teamId, rosterData) => {
    const response = await api.put(`/teams/${teamId}/roster`, rosterData);
    return response;
  },
};

export default teamService;

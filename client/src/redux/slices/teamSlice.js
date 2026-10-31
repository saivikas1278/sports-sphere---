import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import teamService from '../../services/teamService';

// Async thunks
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await teamService.getTeams(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams');
    }
  }
);

export const fetchTeamById = createAsyncThunk(
  'teams/fetchTeamById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await teamService.getTeam(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team');
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      const response = await teamService.createTeam(teamData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create team');
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await teamService.updateTeam(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update team');
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (id, { rejectWithValue }) => {
    try {
      await teamService.deleteTeam(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete team');
    }
  }
);

export const joinTeam = createAsyncThunk(
  'teams/joinTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await teamService.joinTeam(teamId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join team');
    }
  }
);

export const leaveTeam = createAsyncThunk(
  'teams/leaveTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await teamService.leaveTeam(teamId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave team');
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'teams/updateMemberRole',
  async ({ teamId, memberId, role }, { rejectWithValue }) => {
    try {
      const response = await teamService.updateMemberRole(teamId, memberId, role);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
    }
  }
);

export const removeMember = createAsyncThunk(
  'teams/removeMember',
  async ({ teamId, memberId }, { rejectWithValue }) => {
    try {
      const response = await teamService.removeMember(teamId, memberId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

export const fetchMyTeams = createAsyncThunk(
  'teams/fetchMyTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teamService.getMyTeams();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my teams');
    }
  }
);

export const invitePlayer = createAsyncThunk(
  'teams/invitePlayer',
  async ({ teamId, userId, role = 'player' }, { rejectWithValue }) => {
    try {
      const response = await teamService.sendInvitation(teamId, userId, role);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send invite');
    }
  }
);

const initialState = {
  teams: [],
  currentTeam: null,
  myTeams: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 12,
  },
  filters: {
    sport: '',
    location: '',
    search: '',
    lookingForPlayers: false,
  },
};

const teamSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentTeam: (state) => {
      state.currentTeam = null;
    },
    updateTeamMembers: (state, action) => {
      const { teamId, members } = action.payload;
      
      // Update in teams array
      const team = state.teams.find(t => t._id === teamId);
      if (team) {
        team.members = members;
      }
      
      // Update current team
      if (state.currentTeam && state.currentTeam._id === teamId) {
        state.currentTeam.members = members;
      }
      
      // Update in my teams
      const myTeam = state.myTeams.find(t => t._id === teamId);
      if (myTeam) {
        myTeam.members = members;
      }
    },
    addTeamMember: (state, action) => {
      const { teamId, member } = action.payload;
      
      // Update in teams array
      const team = state.teams.find(t => t._id === teamId);
      if (team) {
        team.members.push(member);
      }
      
      // Update current team
      if (state.currentTeam && state.currentTeam._id === teamId) {
        state.currentTeam.members.push(member);
      }
    },
    removeTeamMember: (state, action) => {
      const { teamId, memberId } = action.payload;
      
      // Update in teams array
      const team = state.teams.find(t => t._id === teamId);
      if (team) {
        team.members = team.members.filter(m => m.user._id !== memberId);
      }
      
      // Update current team
      if (state.currentTeam && state.currentTeam._id === teamId) {
        state.currentTeam.members = state.currentTeam.members.filter(m => m.user._id !== memberId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch teams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload.teams;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch team by ID
      .addCase(fetchTeamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTeam = action.payload.team;
      })
      .addCase(fetchTeamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.teams.unshift(action.payload.team);
        state.myTeams.unshift(action.payload.team);
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update team
      .addCase(updateTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.teams.findIndex(t => t._id === action.payload.team._id);
        if (index !== -1) {
          state.teams[index] = action.payload.team;
        }
        if (state.currentTeam && state.currentTeam._id === action.payload.team._id) {
          state.currentTeam = action.payload.team;
        }
        const myTeamIndex = state.myTeams.findIndex(t => t._id === action.payload.team._id);
        if (myTeamIndex !== -1) {
          state.myTeams[myTeamIndex] = action.payload.team;
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete team
      .addCase(deleteTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = state.teams.filter(t => t._id !== action.payload);
        state.myTeams = state.myTeams.filter(t => t._id !== action.payload);
        if (state.currentTeam && state.currentTeam._id === action.payload) {
          state.currentTeam = null;
        }
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Join team
      .addCase(joinTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinTeam.fulfilled, (state, action) => {
        state.loading = false;
        const team = state.teams.find(t => t._id === action.payload.team._id);
        if (team) {
          team.members = action.payload.team.members;
        }
        if (state.currentTeam && state.currentTeam._id === action.payload.team._id) {
          state.currentTeam.members = action.payload.team.members;
        }
        state.myTeams.push(action.payload.team);
      })
      .addCase(joinTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Leave team
      .addCase(leaveTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(leaveTeam.fulfilled, (state, action) => {
        state.loading = false;
        const team = state.teams.find(t => t._id === action.payload.team._id);
        if (team) {
          team.members = action.payload.team.members;
        }
        if (state.currentTeam && state.currentTeam._id === action.payload.team._id) {
          state.currentTeam.members = action.payload.team.members;
        }
        state.myTeams = state.myTeams.filter(t => t._id !== action.payload.team._id);
      })
      .addCase(leaveTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my teams
      .addCase(fetchMyTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.myTeams = action.payload.teams;
      })
      .addCase(fetchMyTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update member role
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const team = action.payload.team;
        const index = state.teams.findIndex(t => t._id === team._id);
        if (index !== -1) {
          state.teams[index] = team;
        }
        if (state.currentTeam && state.currentTeam._id === team._id) {
          state.currentTeam = team;
        }
      })
      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        const team = action.payload.team;
        const index = state.teams.findIndex(t => t._id === team._id);
        if (index !== -1) {
          state.teams[index] = team;
        }
        if (state.currentTeam && state.currentTeam._id === team._id) {
          state.currentTeam = team;
        }
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearCurrentTeam,
  updateTeamMembers,
  addTeamMember,
  removeTeamMember
} = teamSlice.actions;
export default teamSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tournamentService from '../../services/tournamentService';

// Async thunks
export const fetchTournaments = createAsyncThunk(
  'tournaments/fetchTournaments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await tournamentService.getTournaments(params);
      console.log('[TournamentSlice] API Response:', response);
      
      // Handle backend response structure: { success: true, data: [...], count, total, pagination }
      if (response && response.success && response.data) {
        return {
          tournaments: response.data,
          pagination: response.pagination || {
            page: 1,
            pages: 1,
            total: response.total || response.count || response.data.length,
            limit: response.data.length
          }
        };
      }
      
      // Fallback for different response formats
      const list = response?.tournaments || response?.data || (Array.isArray(response) ? response : []);
      return {
        tournaments: list,
        pagination: response?.pagination || {
          page: 1,
          pages: 1,
          total: list.length,
          limit: list.length
        }
      };
    } catch (error) {
      console.error('[TournamentSlice] Error fetching tournaments:', error);
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch tournaments');
    }
  }
);

export const fetchTournamentById = createAsyncThunk(
  'tournaments/fetchTournamentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tournamentService.getTournament(id);
      console.log('[TournamentSlice] Tournament Details Response:', response);
      
      // Handle backend response structure: { success: true, data: tournament }
      if (response && response.success && response.data) {
        return {
          tournament: response.data
        };
      }
      
      if (response?.tournament || response?.data) {
        return {
          tournament: response.tournament || response.data
        };
      }

      return {
        tournament: response
      };
    } catch (error) {
      console.error('[TournamentSlice] Error fetching tournament details:', error);
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch tournament');
    }
  }
);

export const createTournament = createAsyncThunk(
  'tournaments/createTournament',
  async (tournamentData, { rejectWithValue }) => {
    try {
      console.log('[TournamentSlice] Creating tournament with data:', tournamentData);
      const response = await tournamentService.createTournament(tournamentData);
      console.log('[TournamentSlice] Tournament creation response:', response);
      
      // Handle backend response structure: { success: true, data: tournament }
      if (response.success && response.data) {
        return {
          tournament: response.data
        };
      }
      
      // Fallback for different response formats
      return {
        tournament: response.tournament || response.data || response
      };
    } catch (error) {
      console.error('[TournamentSlice] Tournament creation error:', error);
      
      // Don't fall back to mock data - throw the actual error
      if (error.response?.data?.error) {
        return rejectWithValue(error.response.data.error);
      } else if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.data?.details) {
        // Handle validation errors - show specific field errors
        const validationErrors = error.response.data.details.map(detail => 
          `${detail.path || detail.param || 'Field'}: ${detail.msg}`
        ).join('; ');
        return rejectWithValue(`Validation failed: ${validationErrors}`);
      } else if (error.message) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue('Failed to create tournament. Please check your internet connection and try again.');
      }
    }
  }
);

export const updateTournament = createAsyncThunk(
  'tournaments/updateTournament',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tournamentService.updateTournament(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tournament');
    }
  }
);

export const updateMatchScore = createAsyncThunk(
  'tournaments/updateMatchScore',
  async ({ tournamentId, matchId, scoreData }, { rejectWithValue }) => {
    try {
      const response = await tournamentService.updateMatchScore(tournamentId, matchId, scoreData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to update score');
    }
  }
);

export const deleteTournament = createAsyncThunk(
  'tournaments/deleteTournament',
  async (id, { rejectWithValue }) => {
    try {
      await tournamentService.deleteTournament(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tournament');
    }
  }
);

export const registerForTournament = createAsyncThunk(
  'tournaments/registerForTournament',
  async ({ tournamentId, teamData }, { rejectWithValue }) => {
    try {
      const response = await tournamentService.registerTeam(tournamentId, teamData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to register for tournament');
    }
  }
);

export const generateBracket = createAsyncThunk(
  'tournaments/generateBracket',
  async (tournamentId, { rejectWithValue }) => {
    try {
      const response = await tournamentService.generateBracket(tournamentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate bracket');
    }
  }
);

export const fetchTournamentSchedule = createAsyncThunk(
  'tournaments/fetchTournamentSchedule',
  async (tournamentId, { rejectWithValue }) => {
    try {
      const response = await tournamentService.getTournamentSchedule(tournamentId);
      if (response.success && response.data) {
        return response.data;
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch schedule');
    }
  }
);

export const fetchTournamentBracket = createAsyncThunk(
  'tournaments/fetchTournamentBracket',
  async (tournamentId, { rejectWithValue }) => {
    try {
      const response = await tournamentService.getBracket(tournamentId);
      if (response.success && response.data) {
        return response.data;
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bracket');
    }
  }
);

export const fetchTournamentStandings = createAsyncThunk(
  'tournaments/fetchTournamentStandings',
  async (tournamentId, { rejectWithValue }) => {
    try {
      const response = await tournamentService.getStandings(tournamentId);
      if (response.success && response.data) {
        return response.data;
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch standings');
    }
  }
);

export const approveRegistration = createAsyncThunk(
  'tournaments/approveRegistration',
  async ({ tournamentId, teamId }, { rejectWithValue }) => {
    try {
      const response = await tournamentService.approveTeamRegistration(tournamentId, teamId);
      return { teamId, response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve registration');
    }
  }
);

export const rejectRegistration = createAsyncThunk(
  'tournaments/rejectRegistration',
  async ({ tournamentId, teamId }, { rejectWithValue }) => {
    try {
      const response = await tournamentService.rejectTeamRegistration(tournamentId, teamId);
      return { teamId, response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject registration');
    }
  }
);

export const startTournament = createAsyncThunk(
  'tournaments/startTournament',
  async (tournamentId, { rejectWithValue }) => {
    try {
      const response = await tournamentService.startTournament(tournamentId);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to start tournament');
    }
  }
);

const initialState = {
  tournaments: [],
  currentTournament: null,
  schedule: null,
  bracket: null,
  standings: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  },
  filters: {
    sport: '',
    status: '',
    search: '',
  },
};

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentTournament: (state) => {
      state.currentTournament = null;
    },
    updateTournamentStatus: (state, action) => {
      const { tournamentId, status } = action.payload;
      const tournament = state.tournaments.find(t => t._id === tournamentId);
      if (tournament) {
        tournament.status = status;
      }
      if (state.currentTournament && state.currentTournament._id === tournamentId) {
        state.currentTournament.status = status;
      }
    },
    addTournamentMatch: (state, action) => {
      const { tournamentId, match } = action.payload;
      if (state.currentTournament && state.currentTournament._id === tournamentId) {
        if (!state.currentTournament.matches) {
          state.currentTournament.matches = [];
        }
        state.currentTournament.matches.push(match);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tournaments
      .addCase(fetchTournaments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.loading = false;
        console.log('[TournamentSlice] Fulfilled action payload:', action.payload);
        
        // Handle the response structure properly
        if (action.payload && action.payload.tournaments) {
          state.tournaments = action.payload.tournaments;
          state.pagination = action.payload.pagination || {};
        } else if (action.payload && Array.isArray(action.payload)) {
          // Direct array response
          state.tournaments = action.payload;
        } else {
          // Fallback
          state.tournaments = [];
        }
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch tournament by ID
      .addCase(fetchTournamentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTournamentById.fulfilled, (state, action) => {
        state.loading = false;
        console.log('[TournamentSlice] Tournament details fulfilled action payload:', action.payload);
        
        // Handle the response structure properly
        if (action.payload && action.payload.tournament) {
          state.currentTournament = action.payload.tournament;
        } else if (action.payload && action.payload.data) {
          // Handle backend response: { success: true, data: tournament }
          state.currentTournament = action.payload.data;
        } else if (action.payload && !action.payload.success) {
          // Direct tournament object
          state.currentTournament = action.payload;
        } else {
          // Fallback
          state.currentTournament = null;
        }
      })
      .addCase(fetchTournamentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create tournament
      .addCase(createTournament.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTournament.fulfilled, (state, action) => {
        state.loading = false;
        state.tournaments.unshift(action.payload.tournament);
      })
      .addCase(createTournament.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update tournament
      .addCase(updateTournament.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTournament.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tournaments.findIndex(t => t._id === action.payload.tournament._id);
        if (index !== -1) {
          state.tournaments[index] = action.payload.tournament;
        }
        if (state.currentTournament && state.currentTournament._id === action.payload.tournament._id) {
          state.currentTournament = action.payload.tournament;
        }
      })
      .addCase(updateTournament.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update match score
      .addCase(updateMatchScore.pending, (state) => {
        // Handled silently
      })
      .addCase(updateMatchScore.fulfilled, (state, action) => {
        // Triggered by socket event normally, but we can do optimistic update here if needed
      })
      .addCase(updateMatchScore.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete tournament
      .addCase(deleteTournament.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTournament.fulfilled, (state, action) => {
        state.loading = false;
        state.tournaments = state.tournaments.filter(t => t._id !== action.payload);
        if (state.currentTournament && state.currentTournament._id === action.payload) {
          state.currentTournament = null;
        }
      })
      .addCase(deleteTournament.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register for tournament
      .addCase(registerForTournament.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerForTournament.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { success: true, data: team }, not tournament
        // So we need to update the current tournament's registered teams
        if (state.currentTournament && action.payload.data) {
          // Add the new team to registered teams if not already present
          const teamId = action.payload.data._id;
          if (!state.currentTournament.registeredTeams.includes(teamId)) {
            state.currentTournament.registeredTeams.push(teamId);
          }
        }
      })
      .addCase(registerForTournament.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate bracket
      .addCase(generateBracket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBracket.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTournament) {
          state.currentTournament.bracket = action.payload.bracket;
          state.currentTournament.status = 'active';
        }
      })
      .addCase(generateBracket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve Registration
      .addCase(approveRegistration.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveRegistration.fulfilled, (state, action) => {
        state.loading = false;
        // Mock update: we assume backend removes it from pending or changes status
      })
      .addCase(approveRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject Registration
      .addCase(rejectRegistration.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectRegistration.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(rejectRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Schedule
      .addCase(fetchTournamentSchedule.fulfilled, (state, action) => {
        state.schedule = action.payload.schedule || action.payload;
      })
      // Start Tournament
      .addCase(startTournament.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTournament.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTournament) {
          state.currentTournament.status = 'ongoing';
          if (action.payload?.brackets || action.payload?.data?.brackets) {
            state.bracket = action.payload?.brackets || action.payload?.data?.brackets;
          }
        }
      })
      .addCase(startTournament.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Bracket
      .addCase(fetchTournamentBracket.fulfilled, (state, action) => {
        state.bracket = action.payload.bracket || action.payload;
      })
      // Fetch Standings
      .addCase(fetchTournamentStandings.fulfilled, (state, action) => {
        state.standings = action.payload;
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearCurrentTournament, 
  updateTournamentStatus,
  addTournamentMatch 
} = tournamentSlice.actions;

export default tournamentSlice.reducer;

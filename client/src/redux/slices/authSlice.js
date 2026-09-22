import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { setAuthToken } from '../../utils/auth';

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('[authSlice] Register attempt with:', userData);
      const response = await authService.register(userData);
      console.log('[authSlice] Register response:', response);
      
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setAuthToken(response.token);
        console.log('[authSlice] Registration successful, token stored');
        return response;
      } else {
        console.error('[authSlice] Registration failed - no token in response');
        return rejectWithValue('Registration failed - no token received');
      }
    } catch (error) {
      console.error('[authSlice] Registration error:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('[authSlice] Login attempt with:', credentials);
      const response = await authService.login(credentials);
      console.log('[authSlice] Login response:', response);
      
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        setAuthToken(response.token);
        console.log('[authSlice] Login successful, token stored');
        return response;
      } else {
        console.error('[authSlice] Login failed - no token in response');
        return rejectWithValue('Login failed - no token received');
      }
    } catch (error) {
      console.error('[authSlice] Login error:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Login failed');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('[authSlice] Found token, getting user profile');
        setAuthToken(token);
        const response = await authService.getProfile();
        console.log('[authSlice] User profile loaded successfully', response);
        
        if (response.success && response.user) {
          return response;
        } else {
          console.error('[authSlice] Profile load failed - invalid response format');
          localStorage.removeItem('token');
          setAuthToken();
          return rejectWithValue('Invalid profile response');
        }
      }
      // No token found
      console.log('[authSlice] No token found, user not authenticated');
      return null;
    } catch (error) {
      console.error('[authSlice] Error loading user profile:', error);
      // If API fails, remove token and log out
      localStorage.removeItem('token');
      setAuthToken();
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to load user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const response = await authService.uploadAvatar(file);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Avatar upload failed');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      setAuthToken();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('[authSlice] Login fulfilled with payload:', action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        console.log('[authSlice] Login rejected with error:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.avatar = action.payload.data.avatar;
        } else {
          state.user = action.payload.data;
        }
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;

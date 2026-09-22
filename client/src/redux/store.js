import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import tournamentSlice from './slices/tournamentSlice';
import matchSlice from './slices/matchSlice';
import videoSlice from './slices/videoSlice';
import fitnessSlice from './slices/fitnessSlice';
import teamSlice from './slices/teamSlice';
import uiSlice from './slices/uiSlice';
import postSlice from './slices/postSlice';
import notificationSlice from './slices/notificationSlice';
import profileSlice from './slices/profileSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tournaments: tournamentSlice,
    matches: matchSlice,
    videos: videoSlice,
    fitness: fitnessSlice,
    teams: teamSlice,
    ui: uiSlice,
    posts: postSlice,
    notifications: notificationSlice,
    profile: profileSlice,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

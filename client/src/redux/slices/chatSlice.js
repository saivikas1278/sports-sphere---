import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const getConversations = createAsyncThunk(
  'chat/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch conversations'
      );
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (participantId, { rejectWithValue }) => {
    try {
      const response = await api.post('/chat/conversations', { participantId });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create conversation'
      );
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/messages/${conversationId}`);
      return { conversationId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messages'
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, text, media }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/messages/${conversationId}`, { text, media });
      return { conversationId, data: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send message'
      );
    }
  }
);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {}, // Map of conversationId to messages array
  loading: false,
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addRealtimeMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Prevent duplicates
      const exists = state.messages[conversationId].find(m => m._id === message._id);
      if (!exists) {
        state.messages[conversationId].push(message);
        
        // Update conversation lastMessage
        const convIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (convIndex !== -1) {
          state.conversations[convIndex].lastMessage = message;
          // Move conversation to top
          const conv = state.conversations.splice(convIndex, 1)[0];
          state.conversations.unshift(conv);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // getConversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.data;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createConversation
      .addCase(createConversation.fulfilled, (state, action) => {
        const newConv = action.payload.data;
        const exists = state.conversations.find(c => c._id === newConv._id);
        if (!exists) {
          state.conversations.unshift(newConv);
        }
        state.activeConversation = newConv;
      })
      // getMessages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages[action.payload.conversationId] = action.payload.data;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // sendMessage
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, data: message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        
        // Check if message already exists (from realtime)
        const exists = state.messages[conversationId].find(m => m._id === message._id);
        if (!exists) {
          state.messages[conversationId].push(message);
        }
      });
  }
});

export const { setActiveConversation, addRealtimeMessage } = chatSlice.actions;

export default chatSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import postService from '../../services/postService.js';

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await postService.getPosts(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postService.getPost(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch post');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await postService.createPost(postData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, postData }, { rejectWithValue }) => {
    try {
      const response = await postService.updatePost(id, postData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id, { rejectWithValue }) => {
    try {
      await postService.deletePost(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postService.likePost(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await postService.addComment(id, content);
      return { postId: id, comment: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await postService.getUserPosts(userId, params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }
);

export const sharePost = createAsyncThunk(
  'posts/sharePost',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postService.sharePost(id);
      return { id, shares: response.data.shares };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to share post');
    }
  }
);

export const savePost = createAsyncThunk(
  'posts/savePost',
  async (id, { rejectWithValue }) => {
    try {
      const response = await postService.savePost(id);
      return { id, isSaved: response.data.isSaved };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save post');
    }
  }
);

export const reportPost = createAsyncThunk(
  'posts/reportPost',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await postService.reportPost(id, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to report post');
    }
  }
);

export const fetchFeaturedPosts = createAsyncThunk(
  'posts/fetchFeaturedPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await postService.getFeaturedPosts();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured posts');
    }
  }
);

export const searchPosts = createAsyncThunk(
  'posts/searchPosts',
  async ({ query, params = {} }, { rejectWithValue }) => {
    try {
      const response = await postService.searchPosts(query, params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search posts');
    }
  }
);

const initialState = {
  posts: [],
  currentPost: null,
  userPosts: [],
  featuredPosts: [],
  searchResults: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  },
  filters: {
    type: '',
    sport: '',
    search: '',
    sort: '-createdAt'
  },
  uploadProgress: 0,
  isUploading: false
};

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    updatePostInList: (state, action) => {
      const { id, updates } = action.payload;
      
      // Update in posts array
      const postIndex = state.posts.findIndex(p => p._id === id);
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
      
      // Update current post if it matches
      if (state.currentPost && state.currentPost._id === id) {
        state.currentPost = { ...state.currentPost, ...updates };
      }
      
      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === id);
      if (userPostIndex !== -1) {
        state.userPosts[userPostIndex] = { ...state.userPosts[userPostIndex], ...updates };
      }
    },
    addCommentToPost: (state, action) => {
      const { postId, comment } = action.payload;
      
      // Add to current post
      if (state.currentPost && state.currentPost._id === postId) {
        state.currentPost.comments = state.currentPost.comments || [];
        state.currentPost.comments.push(comment);
        state.currentPost.commentsCount += 1;
      }
      
      // Add to posts array
      const post = state.posts.find(p => p._id === postId);
      if (post) {
        post.comments = post.comments || [];
        post.comments.push(comment);
        post.commentsCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.data.posts;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload.data;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create post
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isUploading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.isUploading = false;
        state.uploadProgress = 0;
        state.posts.unshift(action.payload.data);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      // Update post
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPost = action.payload.data;
        
        // Update in posts array
        const index = state.posts.findIndex(p => p._id === updatedPost._id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
        
        // Update current post
        if (state.currentPost && state.currentPost._id === updatedPost._id) {
          state.currentPost = updatedPost;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.posts = state.posts.filter(p => p._id !== deletedId);
        state.userPosts = state.userPosts.filter(p => p._id !== deletedId);
        if (state.currentPost && state.currentPost._id === deletedId) {
          state.currentPost = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Like post
      .addCase(likePost.fulfilled, (state, action) => {
        const { id, isLiked, likesCount } = action.payload;
        
        // Update in posts array
        const post = state.posts.find(p => p._id === id);
        if (post) {
          post.isLikedByUser = isLiked;
          post.likesCount = likesCount;
        }
        
        // Update current post
        if (state.currentPost && state.currentPost._id === id) {
          state.currentPost.isLikedByUser = isLiked;
          state.currentPost.likesCount = likesCount;
        }
      })
      .addCase(likePost.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        postSlice.caseReducers.addCommentToPost(state, action);
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch user posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.userPosts = action.payload.data.posts;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Share post
      .addCase(sharePost.fulfilled, (state, action) => {
        const { id, shares } = action.payload;
        
        // Update in posts array
        const post = state.posts.find(p => p._id === id);
        if (post) {
          post.shares = shares;
        }
        
        // Update current post
        if (state.currentPost && state.currentPost._id === id) {
          state.currentPost.shares = shares;
        }
      })
      // Save post
      .addCase(savePost.fulfilled, (state, action) => {
        const { id, isSaved } = action.payload;
        
        // Update in posts array
        const post = state.posts.find(p => p._id === id);
        if (post) {
          post.isSaved = isSaved;
        }
        
        // Update current post
        if (state.currentPost && state.currentPost._id === id) {
          state.currentPost.isSaved = isSaved;
        }
      })
      // Featured posts
      .addCase(fetchFeaturedPosts.fulfilled, (state, action) => {
        state.featuredPosts = action.payload.data.posts;
      })
      // Search posts
      .addCase(searchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data.posts;
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearCurrentPost,
  clearSearchResults,
  setUploadProgress,
  setUploading,
  updatePostInList,
  addCommentToPost
} = postSlice.actions;

// Selectors
export const selectPosts = (state) => state.posts.posts;
export const selectCurrentPost = (state) => state.posts.currentPost;
export const selectPostsLoading = (state) => state.posts.loading;
export const selectPostsError = (state) => state.posts.error;
export const selectPostsPagination = (state) => state.posts.pagination;
export const selectFeaturedPosts = (state) => state.posts.featuredPosts;
export const selectSearchResults = (state) => state.posts.searchResults;
export const selectUploadProgress = (state) => state.posts.uploadProgress;
export const selectIsUploading = (state) => state.posts.isUploading;

export default postSlice.reducer;

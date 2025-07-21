import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  commentsByBlog: {},
  userComments: [],
  status: 'idle',
  error: null,
  lastFetchTime: null,
  processedComments: 0,
  totalComments: 0
};

export const fetchComments = createAsyncThunk(
  'comments/fetchByBlog',
  async (blogId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/comments/${blogId}`);
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      return { blogId, comments: response.data };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const fetchUserComments = createAsyncThunk(
  'comments/fetchUserComments',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state?.auth?.user?._id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await api.get(`/comments/user/${userId}`);
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue({ 
        message: error.response?.data?.message || 
                 error.response?.data?.error || 
                 error.message || 
                 'Failed to fetch user comments',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const addComment = createAsyncThunk(
  'comments/add',
  async ({ blogId, text, parentId = null }, { rejectWithValue }) => {
    try {
      const response = await api.post('/comments', {
        postId: blogId,
        content: text,
        parentId
      });
      
      // Return the raw response data
      return {
        blogId,
        comment: response.data.comment
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return rejectWithValue({ 
        message: error.response?.data?.message || 
                 error.response?.data?.error || 
                 error.message || 
                 'Failed to add comment',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/update',
  async ({ blogId, commentId, text }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/comments/${blogId}/${commentId}`, {
        text
      });
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         error?.data?.message ||
                         'Failed to update comment';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/delete',
  async ({ blogId, commentId }, { rejectWithValue }) => {
    try {
      await api.delete(`/comments/${blogId}/${commentId}`);
      return { blogId, commentId };
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         error?.data?.message ||
                         'Failed to delete comment';
      return rejectWithValue(errorMessage);
    }
  }
);

export const likeComment = createAsyncThunk(
  'comments/like',
  async ({ blogId, commentId, userId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/comments/${blogId}/${commentId}/like`, { userId });
      return { blogId, commentId, likesCount: response.data.likesCount, isLiked: true };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const unlikeComment = createAsyncThunk(
  'comments/unlike',
  async ({ blogId, commentId, userId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/comments/${blogId}/${commentId}/like`, { data: { userId } });
      return { blogId, commentId, likesCount: response.data.likesCount, isLiked: false };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentError: (state) => {
      state.error = null;
    },
    resetCommentState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.commentsByBlog[action.payload.blogId] = action.payload.comments;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch comments';
      })
      .addCase(fetchUserComments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserComments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userComments = action.payload;
      })
      .addCase(fetchUserComments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch user comments';
      })
      .addCase(addComment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const blogId = action.payload.blogId;
        const newComment = action.payload.comment;
        
        // Ensure comments array exists and is an array
        state.commentsByBlog[blogId] = Array.isArray(state.commentsByBlog[blogId]) 
          ? [...state.commentsByBlog[blogId]] 
          : [];
        
        // Add new comment to the array
        state.commentsByBlog[blogId] = [...state.commentsByBlog[blogId], newComment];
        
        // Update processedComments count
        state.processedComments = (state.processedComments || 0) + 1;
        
        // Update totalComments count
        state.totalComments = (state.totalComments || 0) + 1;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.error?.message || 'Failed to add comment';
      })
      .addCase(deleteComment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const blogComments = state.commentsByBlog[action.payload.blogId] || [];
        state.commentsByBlog[action.payload.blogId] = blogComments.filter(
          comment => comment._id !== action.payload.commentId
        );
        
        // Also remove from userComments if present
        state.userComments = state.userComments.filter(
          comment => comment._id !== action.payload.commentId
        );
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.error?.message || 'Failed to delete comment';
      })
      .addCase(likeComment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const blogId = action.meta.arg.blogId;
        const blogComments = state.commentsByBlog[blogId] || [];
        state.commentsByBlog[blogId] = blogComments.map(
          comment => comment._id === action.payload.commentId ? action.payload.comment : comment
        );
        
        // Update userComments if present
        state.userComments = state.userComments.map(
          comment => comment._id === action.payload.commentId ? action.payload.comment : comment
        );
      })
      .addCase(likeComment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.error?.message || 'Failed to like comment';
      })
      .addCase(unlikeComment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(unlikeComment.fulfilled, (state, action) => {
        const blogId = action.meta.arg.blogId;
        const blogComments = state.commentsByBlog[blogId] || [];
        state.commentsByBlog[blogId] = blogComments.map(
          comment => comment._id === action.payload.commentId ? action.payload.comment : comment
        );
        
        // Update userComments if present
        state.userComments = state.userComments.map(
          comment => comment._id === action.payload.commentId ? action.payload.comment : comment
        );
        
        state.status = 'succeeded';
      })
      .addCase(unlikeComment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to unlike comment';
      });
  }
});

export const { clearCommentError, resetCommentState } = commentSlice.actions;
export default commentSlice.reducer;

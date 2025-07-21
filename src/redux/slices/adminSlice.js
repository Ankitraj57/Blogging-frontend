import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

// Async thunks

export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return rejectWithValue('Unauthorized: Admin access required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        validateStatus: function (status) {
          return status >= 200 && status < 300; // default
        },
      };

      const response = await axios.get(`${API_URL}/admin/users`, config);
      
      if (response.status === 403) {
        return rejectWithValue('Forbidden: Insufficient permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('Fetch users error:', error.response?.data);
      return rejectWithValue({
        message: error.response?.data?.message || 'Error fetching users',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return rejectWithValue('Unauthorized: Admin access required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        validateStatus: function (status) {
          return status >= 200 && status < 300; // default
        },
      };

      const response = await axios.delete(`${API_URL}/admin/users/${userId}`, config);
      
      if (response.status === 403) {
        return rejectWithValue('Forbidden: Insufficient permissions');
      }
      
      return userId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error deleting user'
      );
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'admin/toggleUserStatus',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return rejectWithValue('Unauthorized: Admin access required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        validateStatus: function (status) {
          return status >= 200 && status < 300; // default
        },
      };

      const currentUser = getState().admin.users.data.users.find(u => u._id === userId);
      if (!currentUser) {
        return rejectWithValue('User not found');
      }

      const response = await axios.patch(`${API_URL}/admin/users/${userId}/status`, 
        { isActive: !currentUser.isActive },
        config
      );

      if (response.status === 403) {
        return rejectWithValue('Forbidden: Insufficient permissions');
      }
      
      return response.data;
    } catch (error) {
      console.error('Toggle status error:', error.response?.data);
      return rejectWithValue({
        message: error.response?.data?.message || 'Error updating user status',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

// Analytics thunks
export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${API_URL}/api/admin/analytics`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error fetching analytics'
      );
    }
  }
);

const initialState = {
  users: [],
  loading: false,
  error: null,
  analytics: {
    totalUsers: 0,
    totalPosts: 0,
    activeUsers: 0,
    postsLast30Days: [],
    usersByRole: {},
  },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete user
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Toggle user status
    builder.addCase(toggleUserStatus.fulfilled, (state, action) => {
      const index = state.users.findIndex(
        (user) => user._id === action.payload._id
      );
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    });

    // Fetch analytics
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;

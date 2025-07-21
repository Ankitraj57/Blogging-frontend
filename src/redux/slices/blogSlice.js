import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogApi } from '../../services/api';

// Async thunks for blog operations
export const createBlog = createAsyncThunk(
  'blogs/create',
  async (blogData, { rejectWithValue, getState }) => {
    try {
      const { token, user } = getState().auth;
      if (!token || !user) {
        throw new Error('User not authenticated');
      }
      
      // Prepare the data to match backend expectations
      const requestData = {
        title: blogData.title,
        content: blogData.content,
        category: blogData.category || 'uncategorized',
        image: blogData.image || '',
        tags: blogData.tags || [],
        status: blogData.status || 'draft',
        author: user.id
      };
      
      const response = await blogApi.createBlog(requestData);
      
      // Add author information to the created blog post
      const blogWithAuthor = {
        ...response.data.blog,
        author: {
          _id: user.id,
          name: user.name,
          email: user.email
        }
      };
      
      return {
        ...response.data,
        blog: blogWithAuthor
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create blog");
    }
  }
);

export const deleteBlog = createAsyncThunk(
  'blogs/delete',
  async (blogId, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      if (!user) {
        throw new Error('Please log in to delete this post');
      }
      
      try {
        const response = await blogApi.deleteBlog(blogId);
        if (!response || response.status >= 400) {
          throw new Error(response?.data?.message || response?.data?.error || 'Failed to delete blog post');
        }
        return { blogId, success: true };
      } catch (error) {
        console.error('Error deleting blog:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBlog thunk:', error);
      return rejectWithValue({
        message: error.message || 'Failed to delete blog post',
        details: error.response?.data || null
      });
    }
  }
);

export const fetchBlogs = createAsyncThunk(
  'blogs/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    console.log('[Blogs] Starting to fetch blogs...');
    try {
      const { user } = getState().auth;
      console.log('[Blogs] Current user:', user ? 'Authenticated' : 'Not authenticated');
      
      const response = await blogApi.getBlogs();
      console.log('[Blogs] Raw API response:', response);
      
      // Handle different response formats
      let blogs = [];
      if (Array.isArray(response.data)) {
        blogs = response.data;
      } else if (response.data && Array.isArray(response.data.blogs)) {
        blogs = response.data.blogs;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        blogs = response.data.data;
      }
      
      console.log(`[Blogs] Processed ${blogs.length} blogs from API`);
      
      // Ensure all blogs have proper author information and comments
      const blogsWithAuthors = blogs.map(blog => {
        try {
          if (!blog) {
            console.warn('[Blogs] Found null/undefined blog in response');
            return null;
          }
          
          // Ensure author information
          if (!blog.author) {
            blog.author = {
              _id: blog.authorId || 'unknown',
              name: 'Unknown Author',
              email: 'unknown@example.com'
            };
          }
          
          // Add comments count from virtual field if available
          blog.commentsCount = blog.commentsCount || blog.comments?.length || 0;
          
          // Ensure required fields have default values
          blog.status = blog.status || 'draft';
          blog.likesCount = typeof blog.likesCount === 'number' ? blog.likesCount : 0;
          blog.viewCount = typeof blog.viewCount === 'number' ? blog.viewCount : 0;
          
          // Ensure dates are properly formatted
          blog.createdAt = blog.createdAt || new Date().toISOString();
          blog.updatedAt = blog.updatedAt || new Date().toISOString();
          
          return blog;
        } catch (error) {
          console.error('[Blogs] Error processing blog:', error);
          return null;
        }
      }).filter(blog => blog !== null); // Remove any null blogs
      
      console.log(`[Blogs] Successfully processed ${blogsWithAuthors.length} blogs`);
      return blogsWithAuthors;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch blogs';
      console.error('[Blogs] Error fetching blogs:', {
        message: errorMessage,
        response: error.response,
        stack: error.stack
      });
      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const likeBlog = createAsyncThunk(
  'blogs/like',
  async (blogId, { rejectWithValue, getState, dispatch }) => {
    try {
      const { user } = getState().auth;
      if (!user) {
        throw new Error('Please log in to like this post');
      }
      
      // Ensure we have a valid blogId
      if (!blogId || typeof blogId !== 'string') {
        throw new Error('Invalid blog ID');
      }
      
      const response = await blogApi.toggleLike(blogId);
      
      // Handle different response formats
      let responseData = response.data;
      if (typeof responseData === 'object' && responseData !== null) {
        // If response is wrapped in a success/data object
        if (responseData.success === true && responseData.data) {
          responseData = responseData.data;
        }
      }
      
      // Extract values with fallbacks
      const isLiked = responseData.isLiked || false;
      const likesCount = typeof responseData.likesCount === 'number' 
        ? responseData.likesCount 
        : responseData.likes?.length || 0;
      
      // Validate the extracted values
      if (typeof isLiked !== 'boolean') {
        console.error('[Blog Like] Invalid response data:', responseData);
        throw new Error('Invalid response format');
      }
      
      // Update the blog in the list with the new like status and count
      const updatedBlog = {
        _id: blogId,
        isLiked,
        likesCount: typeof likesCount === 'number' ? likesCount : 0
      };
      
      // Update the blog in the state
      dispatch(updateBlogInList(updatedBlog));
      
      // If this is the current blog being viewed, update it as well
      const currentBlog = getState().blog.currentBlog;
      if (currentBlog?._id === blogId) {
        dispatch(setCurrentBlog({
          ...currentBlog,
          isLiked,
          likesCount: typeof likesCount === 'number' ? likesCount : 0
        }));
      }
      
      return { blogId, isLiked, likesCount };
      
    } catch (error) {
      console.error('[Blog Like] Error:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // Create detailed error object
      const errorDetails = {
        message: error.message || 'Failed to update like',
        status: error.response?.status,
        code: error.response?.data?.code,
        details: error.response?.data?.details
      };
      
      return rejectWithValue(errorDetails);
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'blogs/toggleBookmark',
  async (blogId, { rejectWithValue, getState, dispatch }) => {
    try {
      const { user } = getState().auth;
      if (!user) {
        throw new Error('Please log in to bookmark this post');
      }
      
      const response = await blogApi.toggleBookmark(blogId);
      
      if (response.status >= 400) {
        const errorMessage = response.data?.error || response.data?.message || 'Failed to toggle bookmark';
        throw new Error(errorMessage);
      }
      
      // Get the updated bookmark status from the response
      const { isBookmarked } = response.data;
      
      // Update the blog in the list with the new bookmark status
      const updatedBlog = {
        _id: blogId,
        isBookmarked
      };
      
      // Update the blog in the state
      dispatch(updateBlogInList(updatedBlog));
      
      // If this is the current blog being viewed, update it as well
      const currentBlog = getState().blog.currentBlog;
      if (currentBlog?._id === blogId) {
        dispatch(setCurrentBlog({
          ...currentBlog,
          isBookmarked
        }));
      }
      
      // Get the updated saved posts from the response
      const savedPosts = response.data.savedPosts || [];
      return { blogId, isBookmarked, savedPosts };
      
    } catch (error) {
      console.error('Error in toggleBookmark thunk:', error);
      return rejectWithValue({
        message: error.message || 'Failed to update bookmark',
        details: error.response?.data || null
      });
    }
  }
);

export const fetchBlogById = createAsyncThunk(
  'blogs/fetchById',
  async (blogId, { rejectWithValue, getState }) => {
    try {
      const response = await blogApi.getBlogById(blogId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch blog post");
    }
  }
);

export const updateBlog = createAsyncThunk(
  'blogs/update',
  async ({ id, ...blogData }, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      if (!user) {
        throw new Error('Please log in to update this post');
      }
      
      const response = await blogApi.updateBlog(id, blogData);
      
      if (response.status >= 400) {
        const errorMessage = response.data?.error || response.data?.message || 'Failed to update blog post';
        throw new Error(errorMessage);
      }
      
      // Update the blog in the state
      const updatedBlog = response.data;
      
      // If this is the current blog being viewed, update it as well
      // The current blog will be updated through the extraReducers
      // No need to dispatch here as it will be handled by the fulfilled action
      
      return updatedBlog;
      
    } catch (error) {
      console.error('Error in updateBlog thunk:', error);
      return rejectWithValue({
        message: error.message || 'Failed to update blog post',
        details: error.response?.data || null
      });
    }
  }
);



const initialState = {
  blogs: [],
  currentBlog: null,
  loading: false,
  error: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  bookmarks: [],
  savedPosts: []
};

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setBlogs: (state, action) => {
      state.blogs = action.payload;
    },
    setCurrentBlog: (state, action) => {
      state.currentBlog = action.payload;
    },
    updateBlogInList: (state, action) => {
      state.blogs = state.blogs.map(blog => 
        blog._id === action.payload._id ? { ...blog, ...action.payload } : blog
      );
    },
    updateSavedPosts: (state, action) => {
      state.savedPosts = action.payload;
    },
    updateError: (state, action) => {
      state.error = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
    },
    resetBlogState: () => initialState
  },
  extraReducers: (builder) => {
    // Create Blog
    builder.addCase(createBlog.pending, (state) => {
      state.loading = true;
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(createBlog.fulfilled, (state, action) => {
      state.loading = false;
      state.status = 'succeeded';
      state.blogs.unshift(action.payload);
    });
    builder.addCase(createBlog.rejected, (state, action) => {
      state.loading = false;
      state.status = 'failed';
      state.error = action.payload;
    });

    // Delete Blog
    builder.addCase(deleteBlog.pending, (state) => {
      state.loading = true;
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(deleteBlog.fulfilled, (state, action) => {
      state.loading = false;
      state.status = 'succeeded';
      const { blogId } = action.meta.arg;
      state.blogs = state.blogs.filter(blog => blog._id !== blogId);
      if (state.currentBlog?._id === blogId) {
        state.currentBlog = null;
      }
    });
    builder.addCase(deleteBlog.rejected, (state, action) => {
      state.loading = false;
      state.status = 'failed';
      state.error = action.payload;
    });

    // Fetch All Blogs
    builder.addCase(fetchBlogs.pending, (state) => {
      state.loading = true;
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchBlogs.fulfilled, (state, action) => {
      console.log('[Blogs] fetchBlogs.fulfilled - Updating state with new blogs');
      state.loading = false;
      state.status = 'succeeded';
      state.error = null;
      
      try {
        // Ensure we're working with an array
        const blogs = Array.isArray(action.payload) ? action.payload : [];
        console.log(`[Blogs] Processing ${blogs.length} blogs for state update`);
        
        // Normalize blog data
        state.blogs = blogs.map(blog => {
          try {
            if (!blog) {
              console.warn('[Blogs] Found null/undefined blog in payload');
              return null;
            }
            
            const processedBlog = {
              ...blog,
              // Ensure required fields have default values
              _id: blog._id || `temp_${Math.random().toString(36).substr(2, 9)}`,
              title: blog.title || 'Untitled',
              content: blog.content || '',
              status: blog.status || 'draft',
              likesCount: typeof blog.likesCount === 'number' ? blog.likesCount : 
                (Array.isArray(blog.likes) ? blog.likes.length : 
                (Array.isArray(blog.likesArray) ? blog.likesArray.length : 
                (Array.isArray(blog.likesIds) ? blog.likesIds.length : 
                (blog.likesTotal || blog.totalLikes || 0)))),
              commentsCount: typeof blog.commentsCount === 'number' ? blog.commentsCount : 0,
              viewCount: typeof blog.viewCount === 'number' ? blog.viewCount : 0,
              // Ensure author object has required fields
              author: blog.author ? {
                _id: blog.author._id || blog.author.id || 'unknown',
                name: blog.author.name || 'Anonymous',
                email: blog.author.email || '',
                ...blog.author
              } : { 
                _id: 'unknown', 
                name: 'Anonymous', 
                email: '' 
              },
              // Ensure dates are properly formatted
              createdAt: blog.createdAt || new Date().toISOString(),
              updatedAt: blog.updatedAt || new Date().toISOString()
            };
            
            return processedBlog;
          } catch (error) {
            console.error('[Blogs] Error processing blog in reducer:', error, blog);
            return null;
          }
        }).filter(blog => blog !== null); // Remove any null blogs
        
        console.log(`[Blogs] Successfully updated state with ${state.blogs.length} blogs`);
      } catch (error) {
        console.error('[Blogs] Error in fetchBlogs.fulfilled reducer:', error);
        state.error = {
          message: 'Error processing blog data',
          details: error.message
        };
      }
    });
    builder.addCase(fetchBlogs.rejected, (state, action) => {
      console.error('[Blogs] fetchBlogs.rejected:', action);
      state.loading = false;
      state.status = 'failed';
      state.error = {
        message: action.payload?.message || 'Failed to fetch blogs',
        status: action.payload?.status,
        data: action.payload?.data
      };
      console.log('[Blogs] Updated error state:', state.error);
    });
    
    // Fetch Blog By ID
    builder.addCase(fetchBlogById.pending, (state) => {
      state.loading = true;
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchBlogById.fulfilled, (state, action) => {
      state.loading = false;
      state.status = 'succeeded';
      state.currentBlog = action.payload;
    });
    builder.addCase(fetchBlogById.rejected, (state, action) => {
      state.loading = false;
      state.status = 'failed';
      state.error = action.payload;
    });
    
    // Update Blog
    builder.addCase(updateBlog.pending, (state) => {
      state.loading = true;
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(updateBlog.fulfilled, (state, action) => {
      state.loading = false;
      state.status = 'succeeded';
      state.currentBlog = action.payload;
    });
    builder.addCase(updateBlog.rejected, (state, action) => {
      state.loading = false;
      state.status = 'failed';
      state.error = action.payload;
    });

    // Like Blog
    builder.addCase(likeBlog.pending, (state) => {
      // Optimistic updates are handled in the component
    });
    builder.addCase(likeBlog.fulfilled, (state, action) => {
      // The blog in the list is already updated by the updateBlogInList action
      // Update currentBlog if it's the one being liked
      if (state.currentBlog && state.currentBlog._id === action.payload._id) {
        state.currentBlog = action.payload;
      }
    });
    builder.addCase(likeBlog.rejected, (state, action) => {
      // Error is handled in the component
      state.error = action.payload;
    });

    // Toggle Bookmark
    builder.addCase(toggleBookmark.pending, (state) => {
      // Optimistic updates are handled in the component
    });
    builder.addCase(toggleBookmark.fulfilled, (state, action) => {
      const { blogId, bookmarked, savedPosts } = action.payload;
      
      // Update bookmarks array
      state.bookmarks = savedPosts;
      
      // Update the blog in the list
      const blogIndex = state.blogs.findIndex(blog => blog._id === blogId);
      if (blogIndex !== -1) {
        state.blogs[blogIndex].isBookmarked = bookmarked;
      }
      
      // Update currentBlog if it's the one being bookmarked
      if (state.currentBlog && state.currentBlog._id === blogId) {
        state.currentBlog.isBookmarked = bookmarked;
      }
    });
    builder.addCase(toggleBookmark.rejected, (state, action) => {
      state.error = action.payload;
    });
  }
});

// Export actions
export const { 
  setBlogs,
  setCurrentBlog,
  updateBlogInList,
  updateSavedPosts,
  updateError,
  setLoading,
  clearError,
  clearCurrentBlog,
  resetBlogState,
  updateBlogCommentsCount
} = blogSlice.actions;

// Selectors
export const selectAllBlogs = (state) => state.blogs.blogs;
export const selectCurrentBlog = (state) => state.blogs.currentBlog;
export const selectBlogLoading = (state) => state.blogs.loading;
export const selectBlogError = (state) => state.blogs.error;
export const selectBlogStatus = (state) => state.blogs.status;
export const selectBookmarks = (state) => state.blogs.bookmarks;

export const selectBlogById = (state, blogId) => {
  return state.blogs.blogs.find(blog => blog._id === blogId);
};

export const selectBlogsByAuthor = (state, authorId) => {
  return state.blogs.blogs.filter(blog => blog.author?._id === authorId);
};

export const selectBlogsByCategory = (state, category) => {
  return state.blogs.blogs.filter(blog => blog.category === category);
};

export const selectRelatedBlogs = (state, currentBlogId, category, limit = 3) => {
  return state.blogs.blogs
    .filter(blog => blog._id !== currentBlogId && blog.category === category)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

export default blogSlice.reducer;

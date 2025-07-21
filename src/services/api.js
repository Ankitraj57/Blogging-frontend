import axios from 'axios';

// Set the API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with common config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for cookies/sessions
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 second timeout
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if status code is less than 500
  }
});

// Add a response interceptor to handle CORS issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({ 
        message: 'Network error: Could not connect to server',
        status: 500,
        data: { error: 'Network error' }
      });
    }
    
    if (error.response) {
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          error.response.statusText || 
                          'API error occurred';
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      return Promise.reject({ 
        message: errorMessage,
        status: error.response.status,
        data: error.response.data
      });
    }
    
    const errorMessage = error.message || 'An unknown error occurred';
    console.error('Unknown Error:', errorMessage);
    return Promise.reject({ 
      message: errorMessage,
      status: 500,
      data: { error: errorMessage }
    });
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Blog API methods
export const blogApi = {
  // Get all blogs
  getBlogs: async () => {
    try {
      console.log('[API] Fetching all blogs');
      const response = await api.get('/blogs');
      return response;
    } catch (error) {
      console.error('[API] Failed to fetch blogs:', error);
      throw error;
    }
  },

  // Get a single blog by ID
  getBlogById: async (blogId) => {
    try {
      console.log(`[API] Fetching blog with ID: ${blogId}`);
      const response = await api.get(`/blogs/${blogId}`);
      return response;
    } catch (error) {
      console.error(`[API] Failed to fetch blog ${blogId}:`, error);
      throw error;
    }
  },

  // Create a new blog
  createBlog: async (blogData) => {
    try {
      console.log('[API] Creating new blog:', blogData);
      const response = await api.post('/blogs', blogData);
      return response;
    } catch (error) {
      console.error('[API] Failed to create blog:', error);
      throw error;
    }
  },

  // Update a blog
  updateBlog: async (blogId, blogData) => {
    try {
      console.log(`[API] Updating blog ${blogId}`);
      const response = await api.put(`/blogs/${blogId}`, blogData);
      return response;
    } catch (error) {
      console.error(`[API] Failed to update blog ${blogId}:`, error);
      throw error;
    }
  },

  // Delete a blog
  deleteBlog: async (blogId) => {
    try {
      console.log(`[API] Deleting blog ${blogId}`);
      const response = await api.delete(`/blogs/${blogId}`);
      return response;
    } catch (error) {
      console.error(`[API] Failed to delete blog ${blogId}:`, error);
      throw error;
    }
  },

  // Toggle like on a blog
  toggleLike: async (blogId) => {
    try {
      console.log(`[API] Toggling like for blog ${blogId}`);
      const response = await api.post(`/blogs/${blogId}/like`);
      return response;
    } catch (error) {
      console.error(`[API] Failed to toggle like for blog ${blogId}:`, error);
      throw error;
    }
  },

  // Toggle bookmark on a blog
  toggleBookmark: async (blogId) => {
    try {
      console.log(`[API] Toggling bookmark for blog ${blogId}`);
      const response = await api.post(`/blogs/${blogId}/bookmark`);
      return response;
    } catch (error) {
      console.error(`[API] Failed to toggle bookmark for blog ${blogId}:`, error);
      throw error;
    }
  },
};

// Comment API methods
export const commentApi = {
  // Get comments for a blog post
  get: async (endpoint) => {
    try {
      const response = await api.get(endpoint, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error(`[API] Failed to fetch comments: ${error.message}`);
      throw error;
    }
  },
  
  getComments: async (blogId) => {
    if (!blogId) {
      console.log('[API] No blog ID provided');
      return { data: [] };
    }

    console.log(`[API] Fetching comments for blog ${blogId}`);
    
    try {
      const response = await api.get(`/comments/${blogId}`, {
        timeout: 30000
      });
      
      console.log('[API] Successfully fetched comments');
      
      // Transform the response to match our frontend format
      const commentsResponse = response.data || {};
      const comments = commentsResponse.data?.comments || [];
      
      // Ensure we have an array of comments
      if (!Array.isArray(comments)) {
        console.warn('[API] Invalid comments response format:', comments);
        return { data: [] };
      }
      
      // Validate each comment
      const validComments = comments
        .map(comment => {
          if (!comment || !comment._id) {
            console.warn('[API] Invalid comment:', comment);
            return null;
          }
          return {
            ...comment,
            _id: comment._id.toString(),
            parentId: comment.parentId ? comment.parentId.toString() : null,
            createdAt: comment.createdAt || new Date().toISOString(),
            updatedAt: comment.updatedAt || comment.createdAt || new Date().toISOString(),
            likes: Array.isArray(comment.likes) ? comment.likes : [],
            likesCount: typeof comment.likesCount === 'number' ? comment.likesCount : 0,
            isLiked: comment.isLiked || false
          };
        })
        .filter(Boolean); // Remove null values
      return { data: validComments };
    } catch (error) {
      console.error(`[API] Failed to fetch comments: ${error.message}`);
      throw error;
    }
  },
  // Add a new comment
  addComment: (blogId, data) => {
    return api.post(`/comments/${blogId}`, {
      text: data.text,
      parentId: data.parentId
    });
  },
  // Update a comment
  updateComment: (blogId, commentId, data) => {
    return api.put(`/comments/${blogId}/${commentId}`, {
      text: data.text
    });
  },
  // Delete a comment
  deleteComment: (blogId, commentId) => {
    return api.delete(`/comments/${blogId}/${commentId}`);
  },
  // Like a comment
  likeComment: (blogId, commentId) => {
    return api.post(`/comments/${blogId}/${commentId}/like`);
  },
  // Unlike a comment
  unlikeComment: (blogId, commentId) => {
    return api.delete(`/comments/${blogId}/${commentId}/like`);
  }
};

export default api;

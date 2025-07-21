import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaBlog, FaChartLine, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

import { fetchAllUsers, deleteUser as deleteUserAction, toggleUserStatus } from '../../redux/slices/adminSlice';
import { fetchBlogs, deleteBlog as deleteBlogAction } from '../../redux/slices/blogSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();

  // Local state
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get state from Redux store
  const { users, loading: usersLoading, error: usersError } = useSelector((state) => state.admin);
  const { blogs, loading: blogsLoading, error: blogsError } = useSelector((state) => state.blog);

  // Debug logging
  console.log('AdminDashboard state:', {
    usersLoading,
    blogsLoading,
    usersError,
    blogsError,
    users,
    blogs
  });

  // Data normalization
  const normalizedUsers = useMemo(() => {
    if (!users) return [];
    
    // Handle different possible data structures
    if (Array.isArray(users)) {
      return users.map(user => typeof user === 'object' ? user : {});
    }
    if (users?.data?.users) {
      return users.data.users.map(user => typeof user === 'object' ? user : {});
    }
    if (users?.users) {
      return users.users.map(user => typeof user === 'object' ? user : {});
    }
    
    // If we get here, we have an invalid data structure
    console.error('Invalid users data structure:', users);
    return [];
  }, [users]);

  const normalizedBlogs = useMemo(() => {
    if (!blogs) return [];
    if (Array.isArray(blogs)) return blogs;
    return blogs || [];
  }, [blogs]);

  // Debug normalized data
  console.log('Normalized data:', {
    normalizedUsers: Array.isArray(normalizedUsers) ? normalizedUsers.length : 0,
    normalizedBlogs: Array.isArray(normalizedBlogs) ? normalizedBlogs.length : 0,
    usersDataStructure: typeof users?.data?.users,
    blogsDataStructure: Array.isArray(blogs) ? 'array' : typeof blogs
  });
  
  // Debug raw state
  console.log('Raw state:', {
    users: users,
    blogs: blogs
  });

  // Debug normalized data
  console.log('Normalized data:', {
    normalizedUsers: normalizedUsers.length,
    normalizedBlogs: normalizedBlogs.length
  });





  // Filtered users with memoization
  const filteredUsers = useMemo(() => {
    if (usersLoading || !Array.isArray(normalizedUsers)) return [];
    
    return normalizedUsers
      .filter(user => {
        if (!user || typeof user !== 'object') return false;
        
        // Check if user has required fields
        const hasRequiredFields = user.email && typeof user.isActive !== 'undefined';
        const hasUsernameOrName = user.username || user.name;
        
        if (!hasRequiredFields || !hasUsernameOrName) return false;
        
        // Use username if available, otherwise use name
        const displayName = user.username || user.name || 'Unknown User';
        
        // Check if user matches search query
        const matchesSearch = searchQuery ? (
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase()?.includes(searchQuery.toLowerCase())
        ) : true;
        
        // Check if user matches active filter
        const matchesActiveFilter = showInactive ? true : user.isActive;
        
        return matchesSearch && matchesActiveFilter;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(user => ({
        ...user,
        // Ensure all required fields are strings
        username: String(user.username || user.name || 'Unknown User'),
        email: String(user.email || 'N/A'),
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null
      }));
  }, [usersLoading, normalizedUsers, searchQuery, showInactive]);

  // Filtered blogs with memoization
  const filteredBlogs = blogsLoading ? [] : 
    normalizedBlogs.filter(blog => {
      const matchesSearch = searchQuery ? (
        // Convert author to string first
        String(blog.author || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.title?.toLowerCase()?.includes(searchQuery.toLowerCase())
      ) : true;
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Calculate stats
  const stats = useMemo(() => {
    if (!Array.isArray(normalizedUsers) || !Array.isArray(normalizedBlogs)) {
      return {
        totalUsers: 0,
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0
      };
    }

    const blogStats = normalizedBlogs.reduce((stats, blog) => {
      stats.total++;
      if (blog.status === 'published') {
        stats.published++;
      } else {
        stats.draft++;
      }
      return stats;
    }, { total: 0, published: 0, draft: 0 });

    return {
      totalUsers: normalizedUsers.length,
      totalPosts: blogStats.total,
      publishedPosts: blogStats.published,
      draftPosts: blogStats.draft
    };
  }, [normalizedUsers, normalizedBlogs]);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsProcessing(true);
        // Load users and blogs
        await Promise.all([
          dispatch(fetchAllUsers()),
          dispatch(fetchBlogs())
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to load data');
      } finally {
        setIsProcessing(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Handle user actions
  const handleDeleteUser = async (userId) => {
    try {
      if (window.confirm('Are you sure you want to delete this user?')) {
        await dispatch(deleteUserAction(userId));
        toast.success('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      setIsProcessing(true);
      await dispatch(toggleUserStatus(userId));
      toast.success('User status updated successfully');
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error(error.message || 'Failed to update user status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle blog actions
  const handleDeleteBlog = async (blogId) => {
    try {
      if (window.confirm('Are you sure you want to delete this blog post?')) {
        await dispatch(deleteBlogAction(blogId));
        toast.success('Blog post deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error(error.message || 'Failed to delete blog');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (usersLoading || blogsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (usersError || blogsError) {
    return (
      <div className="error-container">
        <h2 className="error-message">Error Loading Data</h2>
        <p className="error-details">{typeof usersError === 'object' ? JSON.stringify(usersError) : usersError || typeof blogsError === 'object' ? JSON.stringify(blogsError) : blogsError}</p>
        <p className="error-refresh">Please try refreshing the page.</p>
      </div>
    );
  }

  // If users data is still null after loading, show error
  if (!users) {
    return (
      <div className="error-container">
        <h2 className="error-message">Error Loading Users</h2>
        <p className="error-details">Failed to fetch user data</p>
        <p className="error-refresh">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          >
            <FaUser className="inline text-indigo-500" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`admin-tab ${activeTab === 'blogs' ? 'active' : ''}`}
          >
            <FaBlog className="inline text-indigo-500" />
            Blogs
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-search">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search users/blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {activeTab === 'users' && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="admin-button"
            >
              {showInactive ? (
                <>
                  <FaEyeSlash className="inline" />
                  Hide Inactive
                </>
              ) : (
                <>
                  <FaEye className="inline" />
                  Show Inactive
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="stats-card">
          <div className="stats-content">
            <div className="stat-label">
              <FaUser className="inline text-indigo-500" />
              Total Users
            </div>
            <div className="stat-value-container">
              <div className="stat-value">
                {stats.totalUsers}
              </div>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stat-label">
              <FaBlog className="inline text-indigo-500" />
              Total Posts
            </div>
            <div className="stat-value-container">
              <div className="stat-value">
                {stats.totalPosts}
              </div>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stat-label">
              <FaChartLine className="inline" />
              Published Posts
            </div>
            <div className="stat-value-container">
              <div className="stat-value">
                {stats.publishedPosts}
              </div>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stat-label">
              <FaChartLine className="inline" />
              Draft Posts
            </div>
            <div className="stat-value-container">
              <div className="stat-value">
                {stats.draftPosts}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {activeTab === 'users' ? (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="section-title">
                <FaUser className="inline text-indigo-500" />
                Users Management
              </h2>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead className="admin-table-header">
                  <tr>
                    <th className="admin-table-header-cell">
                      Username
                    </th>
                    <th className="admin-table-header-cell">
                      Email
                    </th>
                    <th className="admin-table-header-cell">
                      Status
                    </th>
                    <th className="admin-table-header-cell">
                      Created
                    </th>
                    <th className="admin-table-header-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="admin-table-body">
                  {filteredUsers.map((user) => {
                    // Ensure we have valid data
                    if (!user || typeof user !== 'object' || !user._id) {
                      console.error('Invalid user data:', user);
                      return null;
                    }

                    const displayName = user.username || user.name || 'Unknown User';

                    return (
                      <tr key={user._id}>
                        <td className="admin-table-cell">
                          <div className="table-cell-text">{displayName}</div>
                        </td>
                        <td className="admin-table-cell">
                          <div className="table-cell-text-muted">{user.email}</div>
                        </td>
                        <td className="admin-table-cell">
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="admin-table-cell">
                          <div className="table-cell-text-muted">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="">
                          <button
                            onClick={() => handleToggleUserStatus(user._id)}
                            className={`action-button ${user.isActive ? 'deactivate' : 'activate'}`}
                          >
                            <FaEyeSlash className="inline" />
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="action-button delete"
                          >
                            <FaTrash className="inline" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="section-title">
                <FaBlog className="inline text-indigo-500" />
                Blog Management
              </h2>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead className="admin-table-header">
                  <tr>
                    <th className="admin-table-header-cell">
                      Title
                    </th>
                    <th className="admin-table-header-cell">
                      Author
                    </th>
                    <th className="admin-table-header-cell">
                      Status
                    </th>
                    <th className="admin-table-header-cell">
                      Created
                    </th>
                    <th className="admin-table-header-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="admin-table-body">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog._id}>
                      <td className="admin-table-cell">
                        <div className="table-cell-text">{blog.title}</div>
                      </td>
                      <td className="admin-table-cell">
                        <div className="table-cell-text-muted">{blog.author}</div>
                      </td>
                      <td className="admin-table-cell">
                        <span className={`status-badge ${blog.status === 'published' ? 'active' : 'draft'}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="admin-table-cell">
                        <div className="table-cell-text-muted">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="">
                        <button
                          onClick={() => handleDeleteBlog(blog._id)}
                          className=""
                        >
                          <FaTrash className="inline" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

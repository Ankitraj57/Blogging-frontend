import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaFileAlt, 
  FaUsers,
  FaEye,
  FaFilter,
  FaUser
} from "react-icons/fa";
import { fetchBlogs } from "../redux/slices/blogSlice";
import '../styles/Dashboard.css';

// Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

function Dashboard() {
  // Hooks must be called at the top level, before any conditional returns
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { blogs, loading, error } = useSelector((state) => state.blog);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'draft', 'published'
  const [authorFilter, setAuthorFilter] = useState('all'); // 'all', 'me'

  // Memoized process blogs function


  // Memoized process blogs function
  const processBlogs = React.useCallback((blogsData) => {
    // Handle both array and object response formats
    const blogs = Array.isArray(blogsData) ? blogsData : blogsData?.data || [];
    
    if (!blogs || blogs.length === 0) {
      return [];
    }
    
    return blogs
      .map((blog, index) => {
        try {
          if (!blog || !blog._id) {
            return null;
          }
          
          // Extract author information
          const author = blog.author || {};
          const authorId = author._id || blog.authorId || 'unknown';
          const authorName = author.name || author.username || 'Unknown Author';
          
          // Handle API response object
          const blogData = blog.blog || blog;
          
          // Ensure required fields have default values
          const processedBlog = {
            _id: blogData._id || `temp-${Date.now()}-${index}`,
            title: blogData.title || 'Untitled',
            content: blogData.content || '',
            status: blogData.status || 'draft',
            likes: Array.isArray(blogData.likes) ? blogData.likes : [],
            comments: Array.isArray(blogData.comments) ? blogData.comments : [],
            likesCount: typeof blogData.likesCount === 'number' ? blogData.likesCount : (blogData.likes?.length || 0),
            commentsCount: typeof blogData.commentsCount === 'number' ? blogData.commentsCount : (blogData.comments?.length || 0),
            viewCount: typeof blogData.viewCount === 'number' ? blogData.viewCount : (blogData.views || 0),
            authorInfo: {
              id: authorId,
              name: authorName,
              isCurrentUser: user && String(authorId) === String(user.id)
            },
            // Ensure dates are properly formatted
            createdAt: blogData.createdAt || new Date().toISOString(),
            updatedAt: blogData.updatedAt || blogData.createdAt || new Date().toISOString()
          };
          
          return processedBlog;
        } catch (error) {
          console.error(`Error processing blog at index ${index}:`, error, blog);
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries
  }, [user]);

  // Memoized filter blogs function
  const filterBlogs = React.useCallback((blogsToFilter, authorFilterValue, statusFilterValue) => {
    let result = [...blogsToFilter];
    
    // Filter by author
    if (authorFilterValue === 'me' && user) {
      result = result.filter(blog => blog.author?._id === user.id);
    } else if (authorFilterValue === 'all') {
      // Show all posts when author filter is set to 'all'
    }
    
    // Filter by status
    if (statusFilterValue !== 'all') {
      result = result.filter(blog => blog.status === statusFilterValue);
    }
    
    // Sort by creation date, newest first
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return result;
  }, [user]);

  // Process blogs with useMemo
  const processedBlogs = React.useMemo(
    () => processBlogs(blogs),
    [blogs, processBlogs]
  );

  // Apply filters with useMemo
  const filteredBlogs = React.useMemo(
    () => filterBlogs(processedBlogs, authorFilter, statusFilter),
    [processedBlogs, authorFilter, statusFilter, filterBlogs]
  );

  // Fetch blogs on mount
  useEffect(() => {
    console.log('Fetching blogs...');
    dispatch(fetchBlogs());
  }, [dispatch]);

  // Log user and blogs data for debugging
  useEffect(() => {
    if (blogs.length > 0) {
      console.log('First blog data:', {
        id: blogs[0]._id,
        author: blogs[0].author,
        title: blogs[0].title
      });
    }
  }, [user, blogs]);

  // Early returns after all hooks
  if (!user) return <p>Loading user data...</p>;
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            Error loading blogs: {error}
          </p>
        </div>
      </div>
    </div>
  );


  
  // Calculate statistics
  const stats = {
    totalPosts: filteredBlogs.length,
    draftPosts: filteredBlogs.filter(blog => blog.status === 'draft').length,
    publishedPosts: filteredBlogs.filter(blog => blog.status === 'published').length,
    totalLikes: processedBlogs.reduce((sum, blog) => sum + (Number(blog.likesCount) || 0), 0),
    totalComments: processedBlogs.reduce((sum, blog) => sum + (Number(blog.commentsCount) || 0), 0),
    totalViews: processedBlogs.reduce((sum, blog) => sum + (Number(blog.viewCount) || 0), 0),
  };

  // Filter controls
  const FilterControls = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <span className="font-medium">Filters:</span>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        
        {/* Author Filter */}
        <div className="flex items-center space-x-2">
          <select 
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Authors</option>
            <option value="me">My Posts</option>
          </select>
        </div>
      </div>
      
      {/* Active filters info */}
      <div className="mt-2 text-sm text-gray-600">
        Showing {filteredBlogs.length} of {blogs.length} posts
        {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
        {authorFilter === 'me' && ' • My posts only'}
      </div>
    </div>
  );

  // Stats data
  const statsData = [
    { 
      name: 'Draft Posts', 
      value: formatNumber(stats.draftPosts), 
      icon: FaFileAlt, 
      color: 'from-yellow-500 to-amber-600',
      description: 'Your draft articles',
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500'
    },
    { 
      name: 'Published', 
      value: formatNumber(stats.publishedPosts), 
      icon: FaFileAlt, 
      color: 'from-blue-500 to-indigo-600',
      description: 'Your published articles',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    { 
      name: 'Likes', 
      value: formatNumber(stats.totalLikes), 
      icon: FaUsers, 
      color: 'from-rose-500 to-rose-600',
      description: 'Total likes on your posts',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-500'
    },
    { 
      name: 'Comments', 
      value: formatNumber(stats.totalComments), 
      icon: FaUsers, 
      color: 'from-emerald-500 to-green-600',
      description: 'Total comments on your posts',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500'
    },
    { 
      name: 'Views', 
      value: formatNumber(stats.totalViews), 
      icon: FaEye, 
      color: 'from-purple-500 to-indigo-600',
      description: 'Total views on your posts',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500'
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Dashboard Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">


          <div className="greeting">
            <h1>{getGreeting()}, {user?.name || 'User'}</h1>
            <p>Welcome to your dashboard</p>
          </div>
          <div className="dashboard-actions">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/create-post')}
            >
              <FaPlus /> Create New Post
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <FilterControls />

        {/* Stats Grid */}
        <div className="stats-grid">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="stat-card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.iconBg} mr-4`}>
                    <Icon className={`text-xl ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.name}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Blog Posts */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            {authorFilter === 'me' ? 'Your Blog Posts' : 'All Blog Posts'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Likes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Comments
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBlogs.map((blog) => (
                  <tr key={`blog-${blog._id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td key={`title-${blog._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {blog.title}
                      </div>
                    </td>
                    <td key={`status-${blog._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            blog.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {blog.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          {!blog.authorInfo.isCurrentUser && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <FaUser className="mr-1" size={10} />
                              {blog.authorInfo.name || 'Unknown Author'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td key={`date-${blog._id}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td key={`likes-${blog._id}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {blog.likes?.length || 0}
                    </td>
                    <td key={`comments-${blog._id}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {blog.comments?.length || 0}
                    </td>
                    <td key={`views-${blog._id}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {blog.views || 0}
                    </td>
                    <td key={`actions-${blog._id}`} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        key={`view-${blog._id}`}
                        onClick={() => navigate(`/blog/${blog._id}`)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        View
                      </button>
                      <button
                        key={`edit-${blog._id}`}
                        onClick={() => navigate(`/blog/edit/${blog._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBlogs.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {authorFilter === 'me' 
                  ? 'You haven\'t written any posts yet. Create your first post!'
                  : 'No posts found matching your filters.'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

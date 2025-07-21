import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import BlogList from '../components/BlogList';
import { FaBookmark, FaSpinner } from 'react-icons/fa';
import { fetchBlogs } from '../redux/slices/blogSlice';
import '../styles/SavedPosts.css';
import { createSelector } from '@reduxjs/toolkit';

// Selectors
const selectAuth = createSelector(
  (state) => state?.auth,
  (auth) => auth || {}
);

const selectBlogs = createSelector(
  (state) => state.blog.blogs,
  (blogs) => blogs || []
);

const selectSavedPosts = createSelector(
  (state) => state.blog.savedPosts,
  (savedPosts) => savedPosts || []
);

// Custom selector for filtered saved blogs
const selectSavedBlogs = createSelector(
  [selectBlogs, selectSavedPosts],
  (blogs, savedPosts) => {
    if (!Array.isArray(blogs) || !Array.isArray(savedPosts)) return [];
    
    return blogs
      .filter((blog) => savedPosts.includes(blog._id))
      .sort((a, b) => {
        // Get saved date from blog data or use current time if not available
        const aSavedDate = a?.savedAt || new Date().toISOString();
        const bSavedDate = b?.savedAt || new Date().toISOString();
        return new Date(bSavedDate) - new Date(aSavedDate);
      });
  }
);

const SavedPosts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get user data and check if user is authenticated
  const { isAuthenticated, user } = useSelector(selectAuth) || {};
  const savedBlogs = useSelector(selectSavedBlogs) || []; // Use our custom selector
  const loading = useSelector(state => state.blogs?.loading || false);
  const error = useSelector(state => state.blogs?.error || null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch blogs if not already loaded
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBlogs());
    }
  }, [dispatch, isAuthenticated]); // Remove blogs since it's not needed
  
  // Show loading state
  if (loading || !user) {
    return (
      <div className="loadingState">
        <FaSpinner className="spin" />
        <p>Loading your saved posts...</p>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="errorState">
        <p>Error loading posts. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="savedPostsContainer">
      <div className="savedHeader">
        <h1 className="savedTitle">
          <FaBookmark className="savedIcon" />
          Saved Posts
        </h1>
        <p className="savedSubtitle">
          {savedBlogs.length > 0 
            ? `You have ${savedBlogs.length} saved post${savedBlogs.length !== 1 ? 's' : ''}`
            : "You haven't saved any posts yet."}
        </p>
      </div>
      
      {savedBlogs.length > 0 ? (
        <BlogList blogs={savedBlogs} />
      ) : (
        <div className="emptyState">
          <div className="emptyIcon">
            <FaBookmark size={48} />
          </div>
          <p className="emptyText">
            {loading ? 'Loading your saved posts...' : 'You haven\'t saved any posts yet.'}
          </p>
          <Link to="/blog" className="exploreLink">
            Explore Posts
          </Link>
        </div>
      )}
    </div>
  );
};

export default SavedPosts;

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowRight, FaHeart, FaComment } from 'react-icons/fa';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { fetchComments } from '../redux/slices/commentSlice';
import '../styles/BlogList.css';

const BlogList = ({ blogs, category }) => {
  const dispatch = useDispatch();

  // Fetch comments for each blog when component mounts
  useEffect(() => {
    if (Array.isArray(blogs)) {
      blogs.forEach(blog => {
        dispatch(fetchComments(blog._id));
      });
    }
  }, [blogs, dispatch]);


  if (!Array.isArray(blogs)) return null;
  
  if (blogs.length === 0) {
    return (
      <div className="blog-list-empty">
        <h3>No posts found</h3>
        <p>Be the first to write something amazing!</p>
      </div>
    );
  }

  return (
    <div className="blog-list">
      {blogs.map((blog) => (
        <article key={blog._id} className="blog-card">
          <div className="blog-image-container">
            <img 
              src={blog.image || 'https://via.placeholder.com/400x200?text=Blog+Image'} 
              alt={blog.title} 
              className="blog-image"
            />
            <div className="overlay">
              <div className="overlay-text">
                <span className="category-tag">{blog.category || 'Uncategorized'}</span>
              </div>
            </div>
          </div>
          
          <div className="blog-content">
            <div className="blog-meta-top">
              <div className="blog-date">
                <FaCalendarAlt /> {format(new Date(blog.createdAt), 'MMM d, yyyy')}
              </div>
              <div className="blog-author">
                <FaUser /> {blog.author?.username || 'Admin'}
              </div>
            </div>
            
            <h2 className="blog-title">
              <Link to={`/blog/${blog._id}`}>
                {blog.title}
              </Link>
            </h2>
            
            <p className="blog-excerpt">
              {blog.content.replace(/<[^>]+>/g, '').substring(0, 150)}...
            </p>
            
            <div className="blog-meta-bottom">
              <div className="read-more">
                <Link to={`/blog/${blog._id}`}>
                  <span>Read More</span>
                  <FaArrowRight />
                </Link>
              </div>
              <div className="blog-stats">
                <span className="comments-count">
                  <FaComment /> {blog.commentsCount || 0}
                </span>
                <span className="likes-count">
                  <FaHeart /> {blog.likes?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default BlogList;

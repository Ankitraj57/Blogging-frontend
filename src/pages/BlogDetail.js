import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCurrentBlog, 
  fetchBlogById, 
  likeBlog, 
  deleteBlog 
} from '../redux/slices/blogSlice';
import { fetchComments } from '../redux/slices/commentSlice';
import { 
  FaHeart, 
  FaComment, 
  FaUser, 
  FaCalendarAlt, 
  FaTag, 
  FaEdit, 
  FaTrash, 
  FaArrowLeft,
  FaRegBookmark,
  FaBookmark,
  FaShare,
  FaEllipsisH
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import CommentSection from '../components/CommentSection';
import { formatDistanceToNow } from 'date-fns';
import ShareModal from '../components/ShareModal';
import '../styles/BlogDetail.css';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { blogs, currentBlog, loading, error } = useSelector((state) => state.blog);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  console.log('[BlogDetail] Blog ID:', id);
  console.log('[BlogDetail] Current blog:', currentBlog);
  
  const [liked, setLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update component state from blog data
  const updateBlogState = useCallback((blog) => {
    // Handle both array and number types for likes
    const likesCount = typeof blog.likes === 'number' 
      ? blog.likes 
      : (Array.isArray(blog.likes) ? blog.likes.length : 0);
      
    setLikeCount(likesCount);
    // Update comment count from blog's commentsCount field
    setCommentCount(blog.commentsCount || 0);
    
    // For liked status, we'll rely on the isLiked flag if it exists
    // Otherwise, fall back to checking the array (for backward compatibility)
    const isLiked = typeof blog.isLiked === 'boolean' 
      ? blog.isLiked 
      : (Array.isArray(blog.likes) ? blog.likes.includes(user?._id) : false);
      
    setLiked(isLiked);
    setIsBookmarked(blog.bookmarks?.includes?.(user?._id) || false);
  }, [user?._id]);

  // Fetch blog data
  useEffect(() => {
    const loadBlog = async () => {
      try {
        // Don't try to load if this is a new blog
        if (id === 'new') {
          dispatch(setCurrentBlog({
            title: '',
            content: '',
            tags: [],
            createdAt: new Date().toISOString()
          }));
          return;
        }
        
        // Try to find in existing blogs first
        const existingBlog = blogs.find(b => b._id === id);
        
        if (existingBlog) {
          dispatch(setCurrentBlog(existingBlog));
          updateBlogState(existingBlog);
        } else {
          // If not found, fetch the specific blog
          const resultAction = await dispatch(fetchBlogById(id));
          if (fetchBlogById.fulfilled.match(resultAction)) {
            // Fetch comments after blog data is loaded
            dispatch(fetchComments(id));
            updateBlogState(resultAction.payload);
          }
        }
      } catch (err) {
        console.error('Error loading blog:', err);
        toast.error('Failed to load blog post');
      }
    };
    
    loadBlog();
    
    // Cleanup on unmount
    return () => {
      dispatch(setCurrentBlog(null));
    };
  }, [id, dispatch, blogs, updateBlogState]);

  const handleLike = async () => {
    // Prevent liking a blog post that hasn't been created yet
    if (id === 'new') {
      toast.info('Please save the blog post first before liking it');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please log in to like this post');
      navigate('/login', { state: { from: `/blog/${id}` } });
      return;
    }
    
    try {
      const resultAction = await dispatch(likeBlog(id));
      
      if (likeBlog.fulfilled.match(resultAction)) {
        // Update local state with the updated blog data
        const updatedBlog = resultAction.payload;
        setLikeCount(updatedBlog.likes);
        setLiked(updatedBlog.isLiked);
        
        // Show success message
        toast.success(updatedBlog.isLiked ? 'Liked! ❤️' : 'Like removed');
      } else if (likeBlog.rejected.match(resultAction)) {
        const errorDetails = resultAction.payload || {};
        const errorMessage = errorDetails.message || 'Failed to update like';
        
        console.error('[Blog Like] Error:', {
          message: errorMessage,
          status: errorDetails.status,
          code: errorDetails.code,
          details: errorDetails.details
        });
        
        // Handle specific error cases
        if (errorMessage.includes('not authenticated')) {
          toast.error('Please log in to like this post');
          navigate('/login', { state: { from: `/blog/${id}` } });
        } else if (errorMessage.includes('not found')) {
          toast.error('Blog post not found');
        } else if (errorMessage.includes('Invalid blog ID')) {
          toast.error('Invalid blog post');
        } else if (errorMessage.includes('Invalid response')) {
          toast.error('Failed to update like. Please try again.');
        } else {
          toast.error(errorMessage || 'An unexpected error occurred');
        }
      }
    } catch (error) {
      console.error('Unexpected error in handleLike:', error);
      toast.error('An unexpected error occurred while processing your request');
    }
  };
  
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to save this post');
      navigate('/login', { state: { from: `/blog/${id}` } });
      return;
    }
    
    try {
      // Toggle bookmark state
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      // Here you would typically make an API call to update bookmarks
      // await dispatch(toggleBookmark({ blogId: id }));
      
      toast.success(newBookmarkState ? 'Post saved to your bookmarks' : 'Post removed from bookmarks');
    } catch (err) {
      console.error('Error updating bookmark:', err);
      setIsBookmarked(!isBookmarked); // Revert on error
      toast.error('Failed to update bookmark');
    }
  };
  
  const handleShare = () => {
    setShowShareModal(true);
  };
  
  const handleEdit = () => {
    if (user?._id === currentBlog?.author?._id || user?.role === 'admin') {
      navigate(`/blog/edit/${id}`);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const resultAction = await dispatch(deleteBlog(id));
      
      if (deleteBlog.fulfilled.match(resultAction)) {
        toast.success('Post deleted successfully');
        navigate('/');
      } else {
        throw new Error(resultAction.payload || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const isAuthor = user?._id === currentBlog?.author?._id || user?.role === 'admin';

  if (loading && !currentBlog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    // Extract error message from various possible error object structures
    const errorMessage = error?.message || 
                        error?.details?.message || 
                        error?.error?.message || 
                        error?.toString() || 
                        'An unexpected error occurred';

    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errorMessage}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentBlog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Post not found</h2>
        <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaArrowLeft className="mr-2" />
          Back to all posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back</span>
        </button>
      </div>
      
      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Blog image */}
        {currentBlog.image && (
          <div className="relative h-64 md:h-96 w-full overflow-hidden">
            <img 
              src={currentBlog.image} 
              alt={currentBlog.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="p-6 md:p-8 relative">
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            {isAuthenticated && (
              <button
                onClick={handleBookmark}
                className="p-2 rounded-full bg-white bg-opacity-80 hover:bg-gray-100 transition-colors"
                aria-label={isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}
              >
                {isBookmarked ? (
                  <FaBookmark className="text-yellow-500" />
                ) : (
                  <FaRegBookmark className="text-gray-500" />
                )}
              </button>
            )}
            
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white bg-opacity-80 hover:bg-gray-100 transition-colors"
              aria-label="Share post"
            >
              <FaShare className="text-gray-500" />
            </button>
            
            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 rounded-full bg-white bg-opacity-80 hover:bg-gray-100 transition-colors"
                  aria-label="More options"
                >
                  <FaEllipsisH className="text-gray-500" />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        handleEdit();
                        setShowOptions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaEdit className="mr-2" />
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowOptions(false);
                      }}
                      disabled={isDeleting}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <FaTrash className="mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Post'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4">
            <Link 
              to={`/profile/${currentBlog.author?.username}`} 
              className="flex items-center mr-4 hover:text-blue-600 transition-colors"
            >
              <FaUser className="mr-1" />
              {currentBlog.author?.username || 'Anonymous'}
            </Link>
            
            <span className="flex items-center mr-4">
              <FaCalendarAlt className="mr-1" />
              {currentBlog.createdAt ? (
                <>
                  {formatDistanceToNow(new Date(currentBlog.createdAt), { addSuffix: true })}
                  {currentBlog.updatedAt && 
                   new Date(currentBlog.updatedAt).getTime() > new Date(currentBlog.createdAt).getTime() && (
                    <span className="ml-1 text-xs text-gray-400">(edited)</span>
                  )}
                </>
              ) : (
                'Just now'
              )}
            </span>
            
            {currentBlog.category && (
              <Link 
                to={`/category/${currentBlog.category}`}
                className="ml-0 md:ml-4 mt-2 md:mt-0 flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <FaTag className="mr-1 text-xs" />
                {currentBlog.category}
              </Link>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            {currentBlog.title}
          </h1>
          
          {/* Tags */}
          {currentBlog.tags && currentBlog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {currentBlog.tags.map((tag, index) => (
                <Link 
                  key={index}
                  to={`/tag/${tag}`}
                  className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* Content */}
          <div 
            className="prose max-w-none mb-8 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-lg prose-img:shadow-md"
          >
            <div className="prose max-w-none">
              {currentBlog?.content ? currentBlog.content.replace(/<[^>]+>/g, '').split('\n').map((line, i) => (
                <p key={i} className="mb-4">{line}</p>
              )) : 'No content available'}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between border-t border-b border-gray-100 py-4 my-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLike}
                disabled={id === 'new'}
                className={`flex items-center space-x-1 ${id === 'new' ? 'text-gray-300 cursor-not-allowed' : liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                aria-label={id === 'new' ? 'Save the post to like it' : liked ? 'Unlike this post' : 'Like this post'}
                title={id === 'new' ? 'Save the post to like it' : ''}
              >
                <FaHeart className={`${liked ? 'fill-current' : ''} text-lg`} />
                <span className="text-sm font-medium">
                  {likeCount > 0 ? likeCount : ''} {likeCount === 1 ? 'Like' : 'Likes'}
                </span>
              </button>
              
              <button 
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                onClick={() => {
                  const commentsSection = document.getElementById('comments');
                  if (commentsSection) {
                    commentsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <FaComment className="text-lg" />
                <span className="text-sm font-medium">
                  {commentCount > 0 ? commentCount : ''} {commentCount === 1 ? 'Comment' : 'Comments'}
                </span>
              </button>
            </div>
            
            <div className="mt-2 sm:mt-0">
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <FaShare className="text-lg" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>
          
          {/* Author Bio */}
          {currentBlog?.author && (
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {currentBlog?.author?.username ? currentBlog.author.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {currentBlog?.author?.name || currentBlog?.author?.username || 'Unknown Author'}
                      </h4>
                      {currentBlog?.author?.bio && (
                        <p className="mt-1 text-gray-600">
                          {currentBlog.author.bio}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>{currentBlog.author.postsCount || 0} posts</span>
                        <span className="mx-2">•</span>
                        <span>{currentBlog.author.followersCount || 0} followers</span>
                      </div>
                    </div>
                    {isAuthenticated && user._id !== currentBlog.author._id && (
                      <button className="action-button follow-button">
                        Follow
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Related Posts */}
          {currentBlog.relatedPosts && currentBlog.relatedPosts.length > 0 && (
            <div className="related-posts">
              <h3 className="section-title">You might also like</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentBlog.relatedPosts.slice(0, 2).map(post => (
                  <Link 
                    key={post._id} 
                    to={`/blog/${post.slug || post._id}`}
                    className="related-post-card"
                  >
                    <h4 className="related-post-title">{post.title}</h4>
                    <p className="related-post-excerpt">
                      {post.excerpt?.substring(0, 100)}{post.excerpt?.length > 100 ? '...' : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Comments Section */}
          {id !== 'new' && (
            <div id="comments" className="comments-section">
              <h3 className="section-title">
                {commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'Comment' : 'Comments'}` : 'No comments yet'}
              </h3>
              <CommentSection blogId={id} />
            </div>
          )}
          
          {/* Newsletter Signup */}
          <div className="newsletter-section">
            <h3 className="newsletter-title">Enjoyed this post?</h3>
            <p className="newsletter-description">Subscribe to our newsletter to receive more content like this directly in your inbox.</p>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                className="newsletter-input"
                required
              />
              <button
                type="submit"
                className="newsletter-button"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </article>
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={currentBlog.title}
      />
      
      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="back-to-top-btn"
        aria-label="Back to top"
      >
        <svg className="back-to-top-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default BlogDetail;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { selectCommentsByBlogId, selectCommentError } from '../redux/selectors/commentSelectors';
import { fetchComments, addComment, deleteComment, likeComment, updateComment } from '../redux/slices/commentSlice';
import { updateBlogCommentsCount } from '../redux/slices/blogSlice';
import { formatDistanceToNow } from 'date-fns';

const MAX_COMMENT_LENGTH = 1000;

const CommentSection = ({ blogId }) => {
  const dispatch = useDispatch();
  const textareaRef = useRef(null);

  console.log('[CommentSection] Received props:', { blogId });
  
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const comments = useSelector(state => selectCommentsByBlogId(state, blogId));
  const error = useSelector(state => {
    const error = selectCommentError(state);
    return typeof error === 'string' ? error : error?.message || error?.toString() || '';
  });
  const user = useSelector(state => state?.auth?.user || null);
  const isAuthenticated = useSelector(state => !!state?.auth?.isAuthenticated);

  // Store previous blogId using useRef
  const prevBlogId = useRef(blogId);

  // Fetch comments when component mounts or props change
  useEffect(() => {
    if (!blogId) return;

    const fetchCommentsWithRetry = async () => {
      try {
        setIsLoading(true);
        const result = await dispatch(fetchComments(blogId));
        if (fetchComments.fulfilled.match(result)) {
          // If comments are fetched successfully, update the blog's commentsCount
          dispatch(updateBlogCommentsCount(blogId, result.payload.comments?.length || 0));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching comments:', error);
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || 
                           error?.response?.data?.message || 
                           error?.response?.error || 
                           error?.data?.message ||
                           'Failed to fetch comments';
        toast.error(errorMessage);
        setIsLoading(false);
      }
    };

    // Only fetch if blogId changes
    const currentBlogId = blogId;
    if (currentBlogId !== prevBlogId.current) {
      prevBlogId.current = currentBlogId;
      fetchCommentsWithRetry();
    }
  }, [blogId, dispatch]);

  // Focus textarea when replying or editing
  useEffect(() => {
    if (replyTo || editId) {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [replyTo, editId, textareaRef]);

  // Wrap handlers in useCallback to prevent re-renders
  const handleLike = useCallback(async (comment) => {
    if (!isAuthenticated) {
      toast.info('Please log in to like comments');
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(likeComment({ blogId, commentId: comment._id })).unwrap();
      toast.success('Comment liked successfully');
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error(error.message || 'Failed to like comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [blogId, dispatch, isAuthenticated, setIsSubmitting]);

  const handleDelete = useCallback(async (comment) => {
    if (!isAuthenticated) {
      toast.info('Please log in to delete comments');
      return;
    }

    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
      if (!confirmDelete) return;

      setIsSubmitting(true);
      await dispatch(deleteComment({ blogId, commentId: comment._id })).unwrap();
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.message || 'Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [blogId, dispatch, isAuthenticated, setIsSubmitting]);

  const handleCommentSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to post comments');
      return;
    }

    if (!commentContent.trim()) {
      toast.warning('Comment cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editId) {
        // Update existing comment
        await dispatch(updateComment({ blogId, commentId: editId, text: commentContent })).unwrap();
        toast.success('Comment updated successfully');
      } else if (replyTo) {
        // Post reply to a comment
        await dispatch(addComment({ blogId, text: commentContent, parentId: replyTo._id })).unwrap();
        toast.success('Reply posted successfully');
      } else {
        // Post new comment
        await dispatch(addComment({ blogId, text: commentContent })).unwrap();
        toast.success('Comment posted successfully');
      }

      // Reset form state
      setCommentContent('');
      setReplyTo(null);
      setEditId(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error(error.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [blogId, dispatch, isAuthenticated, commentContent, editId, replyTo, setIsSubmitting]);

  const renderComments = useCallback((commentsArr, parentId = null, depth = 0, maxDepth = 10) => {
    if (!Array.isArray(commentsArr)) return null;
    if (depth > maxDepth) return null; // Prevent infinite recursion
    
    // Create a map of comments by their ID for efficient lookup
    const commentsById = new Map(commentsArr.map(comment => [comment._id, comment]));
    
    // Get all comments that match the parent ID
    const filteredComments = commentsArr.filter(comment => {
      // Validate comment data
      if (!comment || !comment._id) return false;
      
      const commentParentId = comment.parentId ? comment.parentId.toString() : null;
      const compareId = parentId ? parentId.toString() : null;
      return commentParentId === compareId;
    });

    if (filteredComments.length === 0) return null;

    // Sort comments by creation date (newest first)
    const sortedComments = [...filteredComments].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    return (
      <div className="comments-section">
        {sortedComments.map(comment => {
          // Get the comment from the map to ensure we have fresh data
          const currentComment = commentsById.get(comment._id);
          
          if (!currentComment) return null;

          return (
            <div key={currentComment._id} className={`comment ${depth > 0 ? 'reply' : ''}`}>
              <div className="comment-header">
                <div className="comment-author">
                  <img
                    src={currentComment.user?.avatar || '/default-avatar.png'}
                    alt={currentComment.user?.name || 'User'}
                    className="comment-avatar"
                  />
                  <span className="comment-author-name">
                    {currentComment.user?.name || 'Anonymous'}
                  </span>
                </div>
                <div className="comment-meta">
                  <span className="comment-date">
                    {currentComment.createdAt 
                      ? formatDistanceToNow(new Date(currentComment.createdAt), { addSuffix: true }) 
                      : 'Just now'}
                  </span>
                  {currentComment.isLocal && (
                    <span className="comment-status">(Local)</span>
                  )}
                </div>
              </div>
              <div className="comment-text">
                {currentComment.content}
              </div>
              <div className="comment-actions">
                <button
                  onClick={() => handleLike(currentComment)}
                  className={`like-button ${currentComment.isLiked ? 'liked' : ''}`}
                  disabled={isSubmitting || !isAuthenticated}
                >
                  <span className="like-count">{currentComment.likesCount}</span>
                  <span className="like-icon">{currentComment.isLiked ? '❤️' : '♡'}</span>
                </button>

                <button
                  onClick={() => setReplyTo(currentComment)}
                  disabled={isSubmitting}
                >
                  Reply
                </button>

                {currentComment.user?._id === user?._id && (
                  <>
                    <button
                      onClick={() => {
                        setEditId(currentComment._id);
                        setCommentContent(currentComment.content);
                      }}
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(currentComment)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {renderComments(commentsArr, currentComment._id, depth + 1, maxDepth)}
            </div>
          );
        })}
      </div>
    );
  }, [handleLike, handleDelete, isSubmitting, isAuthenticated, user]);

  // Show loading or error state
  if (isLoading) {
    return (
      <div className="comment-section">
        <div className="loading-spinner">Loading comments...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || error?.toString() || 'An error occurred';
    return (
      <div className="comment-section">
        <div className="error-message">{errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <div className="comment-form">
        <textarea
          ref={textareaRef}
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder={editId ? 'Edit your comment...' : 'Write a comment...'}
          disabled={isSubmitting || isLoading}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
        />
        
        <div className="comment-form-footer">
          <span className="comment-length">{`${commentContent.length}/${MAX_COMMENT_LENGTH}`}</span>
          <button
            type="button"
            onClick={handleCommentSubmit}
            disabled={isSubmitting || isLoading || !commentContent.trim()}
            className="submit-button"
          >
            {editId ? 'Update Comment' : 'Post Comment'}
          </button>
        </div>
      </div>

      {isLoading && <div className="loading">Loading comments...</div>}

      <div className="comments-list">
        {comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

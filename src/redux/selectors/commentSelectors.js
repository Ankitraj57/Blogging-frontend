import { createSelector } from '@reduxjs/toolkit';

// Select the base comments state
const selectCommentsState = (state) => {
  return state?.comments || {
    commentsByBlog: {},
    status: 'idle',
    error: null
  };
};

// Memoized selector for comments by blog ID
export const selectCommentsByBlogId = createSelector(
  [selectCommentsState, (_, blogId) => blogId],
  (comments, blogId) => {
    if (!blogId) return [];

    const commentData = comments.commentsByBlog[blogId];
    
    // Return empty array if no comments found
    if (!commentData || !Array.isArray(commentData)) {
      return [];
    }

    // Sort comments by createdAt date
    return [...commentData].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
);

export const selectCommentStatus = (state) => state.comments.status;

export const selectCommentError = (state) => state.comments.error;

export const selectCommentLoading = (state) => state.comments.loading;

// Memoized selector to get a specific comment by ID
export const selectCommentById = createSelector(
  [selectCommentsByBlogId, (_, blogId, commentId) => commentId],
  (comments, commentId) => {
    if (!commentId) return null;
    
    const findComment = (commentList) => {
      for (const comment of commentList) {
        if (comment._id === commentId) return comment;
        if (comment.replies?.length) {
          const found = findComment(comment.replies);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findComment(comments);
  }
);

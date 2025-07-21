const express = require('express');
const router = express.Router();
const { getCommentsByPost, addComment, deleteComment, likeComment, unlikeComment } = require('../controllers/commentController');

// Get comments for a specific blog post
router.get('/:id', getCommentsByPost);
// Add a new comment
router.post('/', addComment);
// Delete a comment
router.delete('/:commentId', deleteComment);
// Like a comment
router.post('/:commentId/like', likeComment);
// Unlike a comment
router.delete('/:commentId/like', unlikeComment);

module.exports = router;

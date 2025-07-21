const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

// Create a comment on a blog post
exports.addComment = async (req, res) => {
  const { postId, content, parentId } = req.body;

  // Validate input
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    // Ensure blog exists
    const blog = await Blog.findById(postId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const newComment = new Comment({
      postId,
      userId: req.user.id, // from JWT middleware
      content: content.trim(),
      parentId: parentId ? mongoose.Types.ObjectId(parentId) : null
    });

    await newComment.save();
    
    // Populate the user details for the response
    const populatedComment = await Comment.findById(newComment._id)
      .populate({
        path: 'userId',
        select: 'username avatar'
      })
      .populate({
        path: 'parentId',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    res.status(201).json({ 
      message: 'Comment added successfully', 
      comment: populatedComment 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      error: 'Failed to add comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all comments for a specific blog post
exports.getCommentsByPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user?.id; // Optional, will be undefined if not authenticated
    
    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    
    // Check if blog exists and get its comments count
    const blog = await mongoose.model('Blog').findById(postId).populate('author', 'name email');
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Find all comments for the post
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'username avatar',
      })
      .populate({
        path: 'likes.userId',
        select: 'username avatar',
      });

    // Add blog info to response with proper author handling
    const blogInfo = {
      _id: blog._id.toString(),
      title: blog.title,
      author: {
        _id: blog.author._id.toString(),
        name: blog.author.name || blog.author.username || 'Unknown Author',
        email: blog.author.email || 'N/A',
        username: blog.author.username || blog.author.name || 'unknown'
      }
    };
    
    // Process comments to create a proper tree structure
    const processComments = (parentId = null) => {
      return comments
        .filter(comment => {
          // Convert both to string for comparison
          const commentParentId = comment.parentId ? comment.parentId.toString() : null;
          const compareId = parentId ? parentId.toString() : null;
          return commentParentId === compareId;
        })
        .map(comment => {
          const commentObj = comment.toObject();
          
          // Add isLiked flag for the current user if authenticated
          commentObj.isLiked = userId 
            ? comment.likes.some(like => like.userId?._id?.toString() === userId)
            : false;
            
          // Convert likes count to number
          commentObj.likesCount = comment.likes?.length || 0;
          
          // Add proper response format fields
          const authorInfo = {
            _id: commentObj.userId._id.toString(),
            name: commentObj.userId.name || commentObj.userId.username || 'Unknown Author',
            username: commentObj.userId.username || commentObj.userId.name || 'unknown',
            avatar: commentObj.userId.avatar || 'default-avatar.png'
          };

          return {
            ...commentObj,
            _id: commentObj._id.toString(),
            parentId: commentObj.parentId ? commentObj.parentId.toString() : null,
            createdAt: commentObj.createdAt.toISOString(),
            updatedAt: commentObj.updatedAt.toISOString(),
            author: authorInfo,
            replies: processComments(comment._id)
          };
        });
    };
    
    // Get all top-level comments
    const topLevelComments = processComments();
    
    // Add replies to each comment
    topLevelComments.forEach(comment => {
      comment.replies = processComments(comment._id);
    });
    
    // Return comments in the format expected by the frontend
    res.json({
      data: {
        blogId: postId,
        blogInfo,
        comments: topLevelComments,
        total: comments.length,
        isLocal: false,
        status: 'success'
      }
    });

    // Log the response for debugging
    console.log('Comments response:', {
      blogId: postId,
      totalComments: comments.length,
      processedComments: topLevelComments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch comments',
      message: error.message 
    });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  const { id: commentId } = req.params;
  const userId = req.user.id;

  // Validate comment ID
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  try {
    // Find the comment and ensure it exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user already liked the comment
    const alreadyLiked = comment.likes.some(like => like.userId.toString() === userId);
    
    if (alreadyLiked) {
      return res.status(400).json({ error: 'You have already liked this comment' });
    }

    // Add like
    comment.likes.push({ userId });
    comment.likesCount = comment.likes.length;
    
    await comment.save();

    // Populate the user details for the response
    const populatedComment = await Comment.findById(commentId)
      .populate('userId', 'username avatar')
      .populate('likes.userId', 'username avatar');

    res.json({ 
      message: 'Comment liked successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ 
      error: 'Failed to like comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Unlike a comment
exports.unlikeComment = async (req, res) => {
  const { id: commentId } = req.params;
  const userId = req.user.id;

  // Validate comment ID
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  try {
    // Find the comment and ensure it exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user has liked the comment
    const likeIndex = comment.likes.findIndex(like => like.userId.toString() === userId);
    
    if (likeIndex === -1) {
      return res.status(400).json({ error: 'You have not liked this comment yet' });
    }

    // Remove like
    comment.likes.splice(likeIndex, 1);
    comment.likesCount = comment.likes.length;
    
    await comment.save();

    // Populate the user details for the response
    const populatedComment = await Comment.findById(commentId)
      .populate('userId', 'username avatar')
      .populate('likes.userId', 'username avatar');

    res.json({ 
      message: 'Comment unliked successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({ 
      error: 'Failed to unlike comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a comment (only author or admin)
exports.deleteComment = async (req, res) => {
  const { id } = req.params;

  // Validate comment ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author or admin can delete
    if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'You are not authorized to delete this comment' 
      });
    }

    await comment.deleteOne();
    
    res.json({ 
      success: true,
      message: 'Comment deleted successfully',
      commentId: id
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      error: 'Failed to delete comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

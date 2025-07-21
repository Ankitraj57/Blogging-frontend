const mongoose = require('mongoose');
const Like = require('../models/Like');
const Blog = require('../models/Blog');

// Toggle Like/Unlike
exports.toggleLike = async (req, res) => {
  console.log('toggleLike called with body:', req.body);
  console.log('User ID:', req.user?.id);
  
  const { postId } = req.body;
  
  // Validate postId
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    console.error('Invalid postId:', postId);
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    console.log('Finding blog with ID:', postId);
    const blog = await Blog.findById(postId);
    if (!blog) {
      console.error('Blog not found with ID:', postId);
      return res.status(404).json({ error: 'Blog not found' });
    }

    console.log('Checking for existing like from user:', req.user.id, 'on post:', postId);
    const existingLike = await Like.findOne({
      postId,
      userId: req.user.id,
    });

    if (existingLike) {
      // Unlike
      console.log('Found existing like, removing...');
      await existingLike.deleteOne();
      
      // Update blog likes count
      await Blog.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      
      console.log(`User ${req.user.id} unliked post ${postId}`);
      return res.json({ 
        message: 'Unliked the post', 
        action: 'unlike',
        postId,
        likes: blog.likesCount - 1,
        isLiked: false
      });
    } else {
      // Like
      console.log('No existing like found, creating new like...');
      const newLike = new Like({
        postId,
        userId: req.user.id,
      });
      await newLike.save();
      
      // Update blog likes count
      await Blog.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
      
      console.log(`User ${req.user.id} liked post ${postId}`);
      return res.status(201).json({ 
        message: 'Liked the post',
        action: 'like',
        likeId: newLike._id,
        postId,
        likes: (blog.likesCount || 0) + 1,
        isLiked: true
      });
    }
  } catch (err) {
    console.error('Error in toggleLike:', err);
    res.status(500).json({ 
      error: 'Failed to toggle like',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get like count for a post
exports.getLikeCount = async (req, res) => {
  try {
    const count = await Like.countDocuments({ postId: req.params.postId });
    res.json({ postId: req.params.postId, likes: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get like count' });
  }
};

// Check if user liked a post (optional frontend helper)
exports.hasUserLiked = async (req, res) => {
  try {
    const liked = await Like.exists({
      postId: req.params.postId,
      userId: req.user.id,
    });
    res.json({ liked: !!liked });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check like status' });
  }
};

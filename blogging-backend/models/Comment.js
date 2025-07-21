const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true,
    default: null,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1000,
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update blog's comment count when a comment is saved
commentSchema.post('save', async function(doc) {
  try {
    const Blog = mongoose.model('Blog');
    await Blog.findByIdAndUpdate(doc.postId, { 
      $inc: { commentsCount: 1 },
      $set: { updatedAt: new Date() }
    });
  } catch (error) {
    console.error('Error updating blog comment count:', error);
  }
});

// Update blog's comment count when a comment is removed
commentSchema.post('remove', async function(doc) {
  try {
    const Blog = mongoose.model('Blog');
    await Blog.findByIdAndUpdate(doc.postId, { 
      $inc: { commentsCount: -1 },
      $set: { updatedAt: new Date() }
    });
  } catch (error) {
    console.error('Error updating blog comment count on remove:', error);
  }
});

// Add text index for search functionality
commentSchema.index({ content: 'text' });

// Add a virtual for the author's information
commentSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Enable virtuals in toJSON and toObject
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);

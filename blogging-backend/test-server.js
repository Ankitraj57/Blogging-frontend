const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin test route
app.get('/api/admin/users', (req, res) => {
  console.log('Admin users endpoint hit');
  res.json([{ id: 1, name: 'Test User' }]);
});

// Mock comments data
const mockComments = {
  '6871f4d3a4e455594772fe05': [
    {
      _id: '1',
      content: 'This is a test comment',
      author: {
        _id: 'user1',
        name: 'Test User',
        avatar: '/avatar.png'
      },
      createdAt: new Date().toISOString(),
      likes: [],
      likesCount: 0,
      isLocal: false
    }
  ]
};

// Comments routes
app.get('/api/api/comments/:blogId', (req, res) => {
  const { blogId } = req.params;
  console.log(`GET /api/api/comments/${blogId}`);
  
  if (mockComments[blogId]) {
    res.json(mockComments[blogId]);
  } else {
    res.status(404).json({ error: 'Comments not found' });
  }
});

app.post('/api/api/comments', (req, res) => {
  const { blogId, content, replyTo } = req.body;
  console.log('POST /api/api/comments', { blogId, content, replyTo });
  
  if (!mockComments[blogId]) {
    mockComments[blogId] = [];
  }
  
  const newComment = {
    _id: Date.now().toString(),
    content,
    author: {
      _id: 'user1',
      name: 'Test User',
      avatar: '/avatar.png'
    },
    createdAt: new Date().toISOString(),
    likes: [],
    likesCount: 0,
    isLocal: true,
    parentId: replyTo || null
  };
  
  mockComments[blogId].push(newComment);
  res.status(201).json(newComment);
});

app.put('/api/api/comments/:commentId', (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  console.log(`PUT /api/api/comments/${commentId}`, { content });
  
  // Find the comment and update it
  const comment = mockComments['6871f4d3a4e455594772fe05'].find(c => c._id === commentId);
  if (comment) {
    comment.content = content;
    res.json(comment);
  } else {
    res.status(404).json({ error: 'Comment not found' });
  }
});

app.delete('/api/api/comments/:commentId', (req, res) => {
  const { commentId } = req.params;
  console.log(`DELETE /api/api/comments/${commentId}`);
  
  // Remove the comment
  const index = mockComments['6871f4d3a4e455594772fe05'].findIndex(c => c._id === commentId);
  if (index !== -1) {
    mockComments['6871f4d3a4e455594772fe05'].splice(index, 1);
    res.json({ message: 'Comment deleted' });
  } else {
    res.status(404).json({ error: 'Comment not found' });
  }
});

app.post('/api/api/comments/:commentId/like', (req, res) => {
  const { commentId } = req.params;
  console.log(`POST /api/api/comments/${commentId}/like`);
  
  const comment = mockComments['6871f4d3a4e455594772fe05'].find(c => c._id === commentId);
  if (comment) {
    comment.likes.push('user1');
    comment.likesCount = comment.likes.length;
    res.json(comment);
  } else {
    res.status(404).json({ error: 'Comment not found' });
  }
});

app.delete('/api/api/comments/:commentId/like', (req, res) => {
  const { commentId } = req.params;
  console.log(`DELETE /api/api/comments/${commentId}/like`);
  
  const comment = mockComments['6871f4d3a4e455594772fe05'].find(c => c._id === commentId);
  if (comment) {
    comment.likes = comment.likes.filter(like => like !== 'user1');
    comment.likesCount = comment.likes.length;
    res.json(comment);
  } else {
    res.status(404).json({ error: 'Comment not found' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/health`);
  console.log(`Admin test endpoint: http://localhost:${PORT}/api/admin/users`);
});

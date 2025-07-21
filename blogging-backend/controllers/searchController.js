const Blog = require('../models/Blog');
const User = require('../models/User');
const Category = require('../models/Category');

// Search blogs by title, content, or tags
exports.searchBlogs = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

    const [results, total] = await Promise.all([
      Blog.find({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ]
      })
      .populate('author', 'name')
      .populate('category', 'name')
      .skip(skip)
      .limit(limit),
      
      Blog.countDocuments({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ]
      })
    ]);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search blogs' });
  }
};

// Filter blogs by category
exports.filterByCategory = async (req, res) => {
  try {
    const { categoryId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const [results, total] = await Promise.all([
      Blog.find({ category: categoryId })
        .populate('author', 'name')
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      
      Blog.countDocuments({ category: categoryId })
    ]);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to filter blogs by category' });
  }
};

// Filter blogs by author
exports.filterByAuthor = async (req, res) => {
  try {
    const { authorId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!authorId) {
      return res.status(400).json({ error: 'Author ID is required' });
    }

    const [results, total] = await Promise.all([
      Blog.find({ author: authorId })
        .populate('author', 'name')
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      
      Blog.countDocuments({ author: authorId })
    ]);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to filter blogs by author' });
  }
};

// Get trending blogs (most liked)
exports.getTrendingBlogs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const blogs = await Blog.find()
      .sort({ likes: -1 })
      .populate('author', 'name')
      .populate('category', 'name')
      .limit(limit);

    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending blogs' });
  }
};

// Get recent blogs
exports.getRecentBlogs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name')
      .populate('category', 'name')
      .limit(limit);

    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent blogs' });
  }
};

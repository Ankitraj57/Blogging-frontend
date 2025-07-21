const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Category = require('../models/Category');

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [userCount, blogCount, commentCount, categoryCount] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Comment.countDocuments(),
      Category.countDocuments()
    ]);

    res.json({
      users: userCount,
      blogs: blogCount,
      comments: commentCount,
      categories: categoryCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit),
      User.countDocuments()
    ]);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  const { userId, role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Delete a user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete associated blogs and comments
    await Blog.deleteMany({ author: user._id });
    await Comment.deleteMany({ author: user._id });

    await user.deleteOne();
    res.json({ message: 'User and associated content deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all blogs with pagination
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find()
        .populate('author', 'name email')
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      Blog.countDocuments()
    ]);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBlogs: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Delete a blog (admin only)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    // Delete associated comments
    await Comment.deleteMany({ blog: blog._id });

    await blog.deleteOne();
    res.json({ message: 'Blog and associated comments deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create category' });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update category' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Update blogs to remove this category
    await Blog.updateMany(
      { category: category._id },
      { $unset: { category: 1 } }
    );

    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

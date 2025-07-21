const Blog = require('../models/Blog');
const { ObjectId } = require('mongodb');

// Get form data for new blog post
exports.getNewBlogForm = async (req, res) => {
  try {
    // Return any initial data needed for the form
    res.json({
      title: "",
      content: "",
      tags: []
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load form data" });
  }
};


// Create a new blog post
exports.createBlog = async (req, res) => {
  const { 
    title, 
    content, 
    tags = [],
    category = 'uncategorized',
    image = '',
    status = 'draft'
  } = req.body;

  // Log the raw request body for debugging
  console.log('Raw request body:', JSON.stringify(req.body, null, 2));
  
  // Validate required fields with more detailed error messages
  const errors = [];
  if (!title) errors.push('Title is required');
  if (!content) errors.push('Content is required');
  
  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    return res.status(400).json({ 
      success: false,
      error: "Validation failed",
      details: errors,
      receivedData: { 
        title: !!title, 
        content: !!content,
        tags: Array.isArray(tags) ? tags.length : 0,
        category,
        status
      }
    });
  }

  try {
    console.log('Creating blog post with data:', { 
      title: title.substring(0, 50) + (title.length > 50 ? '...' : ''), 
      contentLength: content.length,
      tags: Array.isArray(tags) ? tags : [tags],
      category,
      status,
      author: req.user?.id
    });

    // Create blog post
    const newPost = new Blog({
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [tags],
      category: (category || 'uncategorized').toLowerCase().trim(),
      image: image || '',
      status: ['draft', 'published'].includes(status) ? status : 'draft',
      author: req.user?.id
    });

    // Validate and save
    try {
      await newPost.validate();
      const savedPost = await newPost.save();
      
      // Populate author info
      await savedPost.populate('author', 'name email');
      
      console.log('Blog post created successfully:', {
        id: savedPost._id,
        title: savedPost.title,
        status: savedPost.status,
        author: savedPost.author?.name || 'Unknown'
      });
      
      res.status(201).json({ 
        success: true,
        message: "Blog created successfully", 
        blog: savedPost 
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationError.errors
      });
    }
  } catch (error) {
    console.error('Error creating blog post:', {
      error: error.message,
      stack: error.stack,
      requestBody: {
        title, content, tags, category, image, status
      }
    });
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation Error',
        details: err.message,
        fields: Object.keys(err.errors || {})
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create blog",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get all blog posts
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author', 'name email').sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
};

// Get a single blog post by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email username')
      .populate('comments', 'content createdAt likes likesCount');

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Format the response to include author info
    const formattedBlog = {
      ...blog.toObject(),
      _id: blog._id.toString(),
      author: {
        _id: blog.author._id.toString(),
        name: blog.author.name,
        email: blog.author.email,
        username: blog.author.username
      },
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      comments: blog.comments || []
    };

    res.json({
      success: true,
      data: formattedBlog
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
};

// Update a blog post (owner or admin only)
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Only the author or an admin can update
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;
    blog.tags = req.body.tags || blog.tags;
    blog.updatedAt = new Date();

    await blog.save();
    res.json({ message: "Blog updated successfully", blog });
  } catch (err) {
    res.status(500).json({ error: "Failed to update blog" });
  }
};

// Delete a blog post (owner or admin only)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Only the author or an admin can delete
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    await blog.remove();
    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
};

// Toggle like on a blog post
exports.toggleLike = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    // Validate blog ID
    if (!ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Toggle like
    if (blog.likes.includes(userId)) {
      blog.likes = blog.likes.filter(like => like.toString() !== userId);
    } else {
      blog.likes.push(userId);
    }

    // Save the blog
    await blog.save();

    // Format response to match frontend expectations
    const formattedBlog = {
      ...blog.toObject(),
      likesCount: blog.likes.length,
      isLiked: blog.likes.includes(userId),
      author: {
        _id: blog.author._id,
        name: blog.author.name,
        email: blog.author.email
      }
    };

    res.status(200).json({
      success: true,
      data: formattedBlog
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to toggle like',
      message: error.message 
    });
  }
};

// Toggle bookmark (save/unsave) blog post
exports.toggleBookmark = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    // Validate blog ID
    if (!ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Toggle bookmark
    if (blog.bookmarks.includes(userId)) {
      blog.bookmarks = blog.bookmarks.filter(bookmark => bookmark.toString() !== userId);
    } else {
      blog.bookmarks.push(userId);
    }

    // Save the blog
    await blog.save();

    // Format response to match frontend expectations
    const formattedBlog = {
      ...blog.toObject(),
      isBookmarked: blog.bookmarks.includes(userId),
      bookmarksCount: blog.bookmarks.length,
      author: {
        _id: blog.author._id,
        name: blog.author.name,
        email: blog.author.email
      }
    };

    // Get user's saved posts
    const savedPosts = await Blog.find({
      bookmarks: userId
    }).populate('author', 'name email');

    res.status(200).json({
      success: true,
      data: {
        blog: formattedBlog,
        savedPosts: savedPosts.map(post => ({
          ...post.toObject(),
          _id: post._id.toString(),
          author: {
            _id: post.author._id.toString(),
            name: post.author.name,
            email: post.author.email
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to toggle bookmark',
      message: error.message 
    });
  }
};


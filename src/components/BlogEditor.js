import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createBlog, updateBlog, fetchBlogById } from '../redux/slices/blogSlice';
import { FaSpinner, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/BlogEditor.css';

const BlogEditor = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  // Initialize state with empty values
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('technology');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Use ref to track initial render
  const hasMounted = useRef(false);
  
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean'],
      ['blockquote', 'code-block'],
      [{'align': []}],
      [{'color': []}, {'background': []}],
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image',
    'blockquote', 'code-block',
    'align',
    'color', 'background'
  ];

  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error: errorObj, currentBlog } = useSelector((state) => state.blog);
  const error = errorObj ? (
    errorObj.message || 
    errorObj.details || 
    errorObj.error || 
    'Something went wrong. Please try again.'
  ) : null;
  // User authentication is handled by the backend
  
  // Fetch blog data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchBlogById(id));
    }
  }, [dispatch, id, isEditMode]);
  
  // Set form fields when currentBlog changes (edit mode)
  useEffect(() => {
    // Only update state on initial mount
    if (!hasMounted.current && isEditMode && currentBlog) {
      setTitle(currentBlog.title);
      setContent(currentBlog.content);
      setCategory(currentBlog.category || 'technology');
      setTags(currentBlog.tags?.join(', ') || '');
      setIsPublished(currentBlog.isPublished !== false);
      if (currentBlog.image) {
        setImagePreview(currentBlog.image);
      }
      hasMounted.current = true;
    }
  }, [currentBlog, isEditMode]);
  
  // Handle image upload to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'blog_uploads');
    
    try {
      setIsUploading(true);
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/drhy96uqo/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!content.trim() || content === '<p><br></p>') {
      toast.error('Please enter some content');
      return;
    }

    try {
      setIsUploading(true);
      
      // Handle image upload if there's a new image
      let imageUrl = imagePreview;
      if (image && typeof image === 'object') {
        try {
          imageUrl = await uploadImageToCloudinary(image);
        } catch (error) {
          toast.error('Failed to upload image. Please try again.');
          setIsUploading(false);
          return;
        }
      }
      
      // Prepare blog data according to backend expectations
      const blogData = {
        title: title.trim(),
        content: content.trim(),
        category: category || 'technology',
        image: imageUrl || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        status: isPublished ? 'published' : 'draft'
      };
      
      console.log('Prepared blog data:', blogData);

      // Create or update blog post
      try {
        let result;
        
        if (isEditMode) {
          result = await dispatch(updateBlog({
            id,
            ...blogData
          })).unwrap();
        } else {
          // Send the blog data directly to the createBlog action
          result = await dispatch(createBlog(blogData)).unwrap();
          console.log('Blog creation result:', result);
        }
        
        if (result.success) {
          toast.success(`Blog post ${isEditMode ? 'updated' : 'created'} successfully!`);
          navigate('/dashboard');
        } else {
          throw new Error(result.error || 'Failed to save blog post');
        }
      } catch (error) {
        console.error('Error saving blog post:', error);
        toast.error(error.message || 'Failed to save blog post');
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error(error.message || 'Failed to save blog post');
    }
  };

  return (
    <div className="blog-editor-container">
      <div className="editor-header">
        <h1>
          {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
        <p className="editor-subtitle">
          {isEditMode 
            ? 'Update your blog post and publish changes.' 
            : 'Fill in the details below to create a new blog post.'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-group">
          <label htmlFor="title">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="Enter blog title"
            required
          />
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="category">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
              required
            >
              <option value="technology">Technology</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="travel">Travel</option>
              <option value="food">Food & Cooking</option>
              <option value="health">Health & Wellness</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
              placeholder="e.g., react, javascript, web development"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>
            Content *
          </label>
          <div className="quill-editor">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder="Write your blog content here..."
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            Featured Image
            <span className="image-hint">(Recommended: 1200x630px)</span>
          </label>
          <div className="image-upload-container">
            <div className="image-preview-container">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="preview-image"
                />
              ) : (
                <div className="empty-image-preview">
                  <FaImage className="image-icon" />
                  <span>No image selected</span>
                </div>
              )}
            </div>
            <div className="image-upload-actions">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="upload-button"
              >
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="remove-image-button"
                >
                  Remove Image
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="file-input"
              />
              <p className="file-upload-hint">
                JPG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>
        
        <div className="publish-toggle">
          <input
            id="publish"
            name="publish"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="publish-checkbox"
          />
          <label htmlFor="publish">
            Publish this post
          </label>
        </div>
        
        {error && (
          <div className="error-message">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="error-content">
              <h3>{error}</h3>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(isEditMode ? `/blog/${id}` : '/dashboard')}
            className="cancel-button"
          >
            Cancel
          </button>
          
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate(`/blog/${id}`)}
              className="view-button"
            >
              View Post
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || isUploading}
            className={`submit-button ${loading || isUploading ? 'loading' : ''}`}
          >
            {loading || isUploading ? (
              <>
                <FaSpinner className="spinner" />
                {isUploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : isEditMode ? (
              'Update Post'
            ) : (
              'Publish Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;

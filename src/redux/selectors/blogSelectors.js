import { createSelector } from '@reduxjs/toolkit';

// Select the base blog state
const selectBlogsState = (state) => state.blog;

// Basic selectors
export const selectAllBlogs = (state) => selectBlogsState(state).blogs || [];
export const selectBlogStatus = (state) => selectBlogsState(state).status;
export const selectBlogError = (state) => selectBlogsState(state).error;
export const selectCurrentBlog = (state) => selectBlogsState(state).currentBlog;

// Memoized selectors
export const selectBlogsByAuthor = createSelector(
  [selectAllBlogs, (_, authorId) => authorId],
  (blogs, authorId) => {
    if (!authorId) return [];
    return blogs.filter(blog => {
      const blogAuthorId = blog.author?._id || blog.author?.id;
      return String(blogAuthorId) === String(authorId);
    });
  }
);

export const selectBlogsByCategory = createSelector(
  [selectAllBlogs, (_, category) => category],
  (blogs, category) => {
    if (!category) return blogs;
    return blogs.filter(blog => 
      blog.categories?.some(cat => 
        typeof cat === 'string' 
          ? cat.toLowerCase() === category.toLowerCase() 
          : cat.name?.toLowerCase() === category.toLowerCase()
      )
    );
  }
);

export const selectRelatedBlogs = createSelector(
  [selectAllBlogs, (_, currentBlogId, currentCategories) => ({ currentBlogId, currentCategories })],
  (blogs, { currentBlogId, currentCategories = [] }) => {
    if (!currentBlogId || !currentCategories?.length) return [];
    
    return blogs
      .filter(blog => 
        blog._id !== currentBlogId && 
        blog.categories?.some(cat => 
          currentCategories.some(c => 
            (typeof cat === 'string' ? cat : cat.name) === 
            (typeof c === 'string' ? c : c.name)
          )
        )
      )
      .slice(0, 3); // Return max 3 related posts
  }
);

export const selectBookmarks = (state) => selectBlogsState(state).bookmarks || [];

export const selectBlogById = createSelector(
  [selectAllBlogs, (_, blogId) => blogId],
  (blogs, blogId) => {
    if (!blogId) return null;
    return blogs.find(blog => blog._id === blogId) || null;
  }
);

// Combine all selectors into an object
const blogSelectors = {
  selectAllBlogs,
  selectBlogStatus,
  selectBlogError,
  selectCurrentBlog,
  selectBlogsByAuthor,
  selectBlogsByCategory,
  selectRelatedBlogs,
  selectBookmarks,
  selectBlogById
};

export default blogSelectors;

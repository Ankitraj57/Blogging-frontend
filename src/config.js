// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Other configuration constants
export const APP_NAME = 'Blog Platform';
export const APP_VERSION = '1.0.0';

// Local Storage Keys
export const AUTH_TOKEN_KEY = 'blog_auth_token';
export const USER_DATA_KEY = 'blog_user_data';

// Default settings
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_THEME = 'light';

// Export all constants as named exports
export const config = {
  API_URL,
  APP_NAME,
  APP_VERSION,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
  DEFAULT_PAGE_SIZE,
  DEFAULT_THEME,
};

export default config;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { FaSearch, FaMoon, FaSun, FaSignOutAlt, FaHome, FaUser, FaBookmark, FaUserShield } from 'react-icons/fa';
import { debounce } from 'lodash';
import '../styles/Navbar.css';

function Navbar({ onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Handle scroll effect for navbar with debounce
  useEffect(() => {
    const handleScroll = debounce(() => {
      setIsScrolled(window.scrollY > 10);
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            BlogSpot
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <FaHome className="nav-icon" />
              Home
            </Link>
            <Link to="/about" className="nav-link">
              <FaUser className="nav-icon" />
              About
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="nav-link">
                  <FaHome className="nav-icon" />
                  Dashboard
                </Link>
                <Link to="/profile" className="nav-link">
                  <FaUser className="nav-icon" />
                  Profile
                </Link>
                <Link to="/saved-blogs" className="nav-link">
                  <FaBookmark className="nav-icon" />
                  Saved Blogs
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="nav-link">
                    <FaUserShield className="nav-icon" />
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search posts"
            />
            <FaSearch className="search-icon" />
          </form>
        </div>

        <div className="navbar-right">
          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FaSun className="theme-icon sun" /> : <FaMoon className="theme-icon moon" />}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="logout-button"
              title="Logout"
            >
              <FaSignOutAlt className="logout-icon" />
              <span className="logout-text">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="login-button"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

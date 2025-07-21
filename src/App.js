// React and Routing
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { fetchBlogs } from './redux/slices/blogSlice';
import { fetchAllUsers } from './redux/slices/adminSlice';
import { fetchUserComments } from './redux/slices/commentSlice';

// Layout Components
import Navbar from './components/Navbar';

import Footer from './components/Footer';
import './styles/App.css';

// Public Pages
import Home from './components/Home';
import About from './components/About';
import BlogList from './components/BlogList';
import BlogDetail from './pages/BlogDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Protected Pages
import Dashboard from './pages/Dashboard';

import Profile from './pages/Profile';
import SavedPosts from './pages/SavedPosts';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Components
import BlogEditor from './components/BlogEditor';
import CommentSection from './components/CommentSection';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Fetch initial data when the app loads
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBlogs());
      dispatch(fetchAllUsers());
      if (location.pathname === '/my-comments') {
        dispatch(fetchUserComments());
      }
    }
  }, [dispatch, isAuthenticated, location.pathname]);

  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        <main className="content-area">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/category/:categoryName" element={<BlogList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-post"
            element={
              <PrivateRoute>
                <BlogEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/blog/edit/:id"
            element={
              <PrivateRoute>
                <BlogEditor editMode={true} />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <PrivateRoute>
                <SavedPosts />
              </PrivateRoute>
            }
          />
          <Route
            path="/saved-blogs"
            element={
              <PrivateRoute>
                <SavedPosts />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-comments"
            element={
              <PrivateRoute>
                <div className="my-comments-page">
                  <h2 className="page-title">My Comments</h2>
                  <CommentSection showOnlyUserComments={true} />
                </div>
              </PrivateRoute>
            }
          />
          
          {/* Admin Routes - Protected by AdminRoute */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminRoute>
            } 
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <div>User Management</div> {/* Replace with your UserManagement component */}
              </AdminRoute>
            }
          />
          <Route
            path="/admin/blogs"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <div>Reports</div> {/* Replace with your Reports component */}
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard/content"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminDashboard defaultTab="analytics" />
              </AdminRoute>
            }
          />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;

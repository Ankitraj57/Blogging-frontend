import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../redux/slices/authSlice";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Login.css";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, token } = useSelector((state) => state.auth);
  
  // Clear any previous errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Redirect if user is already logged in
  useEffect(() => {
    const from = location.state?.from?.pathname || '/dashboard';
    
    if (token) {
      // Use a small timeout to ensure the component is properly mounted
      const timer = setTimeout(() => {
        try {
          navigate(from, { replace: true });
        } catch (error) {
          console.error("Navigation error:", error);
          window.location.href = from;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [token, navigate, location.state]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser({
      email: form.email,
      password: form.password
    }));
  };

  return (
    <div className="login-wrapper">
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="login-title">Login</h2>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            className="login-input"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
            autoFocus
            disabled={loading}
            aria-describedby="emailHelp"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="password-input-container">
            <input
              id="password"
              className="login-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              required
              disabled={loading}
              aria-describedby="passwordHelp"
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <div className="forgot-password-container">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </Link>
        </div>
        <button 
          className="login-button" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="register-text">
          Don't have an account?{" "}
          <Link to="/register" className="register-link">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;

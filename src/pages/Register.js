import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, clearError, setError } from "../redux/slices/authSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Register.css";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" // Default role
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((state) => state.auth);
  
  // Clear any previous errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    // Validate password match
    if (form.password !== form.confirmPassword) {
      dispatch(setError("Passwords do not match"));
      return;
    }
    
    // Check password strength
    if (form.password.length < 6) {
      dispatch(setError("Password must be at least 6 characters long"));
      return;
    }
    
    // Validate username format (only letters, numbers, and underscores)
    const usernameRegex = /^[A-Za-z0-9_]+$/;
    if (!usernameRegex.test(form.username)) {
      dispatch(setError("Username can only contain letters, numbers, and underscores"));
      return;
    }
    
    // Prepare registration data
    const { confirmPassword, ...registerData } = form;
    
    // Submit registration
    dispatch(registerUser(registerData))
      .unwrap()
      .then(() => {
        // Registration successful, redirect to dashboard
        navigate("/dashboard");
      })
      .catch((error) => {
        // Error is already handled by the auth slice
        console.error("Registration error:", error);
      });
  };

  return (
    <div className="register-wrapper">
      <form className="register-form" onSubmit={handleRegister}>
        <h2 className="register-title">Create an Account</h2>
        
        <div className="form-group">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            id="username"
            className="register-input"
            type="text"
            placeholder="Choose a username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoFocus
            disabled={loading}
            minLength={3}
            maxLength={30}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            className="register-input"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="password-input-container">
            <input
              id="password"
              className="register-input"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              disabled={loading}
              minLength={6}
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

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <div className="password-input-container">
            <input
              id="confirmPassword"
              className="register-input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
              required
              disabled={loading}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="role" className="form-label">Register As</label>
          <select
            id="role"
            className="register-input"
            value={form.role}
            onChange={(e) => setForm({...form, role: e.target.value})}
            disabled={loading}
          >
            <option value="user">Regular User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button 
          className="register-button" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/login" className="login-link">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;

import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage("Password reset instructions sent to your email.");
      setEmail("");
      setTimeout(() => navigate("/login"), 3000);  // Redirect after 3 seconds
    } catch (err) {
      setError("Failed to send reset instructions. Try again.");
    }
  };

  return (
    <div className="forgot-wrapper">
      <form className="forgot-form" onSubmit={handleSubmit}>
        <h2 className="forgot-title">Forgot Password</h2>
        <p className="forgot-instruction">
          Enter your email address below and we'll send you instructions to reset your password.
        </p>
        <input
          className="forgot-input"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <button className="forgot-button" type="submit">
          Send Reset Link
        </button>

        {message && <p className="forgot-message success">{message}</p>}
        {error && <p className="forgot-message error">{error}</p>}

        <p className="back-to-login">
          Remembered your password?{" "}
          <Link to="/login" className="back-login-link">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;

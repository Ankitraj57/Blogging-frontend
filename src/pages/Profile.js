import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useNavigate } from 'react-router-dom';
import '../styles/profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const selectAuthState = createSelector(
    (state) => state.auth.user,
    (state) => state.auth.isAuthenticated,
    (user, isAuthenticated) => ({
      user,
      isAuthenticated
    })
  );

  const { user, isAuthenticated } = useSelector(selectAuthState);
  
  // Debug: Log the complete auth state and user object
  useEffect(() => {
    console.log('Auth State:', {
      isAuthenticated,
      user: user,
      userType: typeof user,
      userKeys: user ? Object.keys(user) : 'No user'
    });
  }, [user, isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view this page.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Safely access user properties with fallbacks
  const username = user.username || user.name || 'Not available';
  const email = user.email || 'Not available';
  const role = user.role || 'user';
  const userDate = user?.createdAt || user?.created_date || user?.date_created || new Date().toISOString();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>User Profile</h1>
        <p>Personal details and information</p>
      </div>
      
      <div className="profile-card">
        <div className="profile-card-header">
          <h2>Account Information</h2>
          <p>View and manage your profile details</p>
        </div>
        
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Username</span>
            <span className="detail-value">{username}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Email Address</span>
            <span className="detail-value">{email}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Account Role</span>
            <span className={`role-badge ${role.toLowerCase()}`}>
              {role}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Member Since</span>
            <span className="detail-value">
              {new Date(userDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

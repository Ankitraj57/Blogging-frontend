import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { createSelector } from '@reduxjs/toolkit';

const selectAuth = (state) => state.auth;

/**
 * PrivateRoute component that protects routes requiring authentication and/or specific roles
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string|string[]} [props.requiredRole] - Required role(s) to access the route (e.g., 'admin', 'user')
 * @param {string} [props.redirectTo] - Custom redirect path when access is denied (defaults to '/' or '/login')
 * @returns {JSX.Element} Protected route or redirect
 */
const PrivateRoute = ({ 
  children, 
  requiredRole,
  redirectTo,
  ...rest 
}) => {
  const location = useLocation();
  
  // Select authentication state with memoization
  const { isAuthenticated, loading, token, user } = useSelector(
    createSelector(
      [selectAuth],
      (auth) => ({
        isAuthenticated: auth.isAuthenticated,
        loading: auth.loading,
        token: auth.token,
        user: auth.user
      })
    )
  );
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role-based access if required
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = user?.role && requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // Use custom redirect path or default to home
      const redirectPath = redirectTo || (requiredRole === 'admin' ? '/admin' : '/');
      return <Navigate to={redirectPath} replace state={{ from: location }} />;
    }
  }
  
  // If all checks pass, render the children
  return children;
};

export default PrivateRoute;

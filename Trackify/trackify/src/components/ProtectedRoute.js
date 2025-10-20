import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], redirectPath = '/login' }) => {
  const { isAuthenticated } = useAuth();
  const role = localStorage.getItem('role');

  // If user is not logged in, redirect to login
  if (!isAuthenticated) return <Navigate to={redirectPath} replace />;

  // If allowedRoles is defined and user's role is not included, redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has correct role
  return children;
};

export default ProtectedRoute;

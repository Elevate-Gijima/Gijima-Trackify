import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated } = useAuth();
  const role = localStorage.getItem('role');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles.length && !allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;

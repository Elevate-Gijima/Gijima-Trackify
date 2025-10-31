import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], redirectPath = '/login' }) => {
  const { isAuthenticated } = useAuth();
  const role = localStorage.getItem('role');

  console.log('ProtectedRoute check:', { isAuthenticated, role, allowedRoles });

  // If user is not logged in, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to={redirectPath} replace />;
  }

  // Normalize role - handle both "manager" and "RoleEnum.manager" formats
  const normalizedRole = role?.replace('RoleEnum.', '') || role;

  // If allowedRoles is defined and user's role is not included, redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedRole)) {
    console.log('Access denied. User role:', normalizedRole, 'Allowed roles:', allowedRoles);
    return <Navigate to={redirectPath} replace />;
  }

  console.log('Access granted for role:', normalizedRole);
  // User is authenticated and has correct role
  return children;
};

export default ProtectedRoute;

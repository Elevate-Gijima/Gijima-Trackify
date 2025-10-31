import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already logged in (has token and role)
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    return !!(token && role);
  });

  const login = () => setIsAuthenticated(true);
  
  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('http://127.0.0.1:8000/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import TimesheetForm from './pages/Juniors/TimesheetForm';
import LandingPage from './pages/Juniors/JuniorHomePage';

function App() {
  return (
    <AuthProvider>
      <Router>
       <LandingPage/>
        <Routes>
          {/* Public route for login */}
          <Route path="/login" element={<Login />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/timesheet" element={<TimesheetForm />} />
          {/* Protected route for timesheet form */}
          <Route
            path="/timesheet"
            element={
              <ProtectedRoute>
                
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/timesheet" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

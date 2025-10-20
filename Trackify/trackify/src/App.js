import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import TimesheetForm from './pages/Juniors/TimesheetForm';
import LandingPage from './pages/Juniors/JuniorHomePage';
import ManagerDashboard from './pages/Line Manager/TeamTimesheets';
import AdminDashboard from './pages/Administrator/AdminTimesheets';

const AppContent = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public login route */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />

        {/* Employee routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <LandingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timesheet"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <TimesheetForm />
            </ProtectedRoute>
          }
        />

        {/* Manager routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import TimesheetForm from './pages/Juniors/TimesheetForm';
import LandingPage from './pages/Juniors/JuniorHomePage';
import ManagerDashboard from './pages/Line Manager/TeamTimesheets';
import ManagerCalendar from './pages/Line Manager/ManagerCalendar';
import AdminDashboard from './pages/Administrator/AdminTimesheets';
import EmployeeTimesheetHistory from './pages/Juniors/EmployeeTimesheetHistory';

const AppContent = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public routes */}
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
          path="/add-task"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <TimesheetForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-timesheets"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeTimesheetHistory />
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
        <Route
          path="/manager/calendar"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerCalendar />
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

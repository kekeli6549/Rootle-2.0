import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import ErrorBoundary from './components/ErrorBoundary';

// Page Imports
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin'; // ✅ NEW IMPORT
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard'; // ✅ NEW IMPORT (Make sure this file exists!)
import RequestHub from './pages/RequestHub';
import Leaderboard from './pages/Leaderboard'; 

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center font-black animate-pulse text-[#3E2723] tracking-widest uppercase">
      ROOTLE IS LOADING...
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  const isStaff = user.role === 'admin' || user.role === 'lecturer';
  const isSuperAdmin = user.role === 'superadmin';

  // Strict Fence Guards
  if (allowedRole === 'superadmin' && !isSuperAdmin) {
    return <Navigate to="/dashboard/student" />;
  }

  if (allowedRole === 'staff' && !isStaff && !isSuperAdmin) {
    return <Navigate to="/dashboard/student" />;
  }

  // Prevent staff/superadmin from rendering the student dashboard accidentally
  if (allowedRole === 'student') {
    if (isSuperAdmin) return <Navigate to="/dashboard/superadmin" />;
    if (isStaff) return <Navigate to="/dashboard/lecturer" />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider> 
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 🚪 PORTAL GATES */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/superadmin-login" element={<SuperAdminLogin />} />
            
            {/* 🎓 STUDENT DASHBOARD */}
            <Route 
              path="/dashboard/student" 
              element={
                <ProtectedRoute allowedRole="student">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* 📝 REQUEST HUB */}
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute>
                  <RequestHub />
                </ProtectedRoute>
              } 
            />

            {/* 🏆 LEADER HUB */}
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
            
            {/* 👨🏾‍🏫 LECTURER DASHBOARD */}
            <Route 
              path="/dashboard/lecturer" 
              element={
                <ProtectedRoute allowedRole="staff">
                  <LecturerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* ⚡ SUPERADMIN DASHBOARD */}
            <Route 
              path="/dashboard/superadmin" 
              element={
                <ProtectedRoute allowedRole="superadmin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
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
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import RequestHub from './pages/RequestHub'; // NEW IMPORT

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center font-black animate-pulse">
      ROOTLE IS LOADING...
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  const isStaff = user.role === 'admin' || user.role === 'lecturer';

  if (allowedRole === 'staff' && !isStaff) {
    return <Navigate to="/dashboard/student" />;
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
            <Route path="/admin" element={<AdminLogin />} />
            
            {/* STUDENT DASHBOARD */}
            <Route 
              path="/dashboard/student" 
              element={
                <ProtectedRoute allowedRole="student">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* REQUEST HUB (Accessible by everyone logged in) */}
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute>
                  <RequestHub />
                </ProtectedRoute>
              } 
            />
            
            {/* LECTURER DASHBOARD */}
            <Route 
              path="/dashboard/lecturer" 
              element={
                <ProtectedRoute allowedRole="staff">
                  <LecturerDashboard />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
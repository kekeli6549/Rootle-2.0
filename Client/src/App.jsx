import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/LecturerDashboard';

// Gatekeeper Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  // If the AuthProvider is still checking the token, show nothing or a spinner
  if (loading) return <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center font-black">ROOTLE IS LOADING...</div>;

  if (!user) return <Navigate to="/login" />;
  
  // If user is logged in but tries to access the wrong role's dashboard
  if (allowedRole && user.role !== allowedRole) {
    return user.role === 'lecturer' ? <Navigate to="/dashboard/lecturer" /> : <Navigate to="/dashboard/student" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider> 
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLogin />} />
          
          <Route 
            path="/dashboard/student" 
            element={
              <ProtectedRoute allowedRole="student">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/lecturer" 
            element={
              <ProtectedRoute allowedRole="lecturer">
                <LecturerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback for undefined routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
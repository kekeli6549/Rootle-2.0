import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Ensure this path is correct!
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/LecturerDashboard';

// Gatekeeper Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider> {/* THIS IS THE KEY. Without this, everything stays blank. */}
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLogin />} />
          
          <Route 
            path="/dashboard/student" 
            element={<ProtectedRoute allowedRole="student"><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/dashboard/lecturer" 
            element={<ProtectedRoute allowedRole="lecturer"><LecturerDashboard /></ProtectedRoute>} 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import ErrorBoundary from './components/ErrorBoundary'; // Import our new safety net

// Page Imports
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/LecturerDashboard';

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
    <ErrorBoundary> {/* The safety net wraps everything */}
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
            
            {/* IMPORTANT: We point both paths to LecturerDashboard 
               because 'AdminDashboard' is not defined in your files yet.
            */}
            <Route 
              path="/dashboard/lecturer" 
              element={
                <ProtectedRoute allowedRole="staff">
                  <LecturerDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard/admin" 
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
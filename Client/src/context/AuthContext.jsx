import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('rootle_user');
    const storedToken = localStorage.getItem('rootle_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Corrupt user data in storage");
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // userData should contain { id, fullName, role, departmentId }
    setUser(userData);
    localStorage.setItem('rootle_token', token);
    localStorage.setItem('rootle_user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('rootle_token');
    localStorage.removeItem('rootle_user');
    setUser(null);
  };

  // Helper to check permissions
  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
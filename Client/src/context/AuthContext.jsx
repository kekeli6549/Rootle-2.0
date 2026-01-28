import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores { role: 'student' or 'lecturer' }

  // Simple login function to simulate authentication
  const login = (role) => {
    setUser({ role });
    // In a real app, you'd store a token in localStorage here
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
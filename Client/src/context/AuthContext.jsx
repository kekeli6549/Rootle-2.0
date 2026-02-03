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
    // HARMONIZATION: Ensure UI keys match backend response
    const formattedUser = {
        ...userData,
        department: userData.departmentName, // Map departmentName to department
        displayId: userData.staffId          // Map staffId to a generic displayId
    };
    setUser(formattedUser);
    localStorage.setItem('rootle_token', token);
    localStorage.setItem('rootle_user', JSON.stringify(formattedUser));
  };

  const logout = () => {
    localStorage.removeItem('rootle_token');
    localStorage.removeItem('rootle_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin', isLecturer: user?.role === 'lecturer' }}>
      {!loading ? children : (
        <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center font-black text-timber-800">
          ROOTLE IS INITIALIZING...
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
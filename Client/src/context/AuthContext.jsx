import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import scribbleBg from '../assets/scribble-bg.png';

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
    const formattedUser = {
        ...userData,
        department: userData.departmentName, 
        displayId: userData.idNumber         
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
        <div className="min-h-screen bg-[#3E2723] flex flex-col items-center justify-center p-6 text-center" style={{ backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay' }}>
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} 
            className="w-16 h-16 border-4 border-[#C5A059] border-t-transparent rounded-full mb-6"
          />
          <h2 className="font-display font-black text-2xl text-[#F5F5DC] uppercase tracking-tighter mb-1">Rootle.</h2>
          <p className="font-black text-[#C5A059] uppercase text-[10px] tracking-[0.4em]">Initializing Vault Access...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
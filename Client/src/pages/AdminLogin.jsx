import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import scribbleBg from '../assets/scribble-bg.png';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '', staffKey: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (response.ok && data.user.role === 'lecturer') {
        login(data.user, data.token);
        navigate('/dashboard/lecturer'); 
      } else if (data.user && data.user.role !== 'lecturer') {
        alert("Access Denied: You do not have Staff Clearance.");
      } else {
        alert(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Admin Login Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#3E2723', backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay', backgroundSize: '400px' }}>
      
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#F5F5DC] border-4 border-timber-100 p-10 rounded-[30px] shadow-[0px_0px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-900"></div>

        <div className="text-center mb-8">
          <div className="inline-block bg-timber-800 text-timber-100 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">Restricted Access</div>
          <h2 className="text-3xl font-display font-black text-timber-800 uppercase tracking-tighter">Staff Portal</h2>
          <p className="text-timber-600 text-xs font-bold uppercase tracking-widest mt-2">Admins & Lecturers Only</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <input required type="email" name="email" onChange={handleChange} className="w-full bg-timber-200/50 border-2 border-timber-800 p-3 rounded-lg font-bold outline-none focus:bg-white transition-all" placeholder="admin@rootle.edu" />
          <input required type="password" name="password" onChange={handleChange} className="w-full bg-timber-200/50 border-2 border-timber-800 p-3 rounded-lg font-bold outline-none" placeholder="••••••••••••" />
          <input required type="password" name="staffKey" onChange={handleChange} className="w-full bg-red-50 border-2 border-red-900 p-3 rounded-lg font-mono text-red-900 placeholder:text-red-300 outline-none" placeholder="XXX-STAFF-KEY" />

          <button type="submit" className="w-full bg-red-900 text-[#F5F5DC] py-4 rounded-xl font-display font-black text-lg hover:bg-timber-900 hover:scale-[1.02] transition-all duration-300 mt-6 shadow-xl border-2 border-red-900 hover:border-timber-500">
            AUTHENTICATE
          </button>
        </form>

        <div className="mt-8 text-center border-t border-timber-300 pt-4">
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-timber-400 hover:text-timber-800">← Return to Public Site</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
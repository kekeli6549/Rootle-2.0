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

    // STAFF KEY CHECK (Front-Gate Security)
    // Use the key from your .env file
    // You can set this in your .env as VITE_STAFF_KEY
    const VALID_STAFF_KEY = "ROOT-2026-X"; 
    if (formData.staffKey !== VALID_STAFF_KEY) {
      return alert("Invalid Staff Verification Key. This incident will be reported!");
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (response.ok) {
        // AUTHENTICATION CLEARANCE CHECK
        if (data.user.role === 'lecturer' || data.user.role === 'admin') {
          login(data.user, data.token);
          navigate('/dashboard/lecturer'); 
        } else {
          alert("Access Denied: You are a Student. Use the Student Gate!");
        }
      } else {
        alert(data.message || "Authentication failed. Check your Staff credentials.");
      }
    } catch (err) {
      console.error("Admin Login Error:", err);
      alert("Command Center is offline. Check the backend logs.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#3E2723', backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay', backgroundSize: '400px' }}>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#F5F5DC] border-4 border-[#D7CCC8] p-10 rounded-[30px] shadow-[0px_0px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#8B0000]"></div>

        <div className="text-center mb-8">
          <div className="inline-block bg-[#3E2723] text-[#F5F5DC] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">Restricted Access</div>
          <h2 className="text-3xl font-black text-[#3E2723] uppercase tracking-tighter">Staff Portal</h2>
          <p className="text-[#5D4037] text-xs font-bold uppercase tracking-widest mt-2">Admins & Lecturers Only</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="text-[9px] font-black uppercase text-[#3E2723] ml-1">Official Email</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full bg-[#EFEBE9] border-2 border-[#3E2723] p-3 rounded-lg font-bold outline-none focus:bg-white transition-all" placeholder="lecturer@university.edu" />
          </div>
          
          <div>
            <label className="text-[9px] font-black uppercase text-[#3E2723] ml-1">Password</label>
            <input required type="password" name="password" onChange={handleChange} className="w-full bg-[#EFEBE9] border-2 border-[#3E2723] p-3 rounded-lg font-bold outline-none focus:bg-white" placeholder="••••••••••••" />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase text-[#8B0000] ml-1">Verification Key</label>
            <input required type="password" name="staffKey" onChange={handleChange} className="w-full bg-[#FFEBEE] border-2 border-[#8B0000] p-3 rounded-lg font-mono text-[#8B0000] placeholder:text-red-200 outline-none" placeholder="INPUT-VERIFICATION-KEY" />
          </div>

          <button type="submit" className="w-full bg-[#8B0000] text-[#F5F5DC] py-4 rounded-xl font-black text-lg hover:bg-[#3E2723] hover:scale-[1.02] transition-all duration-300 mt-6 shadow-xl border-2 border-[#8B0000] hover:border-[#D7CCC8]">
            AUTHENTICATE
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#D7CCC8] pt-4">
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-[#A1887F] hover:text-[#3E2723]">← Return to Public Site</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
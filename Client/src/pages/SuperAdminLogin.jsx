import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import scribbleBg from '../assets/scribble-bg.png';

const SuperAdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '', godKey: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSuperAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // GOD-KEY CHECK (Maximum Security Front-Gate)
    const VALID_GOD_KEY = "ROOTLE-ALPHA-26"; 
    if (formData.godKey !== VALID_GOD_KEY) {
      setErrorMsg("CRITICAL: Invalid SuperAdmin Authorization Key. Access Denied.");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/login', { 
        email: formData.email, 
        password: formData.password 
      });

      const data = response.data;

      // CLEARANCE LEVEL CHECK
      if (data.user?.role === 'superadmin') {
        login(data.user, data.token);
        navigate('/dashboard/superadmin'); 
      } else {
        setErrorMsg("Security Breach: Account does not have SuperAdmin privileges.");
      }
    } catch (err) {
      console.error("SuperAdmin Login Error:", err);
      setErrorMsg(err.response?.data?.message || "Mainframe offline. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#0A0A0A', backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay', backgroundSize: '400px' }}>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#121212] border-4 border-[#C5A059] p-8 md:p-10 rounded-[20px] shadow-[0px_0px_50px_rgba(197,160,89,0.15)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#C5A059]"></div>

        <div className="text-center mb-8">
          <div className="inline-block bg-[#C5A059] text-[#0A0A0A] px-5 py-1 rounded-sm text-[10px] font-black uppercase tracking-[0.4em] mb-4">Super Admin Mode</div>
          <h2 className="text-3xl font-black text-[#F5F5DC] uppercase tracking-tighter">System Core</h2>
          <p className="text-[#C5A059] text-[10px] font-bold uppercase tracking-widest mt-2">SuperAdmin Access Only</p>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-6 p-3 bg-red-950/80 border-2 border-red-600 rounded-md text-red-300 text-xs font-mono font-bold text-center"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        <form onSubmit={handleSuperAdminLogin} className="space-y-5">
          <div>
            <label className="text-[9px] font-black uppercase text-[#888888] ml-1 tracking-widest block mb-1">Master Email</label>
            <input 
              required 
              type="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange} 
              className="w-full bg-[#1A1A1A] text-[#F5F5DC] border-2 border-[#333333] p-4 rounded-md font-bold outline-none focus:border-[#C5A059] transition-all" 
              placeholder="sysadmin@rootle.com" 
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-black uppercase text-[#888888] ml-1 tracking-widest">Master Password</label>
              <button 
                type="button" 
                onClick={() => setShowPasswords(!showPasswords)} 
                className="text-[9px] text-[#C5A059] font-bold uppercase tracking-wider hover:underline"
              >
                {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
            <input 
              required 
              type={showPasswords ? "text" : "password"} 
              name="password" 
              value={formData.password}
              onChange={handleChange} 
              className="w-full bg-[#1A1A1A] text-[#F5F5DC] border-2 border-[#333333] p-4 rounded-md font-bold outline-none focus:border-[#C5A059] transition-all" 
              placeholder="••••••••••••" 
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase text-[#C5A059] ml-1 tracking-widest block mb-1">Clearance Key</label>
            <input 
              required 
              type={showPasswords ? "text" : "password"} 
              name="godKey" 
              value={formData.godKey}
              onChange={handleChange} 
              className="w-full bg-[#1A1A1A] border-2 border-[#C5A059] text-[#C5A059] p-4 rounded-md font-mono placeholder:text-[#C5A059]/30 outline-none focus:bg-[#C5A059]/10 transition-all" 
              placeholder="ENTER-ALPHA-KEY" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#C5A059] text-[#0A0A0A] py-4 rounded-md font-black text-lg hover:bg-[#F5F5DC] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mt-6 shadow-xl disabled:opacity-50 uppercase tracking-widest cursor-pointer"
          >
            {loading ? 'INITIALIZING...' : 'ACCESSING SYSTEM'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#333333] pt-6">
          <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-[#555555] hover:text-[#F5F5DC] transition-colors">
            ← Abort & Return to Surface
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import scribbleBg from '../assets/scribble-bg.png';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '', staffKey: '' });
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Trigger 120s visual countdown as soon as they start typing the key
  useEffect(() => {
    if (formData.staffKey && timeLeft === null) {
      setTimeLeft(120);
    }
  }, [formData.staffKey]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post('/auth/login', { 
        email: formData.email, 
        password: formData.password,
        staffKey: formData.staffKey 
      });

      const data = response.data;

      if (data.user.role === 'superadmin') {
        login(data.user, data.token);
        navigate('/dashboard/superadmin');
      } else if (data.user.role === 'lecturer' || data.user.role === 'admin') {
        login(data.user, data.token);
        navigate('/dashboard/lecturer'); 
      } else {
        alert("Access Denied: You are a Student. Use the Student Gate!");
      }
    } catch (err) {
      console.error("Admin Login Error:", err);
      alert(err.response?.data?.message || "Command Center is offline. Check the backend logs.");
    } finally {
      setLoading(false);
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
            <div className="flex justify-between items-center ml-1 mb-1">
              <label className="text-[9px] font-black uppercase text-[#8B0000]">Verification Key</label>
              {timeLeft !== null && (
                <span className={`text-[9px] font-mono font-black ${timeLeft <= 20 ? 'text-red-600 animate-pulse' : 'text-timber-600'}`}>
                  ⏱ Expires in: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                </span>
              )}
            </div>
            <input required type="password" name="staffKey" onChange={handleChange} className="w-full bg-[#FFEBEE] border-2 border-[#8B0000] p-3 rounded-lg font-mono text-[#8B0000] placeholder:text-red-200 outline-none" placeholder="INPUT-VERIFICATION-KEY" />
          </div>

          <button 
            type="submit" 
            disabled={loading || timeLeft === 0}
            className="w-full bg-[#8B0000] text-[#F5F5DC] py-4 rounded-xl font-black text-lg hover:bg-[#3E2723] hover:scale-[1.02] transition-all duration-300 mt-6 shadow-xl border-2 border-[#8B0000] hover:border-[#D7CCC8] disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : timeLeft === 0 ? 'KEY EXPIRED' : 'AUTHENTICATE'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#D7CCC8] pt-4">
          <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-[#A1887F] hover:text-[#3E2723]">← Return to Public Gate</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
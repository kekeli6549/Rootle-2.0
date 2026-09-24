import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import scribbleBg from '../assets/scribble-bg.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/auth/login', formData);
      const data = response.data;

      login(data.user, data.token); 

      // Route based on role
      if (data.user.role === 'lecturer' || data.user.role === 'admin') {
        navigate('/dashboard/lecturer');
      } else if (data.user.role === 'superadmin') {
        navigate('/dashboard/superadmin');
      } else {
        navigate('/dashboard/student'); 
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert(err.response?.data?.message || "The Rootle Server is currently taking a nap. Ensure backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: '#F5F5DC', backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FFFBF0]/90 backdrop-blur-md border-2 sm:border-4 border-[#3E2723] p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] sm:shadow-[15px_15px_0px_0px_rgba(62,39,35,1)] flex flex-col"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723] uppercase tracking-tighter">Welcome to Rootle</h2>
          <p className="text-[#5D4037] text-xs sm:text-sm font-medium mt-2">Enter your academic credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6 flex-grow">
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#3E2723] mb-2">Email Address</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full bg-white border-2 border-[#3E2723] p-3 sm:p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#A0522D] transition-all font-bold text-sm sm:text-base text-[#3E2723]" placeholder="e.g. name@university.edu" />
          </div>
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#3E2723] mb-2">Password</label>
            <input required type="password" name="password" onChange={handleChange} className="w-full bg-white border-2 border-[#3E2723] p-3 sm:p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#A0522D] transition-all font-bold text-sm sm:text-base text-[#3E2723]" placeholder="••••••••" />
          </div>

          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }}
            className="w-full bg-[#3E2723] text-[#F5F5DC] py-3 sm:py-4 rounded-xl font-black text-base sm:text-lg shadow-lg transition-all mt-4 border-2 border-transparent hover:border-[#A0522D] disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN TO ROOTLE'}
          </motion.button>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-xs sm:text-sm font-medium text-[#5D4037]">
          No roots? That ain't Good. <Link to="/register" className="text-[#A0522D] font-bold hover:underline ml-1">Register Here</Link>
        </p>

        {/* Portal Access Links */}
        <div className="mt-6 sm:mt-8 pt-4 border-t border-[#D7CCC8] flex flex-col items-center space-y-3">
          <Link to="/admin-login" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#5D4037] hover:text-[#A0522D] transition-colors">
            Lecturer / Staff Portal →
          </Link>
          <Link to="/superadmin-login" className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#8B0000] hover:text-[#3E2723] transition-colors">
            SuperAdmin Access
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import scribbleBg from '../assets/scribble-bg.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // POINTED FETCH: Hits the standardized backend port
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // HANDSHAKE: Saving user data and token to global state
        login(data.user, data.token); 

        // ROLE-BASED ROUTING: Directing the flow
        if (data.user.role === 'lecturer' || data.user.role === 'admin') {
          navigate('/dashboard/lecturer');
        } else {
          navigate('/dashboard/student'); 
        }
      } else {
        alert(data.message || "Invalid Credentials, check your details.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("The Rootle Server is currently taking a nap. Ensure backend is running!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#F5F5DC', backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#FFFBF0]/80 backdrop-blur-md border-4 border-[#3E2723] p-10 rounded-[40px] shadow-[15px_15px_0px_0px_rgba(62,39,35,1)]"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-[#3E2723] uppercase tracking-tighter">Welcome to Rootle</h2>
          <p className="text-[#5D4037] font-medium mt-2">Enter your academic credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#3E2723] mb-2">Email Address</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#A0522D] transition-all" placeholder="e.g. name@university.edu" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#3E2723] mb-2">Password</label>
            <input required type="password" name="password" onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#A0522D] transition-all" placeholder="••••••••" />
          </div>

          <motion.button 
            type="submit" 
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }}
            className="w-full bg-[#3E2723] text-[#F5F5DC] py-4 rounded-xl font-black text-lg shadow-lg transition-all mt-4 border-2 border-transparent hover:border-[#A0522D]"
          >
            LOGIN TO ROOTLE
          </motion.button>
        </form>

        <p className="text-center mt-8 text-sm font-medium text-[#5D4037]">
          No roots? That ain't Good. <Link to="/register" className="text-[#A0522D] font-bold hover:underline">Register Here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // HANDSHAKE
        login(data.user, data.token); 

        // ROLE-BASED ROUTING LOGIC
        if (data.user.role === 'lecturer' || data.user.role === 'admin') {
          navigate('/dashboard/lecturer');
        } else {
          navigate('/dashboard/student'); 
        }
      } else {
        alert(data.message || "Invalid Credentials");
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("Server is offline, Chief!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#F5F5DC', backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-timber-100/80 backdrop-blur-md border-4 border-timber-800 p-10 rounded-[40px] shadow-[15px_15px_0px_0px_rgba(62,39,35,1)]"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-display font-black text-timber-800 uppercase tracking-tighter">Welcome to Rootle</h2>
          <p className="text-timber-600 font-medium mt-2">Enter your academic credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-timber-800 mb-2">Email Address</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full bg-transparent border-2 border-timber-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-timber-500 transition-all" placeholder="e.g. name@university.edu" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-timber-800 mb-2">Password</label>
            <input required type="password" name="password" onChange={handleChange} className="w-full bg-transparent border-2 border-timber-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-timber-500 transition-all" placeholder="••••••••" />
          </div>

          <motion.button type="submit" whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }}
            className="w-full bg-timber-800 text-timber-100 py-4 rounded-xl font-display font-black text-lg shadow-lg transition-all mt-4 border-2 border-transparent hover:border-timber-500">
            LOGIN TO ROOTLE
          </motion.button>
        </form>

        <p className="text-center mt-8 text-sm font-medium text-timber-700">
         No roots, That ain't Good? <Link to="/register" className="text-timber-500 font-bold hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; 
import scribbleBg from '../assets/scribble-bg.png';

const Register = () => {
  const [role, setRole] = useState('student');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Logic: Funnel to the appropriate login gate
    if (role === 'student') {
      navigate('/login');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 py-12"
      style={{ 
        backgroundColor: '#F5F5DC', 
        backgroundImage: `url(${scribbleBg})`, 
        backgroundSize: '400px' 
      }}
    >
      <motion.div 
        key={role}
        initial={{ rotateY: role === 'student' ? -5 : 5, opacity: 0, scale: 0.95 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-xl bg-timber-100/90 backdrop-blur-sm border-4 border-timber-800 p-12 rounded-[50px] shadow-[20px_20px_0px_0px_rgba(62,39,35,1)]"
      >
        <div className="mb-10 text-center">
          <h2 className="text-5xl font-display font-black text-timber-800 tracking-tighter">Join the Root.</h2>
          
          {/* Role Toggle Switch */}
          <div className="flex justify-center mt-6 bg-timber-200 p-1 rounded-full w-fit mx-auto border-2 border-timber-800">
            {['student', 'lecturer'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  role === r ? 'bg-timber-800 text-timber-100' : 'text-timber-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-timber-800 block mb-2">Full Name</label>
            <input required className="w-full bg-transparent border-2 border-timber-800 p-3 rounded-lg font-body outline-none focus:bg-white/50 transition-all" placeholder="Chidi Obi" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-timber-800 block mb-2">Email</label>
            <input required type="email" className="w-full bg-transparent border-2 border-timber-800 p-3 rounded-lg font-body outline-none focus:bg-white/50 transition-all" placeholder="chidi@uni.edu" />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-timber-800 block mb-2">
              {role === 'student' ? 'Student ID Number' : 'Staff Verification ID'}
            </label>
            <input 
              required
              className="w-full bg-transparent border-2 border-timber-800 p-3 rounded-lg font-body placeholder:text-timber-400 outline-none focus:bg-white/50 transition-all" 
              placeholder={role === 'student' ? "e.g. 2024/12345" : "e.g. L-882-VERIFY"} 
            />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-timber-800 block mb-2">Department</label>
            <select className="w-full bg-transparent border-2 border-timber-800 p-3 rounded-lg font-body appearance-none outline-none focus:bg-white/50 transition-all cursor-pointer">
              <option>Computer Science</option>
              <option>Engineering</option>
              <option>Biological Sciences</option>
              <option>Arts & Humanities</option>
            </select>
          </div>

          <motion.button 
            type="submit"
            whileHover={{ 
              scale: 1.02, 
              backgroundColor: "#3E2723", 
              color: "#F5F5DC" 
            }}
            whileTap={{ scale: 0.98 }}
            className="col-span-2 py-5 rounded-xl font-display font-black text-xl shadow-[8px_8px_0px_0px_rgba(160,82,45,1)] transition-all mt-4 uppercase tracking-tight border-4 border-timber-800 text-timber-800"
          >
            Create My Account
          </motion.button>
        </form>
        
        <p className="text-center mt-6 text-sm font-bold text-timber-700 font-body">
          Already a member? <Link to="/login" className="text-timber-500 hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
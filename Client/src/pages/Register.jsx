import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 
import scribbleBg from '../assets/scribble-bg.png';

const Register = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('student');
  const [departments, setDepartments] = useState([]); // NEW: Store dept list
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    idNumber: '', 
    departmentId: '', // CHANGED: We store ID now
    password: '' 
  });
  const navigate = useNavigate();

  // NEW: Fetch departments from backend on load
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/departments');
        const data = await response.json();
        if (response.ok) {
          setDepartments(data);
          // Set first department as default if list isn't empty
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, departmentId: data[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        if (data.user.role === 'lecturer' || data.user.role === 'admin') {
          navigate('/dashboard/lecturer');
        } else {
          navigate('/dashboard/student');
        }
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register Error:", err);
      alert("Check your connection to the server. Is the backend running?");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 py-12"
      style={{ backgroundColor: '#F5F5DC', backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}
    >
      <motion.div 
        key={role}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-xl bg-[#FFFBF0]/90 backdrop-blur-sm border-4 border-[#3E2723] p-12 rounded-[50px] shadow-[20px_20px_0px_0px_rgba(62,39,35,1)]"
      >
        <div className="mb-10 text-center">
          <h2 className="text-5xl font-black text-[#3E2723] tracking-tighter">Join the Root.</h2>
          <div className="flex justify-center mt-6 bg-[#D7CCC8] p-1 rounded-full w-fit mx-auto border-2 border-[#3E2723]">
            {['student', 'lecturer'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  role === r ? 'bg-[#3E2723] text-[#F5F5DC]' : 'text-[#3E2723]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Full Name</label>
            <input required name="fullName" onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all" placeholder="Chidi Obi" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Email</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all" placeholder="chidi@uni.edu" />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">
              {role === 'student' ? 'Student ID Number' : 'Staff Verification ID'}
            </label>
            <input required name="idNumber" onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all" 
              placeholder={role === 'student' ? "e.g. 2024/12345" : "e.g. L-882-VERIFY"} />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Password</label>
            <input required type="password" name="password" onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all" placeholder="••••••••" />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Department</label>
            <select 
              name="departmentId" 
              value={formData.departmentId} 
              onChange={handleChange} 
              className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg appearance-none outline-none focus:bg-white/50 transition-all cursor-pointer"
            >
              {departments.length > 0 ? (
                departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))
              ) : (
                <option value="">Loading Departments...</option>
              )}
            </select>
          </div>

          <motion.button 
            type="submit" 
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }} 
            whileTap={{ scale: 0.98 }}
            className="col-span-2 py-5 rounded-xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(160,82,45,1)] transition-all mt-4 uppercase tracking-tight border-4 border-[#3E2723] text-[#3E2723]"
          >
            Create My Account
          </motion.button>
        </form>
        
        <p className="text-center mt-6 text-sm font-bold text-[#5D4037]">
          Already a Rootler?{" "}
          <Link to={role === 'lecturer' ? "/admin" : "/login"} className="text-[#A0522D] hover:underline font-black">
            {role === 'lecturer' ? "Lecturer Log In" : "Log In"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
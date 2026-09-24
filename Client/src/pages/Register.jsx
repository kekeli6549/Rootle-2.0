import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 
import API from '../api';
import scribbleBg from '../assets/scribble-bg.png';

const Register = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('student');
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    idNumber: '', 
    departmentId: '', 
    password: '',
    staffKey: ''
  });
  const navigate = useNavigate();

  // Handle Role Switch
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'student') {
      setFormData(prev => ({ ...prev, staffKey: '' }));
      setTimeLeft(null);
    }
  };

  // Staff Key countdown timer logic
  useEffect(() => {
    if (role === 'lecturer' && formData.staffKey.trim() !== '') {
      if (timeLeft === null) {
        setTimeLeft(120);
      }
    } else {
      setTimeLeft(null);
    }
  }, [formData.staffKey, role]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Reset timer if user edits staff key after expiration
  const handleStaffKeyChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, staffKey: value }));
    if (timeLeft === 0 && value.trim() !== '') {
      setTimeLeft(120);
    }
  };

  // Fetch Faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await API.get('/auth/faculties');
        const data = Array.isArray(res.data) ? res.data : [];
        setFaculties(data);
        if (data.length > 0) {
          setSelectedFaculty(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load faculties:", err);
      }
    };
    fetchFaculties();
  }, []);

  // Fetch Departments when Faculty changes
  useEffect(() => {
    if (!selectedFaculty) return;
    const fetchDepts = async () => {
      try {
        const res = await API.get(`/auth/departments?facultyId=${selectedFaculty}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setDepartments(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: data[0]._id }));
        } else {
          setFormData(prev => ({ ...prev, departmentId: '' }));
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
        setDepartments([]);
        setFormData(prev => ({ ...prev, departmentId: '' }));
      }
    };
    fetchDepts();
  }, [selectedFaculty]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.departmentId) {
      alert("Please select a valid department.");
      return;
    }

    if (role === 'lecturer' && timeLeft === 0) {
      alert("Staff key has expired. Please re-enter your key to reset the timer.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, role };
      if (role === 'student') {
        delete payload.staffKey;
      }

      const response = await API.post('/auth/register', payload);
      const data = response.data;

      login(data.user, data.token);
      if (data.user?.role === 'lecturer' || data.user?.role === 'admin') {
        navigate('/dashboard/lecturer');
      } else {
        navigate('/dashboard/student');
      }
    } catch (err) {
      console.error("Register Error:", err);
      alert(err.response?.data?.message || "Registration failed. Check your connection.");
    } finally {
      setLoading(false);
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
        className="w-full max-w-xl bg-[#FFFBF0]/90 backdrop-blur-sm border-4 border-[#3E2723] p-8 md:p-12 rounded-[50px] shadow-[20px_20px_0px_0px_rgba(62,39,35,1)]"
      >
        <div className="mb-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-[#3E2723] tracking-tighter">Join the Root.</h2>
          <div className="flex justify-center mt-6 bg-[#D7CCC8] p-1.5 rounded-full w-fit mx-auto border-2 border-[#3E2723]">
            {['student', 'lecturer'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`px-6 md:px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  role === r ? 'bg-[#3E2723] text-[#F5F5DC] shadow-sm' : 'text-[#3E2723] hover:text-black'
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
            <input 
              required 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all font-bold text-[#3E2723]" 
              placeholder="Chidi Obi" 
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Email</label>
            <input 
              required 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all font-bold text-[#3E2723]" 
              placeholder="chidi@uni.edu" 
            />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">
              {role === 'student' ? 'Student ID Number' : 'Staff Verification ID'}
            </label>
            <input 
              required 
              name="idNumber" 
              value={formData.idNumber} 
              onChange={handleChange} 
              className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all font-bold text-[#3E2723]" 
              placeholder={role === 'student' ? "e.g. 2024/12345" : "e.g. L-882-VERIFY"} 
            />
          </div>

          {role === 'lecturer' && (
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B0000]">Admin Passkey (Staff Key)</label>
                {timeLeft !== null && (
                  <span className={`text-[10px] font-mono font-black ${timeLeft <= 20 ? 'text-red-600 animate-pulse' : 'text-[#5D4037]'}`}>
                    ⏱ Expires in: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                  </span>
                )}
              </div>
              <input 
                required 
                type="password" 
                name="staffKey" 
                value={formData.staffKey} 
                onChange={handleStaffKeyChange} 
                className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all font-bold font-mono text-[#3E2723]" 
                placeholder="Enter staff passcode" 
              />
              {timeLeft === 0 && (
                <p className="text-xs text-red-600 font-bold mt-1">Passkey expired! Modify or re-enter passcode to renew timer.</p>
              )}
            </div>
          )}

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Password</label>
            <input 
              required 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all font-bold text-[#3E2723]" 
              placeholder="••••••••" 
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Faculty</label>
            <div className="relative">
              <select 
                value={selectedFaculty} 
                onChange={(e) => setSelectedFaculty(e.target.value)} 
                className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all cursor-pointer font-bold text-[#3E2723] pr-8"
              >
                {faculties.map(fac => (
                  <option key={fac._id} value={fac._id}>{fac.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#3E2723] font-black text-xs">▼</div>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Department</label>
            <div className="relative">
              <select 
                name="departmentId" 
                value={formData.departmentId} 
                onChange={handleChange} 
                className="w-full bg-white/70 border-2 border-[#3E2723] p-3 rounded-xl appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059] transition-all cursor-pointer font-bold text-[#3E2723] pr-8"
              >
                {departments.length > 0 ? (
                  departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))
                ) : (
                  <option value="">No departments available</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#3E2723] font-black text-xs">▼</div>
            </div>
          </div>

          <motion.button 
            type="submit" 
            disabled={loading || (role === 'lecturer' && timeLeft === 0)}
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }} 
            whileTap={{ scale: 0.98 }}
            className="col-span-2 py-4 md:py-5 rounded-2xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(160,82,45,1)] transition-all mt-4 uppercase tracking-tight border-4 border-[#3E2723] text-[#3E2723] bg-[#C5A059] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'CREATING ACCOUNT...' : (role === 'lecturer' && timeLeft === 0) ? 'KEY EXPIRED' : 'Create My Account'}
          </motion.button>
        </form>
        
        <p className="text-center mt-6 text-sm font-bold text-[#5D4037]">
          Already a Rootler?{" "}
          <Link to="/login" className="text-[#A0522D] hover:underline font-black">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
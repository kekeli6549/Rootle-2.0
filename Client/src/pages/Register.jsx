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

  // Trigger 120s visual countdown as soon as they enter a staff key
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

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await API.get('/auth/faculties');
        setFaculties(res.data);
        if (res.data.length > 0) {
          setSelectedFaculty(res.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load faculties:", err);
      }
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (!selectedFaculty) return;
    const fetchDepts = async () => {
      try {
        const res = await API.get(`/auth/departments?facultyId=${selectedFaculty}`);
        setDepartments(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: res.data[0]._id }));
        } else {
          setFormData(prev => ({ ...prev, departmentId: '' }));
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
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

    setLoading(true);
    try {
      const response = await API.post('/auth/register', { ...formData, role });
      const data = response.data;

      login(data.user, data.token);
      if (data.user.role === 'lecturer' || data.user.role === 'admin') {
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
        className="w-full max-w-xl bg-[#FFFBF0]/90 backdrop-blur-sm border-4 border-[#3E2723] p-12 rounded-[50px] shadow-[20px_20px_0px_0px_rgba(62,39,35,1)]"
      >
        <div className="mb-8 text-center">
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
            <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold" placeholder="Chidi Obi" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Email</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold" placeholder="chidi@uni.edu" />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">
              {role === 'student' ? 'Student ID Number' : 'Staff Verification ID'}
            </label>
            <input required name="idNumber" value={formData.idNumber} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold" 
              placeholder={role === 'student' ? "e.g. 2024/12345" : "e.g. L-882-VERIFY"} />
          </div>

          {role === 'lecturer' && (
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B0000]">Admin Passkey (Staff Key)</label>
                {timeLeft !== null && (
                  <span className={`text-[9px] font-mono font-black ${timeLeft <= 20 ? 'text-red-600 animate-pulse' : 'text-timber-600'}`}>
                    ⏱ Expires in: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                  </span>
                )}
              </div>
              <input required type="password" name="staffKey" value={formData.staffKey} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold font-mono" placeholder="Enter staff passcode" />
            </div>
          )}

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Password</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold" placeholder="••••••••" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Faculty</label>
            <select 
              value={selectedFaculty} 
              onChange={(e) => setSelectedFaculty(e.target.value)} 
              className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg appearance-none outline-none focus:bg-white/50 transition-all cursor-pointer font-bold"
            >
              {faculties.map(fac => (
                <option key={fac._id} value={fac._id}>{fac.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Department</label>
            <select 
              name="departmentId" 
              value={formData.departmentId} 
              onChange={handleChange} 
              className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg appearance-none outline-none focus:bg-white/50 transition-all cursor-pointer font-bold"
            >
              {departments.length > 0 ? (
                departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))
              ) : (
                <option value="">No departments available</option>
              )}
            </select>
          </div>

          <motion.button 
            type="submit" 
            disabled={loading || timeLeft === 0}
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }} 
            whileTap={{ scale: 0.98 }}
            className="col-span-2 py-5 rounded-xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(160,82,45,1)] transition-all mt-4 uppercase tracking-tight border-4 border-[#3E2723] text-[#3E2723] disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : timeLeft === 0 ? 'KEY EXPIRED' : 'Create My Account'}
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
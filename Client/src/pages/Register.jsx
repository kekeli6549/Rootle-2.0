import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 
import scribbleBg from '../assets/scribble-bg.png';

const Register = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('student');
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    idNumber: '', 
    departmentId: '', 
    password: '',
    staffKey: ''
  });
  const navigate = useNavigate();

  // Fetch Faculties on mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/faculties');
        const data = await res.json();
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

  // Fetch Departments whenever selectedFaculty changes
  useEffect(() => {
    if (!selectedFaculty) return;
    const fetchDepts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/departments?facultyId=${selectedFaculty}`);
        const data = await res.json();
        setDepartments(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: data[0]._id }));
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
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Admin Passkey (Staff Key)</label>
              <input required type="password" name="staffKey" value={formData.staffKey} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold" placeholder="Enter staff passcode" />
            </div>
          )}

          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#3E2723] block mb-2">Password</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-transparent border-2 border-[#3E2723] p-3 rounded-lg outline-none focus:bg-white/50 transition-all font-bold" placeholder="••••••••" />
          </div>

          {/* Faculty Selector */}
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

          {/* Department Selector (Filtered by Faculty) */}
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
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }} 
            whileTap={{ scale: 0.98 }}
            className="col-span-2 py-5 rounded-xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(160,82,45,1)] transition-all mt-4 uppercase tracking-tight border-4 border-[#3E2723] text-[#3E2723]"
          >
            Create My Account
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
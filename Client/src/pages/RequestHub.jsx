import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import scribbleBg from '../assets/scribble-bg.png';

const RequestHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: user?.departmentId || ''
  });

  const fetchHubData = async () => {
    try {
      const token = localStorage.getItem('rootle_token'); // KEY FIXED
      
      const reqRes = await fetch('http://localhost:5000/api/resources/requests', {
        headers: { 'x-auth-token': token }
      });
      const reqData = await reqRes.json();
      
      // Safety check for .map() crash
      setRequests(Array.isArray(reqData) ? reqData : []);

      const deptRes = await fetch('http://localhost:5000/api/auth/departments');
      const deptData = await deptRes.json();
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (err) {
      console.error("Hub Error:", err);
      setRequests([]);
    }
  };

  useEffect(() => { fetchHubData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rootle_token'); // KEY FIXED
      const response = await fetch('http://localhost:5000/api/resources/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowModal(false);
        setFormData({ title: '', description: '', departmentId: user?.departmentId });
        fetchHubData();
      }
    } catch (err) {
      alert("Failed to post request.");
    }
  };

  const handleFulfill = async (id) => {
    if(!window.confirm("Do you have this file? Marking it as fulfilled will remove it from the board.")) return;
    
    try {
      const token = localStorage.getItem('rootle_token'); // KEY FIXED
      await fetch(`http://localhost:5000/api/resources/requests/${id}/fulfill`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
      });
      fetchHubData();
      alert("Oshey! Thanks for helping the community! 🤝");
    } catch (err) {
      alert("Action failed.");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 relative" style={{ backgroundColor: '#F5F5DC', backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}>
      
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-5xl font-black text-[#3E2723] tracking-tighter mb-2">The Hub.</h1>
          <p className="text-[#5D4037] font-medium italic">Ask for what you need. Provide what you have. One family. 🌍</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => navigate(-1)} className="px-6 py-2 border-2 border-[#3E2723] rounded-full font-bold text-[#3E2723] hover:bg-[#D7CCC8] transition">
                Back
            </button>
            <button 
                onClick={() => setShowModal(true)}
                className="px-8 py-3 bg-[#3E2723] text-[#F5F5DC] rounded-full font-black shadow-[4px_4px_0px_0px_rgba(62,39,35,0.8)] hover:translate-y-1 hover:shadow-none transition-all"
            >
                + New Request
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.length === 0 ? (
          <div className="col-span-full text-center py-20 opacity-50">
            <h2 className="text-2xl font-black text-[#3E2723]">No active requests right now.</h2>
            <p>The village is quiet. Everyone is sorted! 🙌</p>
          </div>
        ) : (
          requests.map((req) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FFF8E1] p-6 rounded-2xl border-4 border-[#3E2723] shadow-[8px_8px_0px_0px_rgba(62,39,35,0.2)] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#D7CCC8] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#3E2723]">
                        {req.department_name || 'General'}
                    </span>
                    <span className="text-xs font-bold text-[#8D6E63]">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-black text-[#3E2723] leading-tight mb-2 uppercase">{req.title}</h3>
                <p className="text-[#5D4037] text-sm mb-6">{req.description}</p>
              </div>

              <div className="pt-4 border-t-2 border-[#3E2723]/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3E2723] flex items-center justify-center text-[#F5F5DC] text-xs font-black">
                        {req.student_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-[10px] font-bold text-[#3E2723]">By {req.student_name?.split(' ')[0] || 'User'}</span>
                </div>
                
                <button 
                  onClick={() => handleFulfill(req.id)}
                  className="text-[10px] font-black bg-[#2E7D32] text-white px-3 py-1 rounded-lg hover:bg-[#1B5E20]"
                >
                  Fulfill ✓
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#3E2723]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F5F5DC] w-full max-w-lg p-8 rounded-[30px] border-4 border-[#FFF] shadow-2xl"
            >
              <h2 className="text-3xl font-black text-[#3E2723] mb-6">Make a Wish.</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input 
                  required
                  placeholder="What document do you need?" 
                  className="bg-white border-2 border-[#3E2723] p-4 rounded-xl font-bold outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
                
                <textarea 
                  required
                  rows="4"
                  placeholder="Be specific (e.g. Past Questions for CSC 201)" 
                  className="bg-white border-2 border-[#3E2723] p-4 rounded-xl font-medium outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />

                <select 
                  className="bg-white border-2 border-[#3E2723] p-4 rounded-xl font-bold outline-none"
                  value={formData.departmentId}
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                >
                    <option value="">Select Faculty</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <button type="submit" className="bg-[#3E2723] text-[#F5F5DC] py-4 rounded-xl font-black text-xl hover:scale-[1.02] transition-transform">
                  Post Request
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestHub;
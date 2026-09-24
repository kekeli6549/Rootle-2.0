import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import scribbleBg from '../assets/scribble-bg.png';
import UploadModal from '../components/UploadModal';

const RequestHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [activeRequestTitle, setActiveRequestTitle] = useState('');
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: ''
  });

  // Synchronize default department when user or departments load
  useEffect(() => {
    if (user?.departmentId) {
      setFormData(prev => ({ ...prev, departmentId: user.departmentId }));
    }
  }, [user]);

  const fetchHubData = async () => {
    setLoadingData(true);
    try {
      const [reqRes, deptRes] = await Promise.all([
        API.get('/resources/requests'),
        API.get('/auth/departments')
      ]);
      setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
      const deptData = Array.isArray(deptRes.data) ? deptRes.data : [];
      setDepartments(deptData);

      if (!formData.departmentId && deptData.length > 0) {
        setFormData(prev => ({ ...prev, departmentId: user?.departmentId || deptData[0]._id }));
      }
    } catch (err) {
      console.error("Failed to fetch hub data:", err);
      setRequests([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { 
    fetchHubData(); 
  }, []);

  const handlePostRequest = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await API.post('/resources/requests', formData);
      if (response.status === 200 || response.status === 201) {
        setShowRequestModal(false);
        setFormData({ 
          title: '', 
          description: '', 
          departmentId: user?.departmentId || (departments[0]?._id || '') 
        });
        fetchHubData();
      }
    } catch (err) { 
      alert(err.response?.data?.message || "Failed to post request."); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFulfillUpload = (id, title) => {
    setActiveRequestId(id);
    setActiveRequestTitle(title);
    setShowUploadModal(true);
  };

  const openNewRequestModal = () => {
    setFormData(prev => ({
      ...prev,
      departmentId: prev.departmentId || user?.departmentId || (departments[0]?._id || '')
    }));
    setShowRequestModal(true);
  };

  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase();
    const titleMatch = (req.title || '').toLowerCase().includes(query);
    const descMatch = (req.description || '').toLowerCase().includes(query);
    const deptMatch = (req.department_name || '').toLowerCase().includes(query);
    return titleMatch || descMatch || deptMatch;
  });

  return (
    <div className="min-h-screen p-6 md:p-12 relative bg-[#F5F5DC]" style={{ backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-[#3E2723] text-[#F5F5DC] px-3.5 py-1.5 rounded-full mb-3 inline-block shadow-sm">
            Community Exchange
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-[#3E2723] tracking-tighter mb-2">The Hub.</h1>
          <p className="text-[#5D4037] font-bold italic">Ask for what you need. Provide what you have. 🌍</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-3 border-4 border-[#3E2723] rounded-2xl font-black text-[#3E2723] bg-white hover:bg-[#D7CCC8] transition shadow-[4px_4px_0px_0px_#3E2723] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            ← Back
          </button>
          <button 
            onClick={openNewRequestModal} 
            className="flex-1 md:flex-initial px-8 py-3 bg-[#3E2723] text-[#F5F5DC] border-4 border-[#3E2723] rounded-2xl font-black shadow-[4px_4px_0px_0px_#C5A059] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#C5A059] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-10 max-w-xl">
        <input 
          type="text" 
          placeholder="Search requested notes, past questions, or faculties..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-4 border-[#3E2723] p-4 rounded-2xl font-bold text-[#3E2723] placeholder-[#8D6E63] shadow-[4px_4px_0px_0px_#3E2723] focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
        />
      </div>

      {/* Grid Content */}
      {loadingData ? (
        <div className="py-20 text-center">
          <p className="font-black text-[#3E2723] uppercase tracking-widest text-lg animate-pulse">
            Fetching Community Requests...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode='popLayout'>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  whileHover={{ y: -4 }}
                  key={req._id}
                  className="bg-[#FFF8E1] p-8 rounded-[30px] border-4 border-[#3E2723] flex flex-col justify-between shadow-[8px_8px_0px_0px_#3E2723] transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <span className="bg-[#D7CCC8] border-2 border-[#3E2723] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#3E2723] truncate max-w-[60%]">
                        {req.department_name || 'General'}
                      </span>
                      <span className="text-[10px] font-black bg-white border-2 border-[#3E2723] px-2.5 py-1 rounded-lg text-[#8D6E63] shrink-0">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#3E2723] leading-tight mb-3 uppercase tracking-tight">{req.title}</h3>
                    <p className="text-[#5D4037] text-sm font-medium mb-6 line-clamp-3 leading-relaxed">{req.description}</p>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-[#3E2723]/20 flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#3E2723]">
                      Req: {req.student_name ? req.student_name.split(' ')[0] : 'Student'}
                    </span>
                    <button 
                      onClick={() => openFulfillUpload(req._id, req.title)} 
                      className="text-[10px] font-black bg-[#2E7D32] text-white border-2 border-[#3E2723] px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_#3E2723] hover:bg-[#1B5E20] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      Fulfill ✓
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center border-4 border-dashed border-[#8D6E63]/40 rounded-[40px] bg-white/50">
                <p className="font-black text-[#8D6E63] uppercase tracking-[0.2em] text-sm">No active requests match your search.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal Integration */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => { 
          setRequests(prev => prev.filter(r => r._id !== activeRequestId));
          setShowUploadModal(false); 
          fetchHubData();
        }}
        fulfillRequestId={activeRequestId}
        requestTitle={activeRequestTitle}
      />

      {/* New Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-[#3E2723]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
            onClick={() => !isSubmitting && setShowRequestModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-[#F5F5DC] w-full max-w-lg p-8 md:p-10 rounded-[40px] border-4 border-[#3E2723] shadow-[16px_16px_0px_0px_#1a0f0d]"
            >
              <h2 className="text-4xl font-black text-[#3E2723] mb-2 uppercase tracking-tight">Make a Wish.</h2>
              <p className="text-xs font-bold text-[#8D6E63] mb-6 uppercase tracking-wider">Broadcast your document need to the faculty vault.</p>
              
              <form onSubmit={handlePostRequest} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-2 text-[#5D4037]">Document Name</label>
                  <input 
                    required 
                    placeholder="e.g., Advanced Calculus Midterm Solutions" 
                    className="w-full bg-white border-4 border-[#3E2723] p-4 rounded-2xl font-bold text-[#3E2723] outline-none shadow-[4px_4px_0px_0px_#3E2723] focus:ring-2 focus:ring-[#C5A059]" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-2 text-[#5D4037]">Description & Specifics</label>
                  <textarea 
                    required 
                    placeholder="Describe chapter coverage, lecturer name, or specific problem sets..." 
                    className="w-full bg-white border-4 border-[#3E2723] p-4 rounded-2xl font-medium text-[#3E2723] outline-none shadow-[4px_4px_0px_0px_#3E2723] focus:ring-2 focus:ring-[#C5A059] h-32 resize-none" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-2 text-[#5D4037]">Department / Faculty</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-white border-4 border-[#3E2723] p-4 rounded-2xl font-bold text-[#3E2723] outline-none shadow-[4px_4px_0px_0px_#3E2723] appearance-none pr-10 cursor-pointer" 
                      value={formData.departmentId} 
                      onChange={e => setFormData({...formData, departmentId: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#3E2723] font-black">▼</div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => setShowRequestModal(false)} 
                    className="flex-1 font-black text-[#8D6E63] uppercase tracking-wider text-xs py-3 hover:text-[#3E2723] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-[#C5A059] text-[#3E2723] border-4 border-[#3E2723] py-4 rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_#3E2723] hover:bg-[#b5904d] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestHub;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import scribbleBg from '../assets/scribble-bg.png';

const LecturerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('Review Queue');
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW STATES FOR UPLOAD ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [category, setCategory] = useState('Handout');
  const [file, setFile] = useState(null);

  const token = localStorage.getItem('rootle_token');
  const BACKEND_URL = "http://localhost:5000"; // Define base URL for files

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '';
      
      if (activeTab === 'Review Queue') {
        endpoint = `${BACKEND_URL}/api/resources?status=pending&departmentId=${user.department_id}`;
      } else if (activeTab === 'Department Vault') {
        endpoint = `${BACKEND_URL}/api/resources?status=approved&departmentId=${user.department_id}`;
      } else if (activeTab === 'World Library') {
        endpoint = `${BACKEND_URL}/api/resources?status=approved`; 
      } else if (activeTab === 'Deletion Inbox') {
        // Admin/Lecturer specific deletion requests
        endpoint = `${BACKEND_URL}/api/resources/admin/deletion-requests`;
      }

      const res = await fetch(endpoint, {
        headers: { 'x-auth-token': token }
      });
      
      if (!res.ok) throw new Error("Connection to vault failed.");
      const data = await res.json();
      setDataList(data);
    } catch (err) {
      setError("Vault synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  // --- LOGIC: ACTION HANDLER (APPROVE/REJECT/PURGE) ---
  const handleAction = async (id, action, type = 'approval') => {
    if(!window.confirm(`Are you sure you want to ${action} this?`)) return;
    try {
      let endpoint = "";
      if (type === 'approval') {
        // action is either 'approve' or 'reject'
        endpoint = `${BACKEND_URL}/api/resources/admin/${action}/${id}`;
      } else {
        endpoint = `${BACKEND_URL}/api/resources/admin/permanent-delete/${id}`;
      }
      
      const response = await fetch(endpoint, {
        method: action === 'reject' || action === 'permanent' || type === 'delete' ? 'DELETE' : 'POST',
        headers: { 'x-auth-token': token }
      });

      if (response.ok) {
        fetchDashboardData(); 
      } else {
        const errData = await response.json();
        alert(errData.message || "Action denied. Check your jurisdiction.");
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  // --- LOGIC: UPLOAD HANDLER ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Abeg, select a file first!");

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('category', category);
    formData.append('file', file); // Matches the 'file' field in Multer

    try {
      const res = await fetch(`${BACKEND_URL}/api/resources/upload`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData
      });

      if (res.ok) {
        setIsModalOpen(false);
        setUploadTitle('');
        setFile(null);
        fetchDashboardData();
        alert("Success! Resource added to the queue.");
      } else {
        alert("Upload failed. Try again, Chief.");
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  // --- LOGIC: VIEW FILE ---
  const handleViewFile = (url) => {
    const fullUrl = `${BACKEND_URL}/${url.replace(/\\/g, '/')}`;
    window.open(fullUrl, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#3E2723] flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-gold-leaf border-t-transparent rounded-full" />
        <p className="mt-6 font-display font-black text-gold-leaf uppercase tracking-[0.3em] text-xs">Syncing Command Center...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#3E2723] overflow-hidden" style={{ backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay' }}>
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-timber-900 text-timber-100 p-8 fixed h-full border-r-4 border-red-900/30 shadow-2xl flex flex-col z-20">
        <div className="mb-12">
            <div className="text-4xl font-display font-black text-gold-leaf tracking-tighter">Rootle.</div>
            <div className="text-[10px] font-black text-red-500 tracking-[0.4em] uppercase">Staff Command</div>
        </div>

        <nav className="space-y-4 flex-1">
          {['Review Queue', 'Department Vault', 'World Library', 'Deletion Inbox'].map((item) => (
            <motion.div key={item} whileHover={{ x: 10 }} onClick={() => setActiveTab(item)}
              className={`cursor-pointer font-display uppercase text-xs font-black tracking-widest p-4 rounded-xl flex items-center gap-4 transition-all ${
                activeTab === item ? 'bg-red-900/40 text-gold-leaf border-l-4 border-gold-leaf' : 'text-timber-400 hover:text-timber-100'
              }`}>
              {item}
            </motion.div>
          ))}
        </nav>
        
        <div className="mt-auto border-t border-red-900/50 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold-leaf rounded-full flex items-center justify-center text-timber-900 font-black border-2 border-timber-800">
                {user?.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-timber-100 leading-none truncate max-w-[120px]">{user?.fullName}</p>
                <p className="text-[8px] text-red-400 font-mono uppercase tracking-tighter">{user?.role} ACCESS</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-3 bg-red-950/50 border border-red-900 text-[9px] font-black uppercase text-red-400 hover:bg-red-900 hover:text-white transition-all rounded-lg">
              Terminate Session
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-72 p-12 bg-[#F5F5DC] rounded-l-[60px] my-4 shadow-[-30px_0_60px_rgba(0,0,0,0.5)] min-h-[95vh] overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <p className="text-red-900 font-black text-[10px] uppercase tracking-[0.4em] mb-2">
                {activeTab === 'World Library' ? 'Global Access' : `${user?.departmentName || 'Department'} Portal`}
            </p>
            <h1 className="text-7xl font-display font-black text-timber-800 tracking-tighter leading-none">
              {activeTab === 'Review Queue' ? 'The Gate.' : 
               activeTab === 'Department Vault' ? 'The Vault.' : 
               activeTab === 'World Library' ? 'The Roots.' : 'Purge List.'}
            </h1>
          </div>
          
          {activeTab !== 'Deletion Inbox' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-timber-800 text-gold-leaf px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-transform">
              + New Upload
            </button>
          )}
        </header>

        <div className="grid gap-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {dataList.map((item) => {
                const isMyDepartment = (item.department_id === user?.department_id);
                const resourceId = item.resource_id || item.id;

                return (
                  <div key={item.id} className={`bg-white border-4 border-timber-800 p-8 rounded-[40px] flex justify-between items-center shadow-[15px_15px_0px_0px_#3E2723] group transition-all`}>
                    <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-timber-100 rounded-2xl flex items-center justify-center text-3xl border-2 border-timber-800 group-hover:bg-gold-leaf transition-colors">
                          {item.category === 'Past Question' ? '📜' : '📄'}
                        </div>
                        <div>
                            <h3 className="font-display font-black text-2xl text-timber-800 uppercase leading-none mb-1">{item.title}</h3>
                            <p className="text-timber-400 font-black text-[10px] uppercase tracking-widest">
                                {item.category} • {item.uploader_name || 'System'}
                                {!isMyDepartment && <span className="text-red-900 ml-2 border border-red-900 px-1 rounded text-[8px]">EXTERNAL DEPT</span>}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {/* UNIVERSAL ACTION: VIEW */}
                      <button 
                        onClick={() => handleViewFile(item.file_url)}
                        className="px-6 py-2 bg-timber-100 text-timber-800 border-2 border-timber-800 font-black text-[9px] uppercase rounded-lg hover:bg-timber-800 hover:text-white transition-all">
                        View
                      </button>

                      {/* ACTION: REVIEW QUEUE */}
                      {activeTab === 'Review Queue' && (
                        <>
                          <button onClick={() => handleAction(item.id, 'reject')} className="px-6 py-2 bg-red-100 text-red-900 border-2 border-red-900 font-black text-[9px] uppercase rounded-lg">Decline</button>
                          <button onClick={() => handleAction(item.id, 'approve')} className="px-6 py-2 bg-timber-800 text-gold-leaf font-black text-[9px] uppercase rounded-lg">Verify & Publish</button>
                        </>
                      )}

                      {/* ACTION: DEPARTMENT VAULT */}
                      {activeTab === 'Department Vault' && (
                        <button onClick={() => handleAction(item.id, 'permanent', 'delete')} className="px-6 py-2 bg-red-900 text-white font-black text-[9px] uppercase rounded-lg">Delete</button>
                      )}

                      {/* ACTION: WORLD LIBRARY */}
                      {activeTab === 'World Library' && isMyDepartment && (
                         <button onClick={() => handleAction(item.id, 'permanent', 'delete')} className="px-6 py-2 bg-red-900 text-white font-black text-[9px] uppercase rounded-lg">Delete</button>
                      )}

                      {/* ACTION: DELETION INBOX */}
                      {activeTab === 'Deletion Inbox' && (
                        <button onClick={() => handleAction(resourceId, 'permanent', 'delete')} className="px-8 py-3 bg-red-900 text-white font-black text-[10px] uppercase rounded-xl shadow-lg hover:bg-black transition-all">
                          Purge Permanently
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {dataList.length === 0 && <EmptyState text={`The ${activeTab} is currently clear.`} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- MODAL COMPONENT (African/Diaspora Styling Preserved) --- */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-timber-900/80 backdrop-blur-md p-6">
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-[#F5F5DC] p-10 rounded-[50px] border-8 border-timber-800 w-full max-w-lg shadow-[30px_30px_0px_0px_#1a0f0d]">
                <h2 className="text-4xl font-display font-black text-timber-800 mb-8 uppercase tracking-tighter">New Entry.</h2>
                
                <form onSubmit={handleUpload} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-timber-400 uppercase tracking-widest block mb-2">Resource Title</label>
                    <input 
                      type="text" required
                      className="w-full bg-white border-4 border-timber-800 p-4 rounded-2xl font-black text-timber-800 text-sm focus:outline-none"
                      value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-timber-400 uppercase tracking-widest block mb-2">Category</label>
                    <select 
                      className="w-full bg-white border-4 border-timber-800 p-4 rounded-2xl font-black text-timber-800 text-sm focus:outline-none appearance-none"
                      value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option>Handout</option>
                      <option>Past Question</option>
                      <option>Syllabus</option>
                      <option>Assignment</option>
                    </select>
                  </div>

                  <div className="border-4 border-dashed border-timber-200 p-8 rounded-3xl text-center">
                    <input 
                      type="file" required id="fileInput" className="hidden"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <label htmlFor="fileInput" className="cursor-pointer">
                      <p className="text-3xl mb-2">📂</p>
                      <p className="font-black text-[10px] text-timber-400 uppercase tracking-widest">
                        {file ? file.name : "Tap to select document"}
                      </p>
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-timber-400 hover:text-timber-800 transition-colors">
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-timber-800 text-gold-leaf rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">
                      Deploy Resource
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const EmptyState = ({ text }) => (
    <div className="py-24 text-center border-4 border-dashed border-timber-200 rounded-[50px]">
        <p className="font-display font-black text-timber-300 uppercase tracking-[0.5em] text-xs">{text}</p>
    </div>
);

export default LecturerDashboard;
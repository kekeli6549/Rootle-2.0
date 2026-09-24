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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [uploadTitle, setUploadTitle] = useState('');
  const [category, setCategory] = useState('Handout');
  const [file, setFile] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const token = localStorage.getItem('rootle_token');
  const BACKEND_URL = "http://localhost:5000";

  const fetchDashboardData = async () => {
    if (!user || (!user._id && !user.id)) return;
    
    setLoading(true);
    try {
      let endpoint = '';
      const deptId = user?.departmentId || user?.department_id;

      if (activeTab === 'Review Queue') {
        endpoint = `${BACKEND_URL}/api/resources?status=pending${deptId ? `&departmentId=${deptId}` : ''}`;
      } else if (activeTab === 'Department Vault') {
        if (!deptId) {
            setDataList([]);
            return setLoading(false);
        }
        endpoint = `${BACKEND_URL}/api/resources?status=approved&departmentId=${deptId}`;
      } else if (activeTab === 'World Library') {
        endpoint = `${BACKEND_URL}/api/resources?status=approved`; 
      } else if (activeTab === 'Deletion Inbox') {
        endpoint = `${BACKEND_URL}/api/resources/admin/deletion-requests`;
      } else if (activeTab === 'Community Wishlist') {
        endpoint = `${BACKEND_URL}/api/resources/requests${deptId ? `?departmentId=${deptId}` : ''}`;
      }

      const res = await fetch(endpoint, { 
        headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json' 
        } 
      });

      if (!res.ok) throw new Error("Vault synchronization failed.");
      const data = await res.json();
      setDataList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchDashboardData(); 
  }, [activeTab, user]);

  const handleAction = async (id, action) => {
    const confirmMsg = action === 'permanent' ? "PERMANENTLY PURGE from the vault?" : `Are you sure you want to ${action} this?`;
    if(!window.confirm(confirmMsg)) return;

    try {
      let endpoint = '';
      let method = '';

      if (activeTab === 'Deletion Inbox') {
          if (action === 'permanent') {
            endpoint = `${BACKEND_URL}/api/resources/admin/permanent/${id}`;
            method = 'DELETE';
          } else {
             endpoint = `${BACKEND_URL}/api/resources/admin/reject-deletion/${id}`;
             method = 'DELETE';
          }
      } 
      else {
          if (action === 'permanent') {
              endpoint = `${BACKEND_URL}/api/resources/admin/permanent/${id}`;
              method = 'DELETE';
          } else {
              endpoint = `${BACKEND_URL}/api/resources/admin/${action}/${id}`;
              method = action === 'approve' ? 'PUT' : 'DELETE';
          }
      }
      
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'x-auth-token': token }
      });

      if (response.ok) {
          fetchDashboardData();
      } else {
          const errorData = await response.json();
          alert(errorData.message || "Operation failed.");
      }
    } catch (err) { 
      alert("Server communication failure."); 
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first!");

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('category', category);
    
    if (selectedRequestId) {
        formData.append('requestId', selectedRequestId);
    }

    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/resources/upload`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setUploadTitle('');
        setFile(null);
        setSelectedRequestId(null); 
        fetchDashboardData(); 
        alert("DEPLOY SUCCESSFUL: Resource synced! ⚡");
      } else {
          alert(data.message || "Upload failed.");
      }
    } catch (err) { 
        alert("Critical failure during sync.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleViewFile = (url) => {
    if (!url) return alert("File path missing");
    const fullUrl = `${BACKEND_URL}/${url.replace(/\\/g, '/')}`;
    window.open(fullUrl, '_blank');
  };

  if (loading && !user) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen bg-[#3E2723] overflow-hidden relative" style={{ backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay' }}>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static w-64 sm:w-72 bg-timber-900 text-timber-100 p-6 sm:p-8 h-full border-r-4 border-red-900/30 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex justify-between items-start mb-10 sm:mb-12">
            <div>
              <div className="text-3xl sm:text-4xl font-display font-black text-gold-leaf tracking-tighter">Rootle.</div>
              <div className="text-[9px] sm:text-[10px] font-black text-red-500 tracking-[0.3em] sm:tracking-[0.4em] uppercase">Staff Command</div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-timber-100 text-2xl font-black">×</button>
        </div>

        <nav className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto pr-2">
          {['Review Queue', 'Department Vault', 'World Library', 'Community Wishlist', 'Deletion Inbox'].map((item) => (
            <motion.div key={item} whileHover={{ x: 10 }} onClick={() => { setActiveTab(item); setIsMobileMenuOpen(false); }}
              className={`cursor-pointer font-display uppercase text-[9px] sm:text-[10px] font-black tracking-widest p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4 transition-all ${
                activeTab === item ? 'bg-red-900/40 text-gold-leaf border-l-4 border-gold-leaf' : 'text-timber-400 hover:text-timber-100'
              }`}>
              {item}
            </motion.div>
          ))}
        </nav>

        <div className="mt-4 sm:mt-auto border-t border-red-900/50 pt-4 sm:pt-6">
            <div className="bg-black/20 p-3 sm:p-4 rounded-2xl mb-3 sm:mb-4 border border-red-900/30">
              <p className="text-[7px] sm:text-[8px] text-gold-leaf/50 font-black uppercase tracking-[0.2em] mb-1 sm:mb-2">Authenticated Staff</p>
              <h4 className="text-xs sm:text-sm font-black text-white uppercase leading-tight truncate">{user?.fullName || 'Lecturer Name'}</h4>
              <p className="text-[8px] sm:text-[9px] text-red-400 font-bold uppercase mt-1 truncate">{user?.departmentName}</p>
            </div>
            <button onClick={logout} className="w-full py-2.5 sm:py-3 bg-red-950/50 border border-red-900 text-[8px] sm:text-[9px] font-black uppercase text-red-400 rounded-lg hover:bg-red-900/50 transition-colors">Terminate Session</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:w-auto p-4 sm:p-8 lg:p-12 bg-[#F5F5DC] lg:rounded-l-[60px] lg:my-4 shadow-none lg:shadow-[-30px_0_60px_rgba(0,0,0,0.5)] min-h-screen lg:min-h-[95vh] overflow-y-auto">
        
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10 sm:mb-16 pt-2 lg:pt-0">
          <div className="flex justify-between items-center w-full lg:w-auto">
            <div>
              <p className="text-red-900 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2">{activeTab}</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black text-timber-800 tracking-tighter leading-none break-words">
                {activeTab === 'Review Queue' ? 'The Gate.' : 
                 activeTab === 'Department Vault' ? 'The Vault.' : 
                 activeTab === 'Community Wishlist' ? 'The Hub.' : 'Registry.'}
              </h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden bg-timber-800 text-gold-leaf px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest h-fit">
              Menu
            </button>
          </div>
          
          <button onClick={() => { setSelectedRequestId(null); setUploadTitle(''); setIsModalOpen(true); }} className="w-full lg:w-auto bg-timber-800 text-gold-leaf px-6 py-3 rounded-full sm:rounded-xl lg:rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg sm:shadow-xl hover:scale-105 transition-transform">
            + New Upload
          </button>
        </header>

        <div className="grid gap-6 sm:gap-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
              {dataList.length > 0 ? dataList.map((item) => {
                const isMyDepartment = (item.department_id === user?.departmentId || item.departmentId === user?.departmentId);

                // --- 1. RENDER WISHLIST CARDS ---
                if (activeTab === 'Community Wishlist') {
                  return (
                    <div key={item._id || item.id} className="bg-white border-2 sm:border-4 border-timber-800 p-5 sm:p-8 rounded-[25px] sm:rounded-[40px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 shadow-[8px_8px_0px_0px_#3E2723] sm:shadow-[15px_15px_0px_0px_#3E2723]">
                      <div className="w-full">
                        <span className="text-[7px] sm:text-[8px] bg-red-900 text-white px-2 py-1 rounded font-black uppercase mb-2 inline-block">Student Wish</span>
                        <h3 className="font-display font-black text-xl sm:text-2xl text-timber-800 uppercase mb-1 leading-tight">{item.title}</h3>
                        <p className="text-timber-400 font-bold text-[10px] sm:text-xs line-clamp-2">Req by: {item.student_name} • {item.description}</p>
                      </div>
                      <button onClick={() => { 
                          setUploadTitle(`RE: ${item.title}`); 
                          setSelectedRequestId(item._id || item.id); 
                          setIsModalOpen(true); 
                      }} className="w-full sm:w-auto px-6 py-3 bg-timber-800 text-gold-leaf font-black text-[9px] sm:text-[10px] uppercase rounded-xl hover:scale-105 transition-all text-center">Fulfill Request</button>
                    </div>
                  );
                }

                // --- 2. RENDER STANDARD RESOURCE CARDS ---
                return (
                    <div key={item._id || item.id || item.request_id} className="bg-white border-2 sm:border-4 border-timber-800 p-5 sm:p-8 rounded-[25px] sm:rounded-[40px] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 xl:gap-0 shadow-[8px_8px_0px_0px_#3E2723] sm:shadow-[15px_15px_0px_0px_#3E2723] group transition-all">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center w-full">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-timber-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2 border-timber-800 group-hover:bg-gold-leaf transition-colors flex-shrink-0">
                            {item.category === 'Past Question' ? '📜' : '📄'}
                            </div>
                            <div className="flex-1 w-full">
                                <h3 className="font-display font-black text-xl sm:text-2xl text-timber-800 uppercase leading-tight mb-1 sm:mb-2">{item.title}</h3>
                                <p className="text-timber-400 font-black text-[8px] sm:text-[10px] uppercase tracking-widest break-words">
                                    {item.category} • {item.uploader_name || item.student_name || 'System'}
                                    {!isMyDepartment && activeTab === 'World Library' && <span className="inline-block text-red-900 ml-2 mt-1 sm:mt-0 border border-red-900 px-1 rounded text-[7px] sm:text-[8px]">EXTERNAL</span>}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto mt-2 xl:mt-0 pt-4 xl:pt-0 border-t-2 border-timber-100 xl:border-0 justify-start sm:justify-end">
                            <button onClick={() => handleViewFile(item.file_url)} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-timber-100 text-timber-800 border-2 border-timber-800 font-black text-[9px] uppercase rounded-lg text-center">Preview</button>
                            
                            {activeTab === 'Review Queue' && (
                                <>
                                    <button onClick={() => handleAction(item._id || item.id, 'reject')} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-red-100 text-red-900 border-2 border-red-900 font-black text-[9px] uppercase rounded-lg text-center">Reject</button>
                                    <button onClick={() => handleAction(item._id || item.id, 'approve')} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-timber-800 text-gold-leaf font-black text-[9px] uppercase rounded-lg text-center">Approve</button>
                                </>
                            )}
                            
                            {activeTab === 'Deletion Inbox' && (
                                <>
                                    <button onClick={() => handleAction(item.request_id, 'reject')} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-timber-100 text-timber-800 border-2 border-timber-800 font-black text-[9px] uppercase rounded-lg text-center">Keep</button>
                                    <button onClick={() => handleAction(item.resource_id, 'permanent')} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-red-900 text-white font-black text-[9px] uppercase rounded-lg hover:bg-black text-center">Purge</button>
                                </>
                            )}

                            {(activeTab === 'Department Vault' || (activeTab === 'World Library' && isMyDepartment)) && (
                                <button onClick={() => handleAction(item._id || item.id, 'permanent')} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-red-900 text-white font-black text-[9px] uppercase rounded-lg hover:bg-black transition-all text-center">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                );
              }) : <EmptyState text={`The ${activeTab} is currently clear.`} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-timber-900/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#F5F5DC] p-6 sm:p-10 rounded-[30px] sm:rounded-[50px] border-4 sm:border-8 border-timber-800 w-full max-w-lg shadow-[15px_15px_0px_0px_#1a0f0d] sm:shadow-[30px_30px_0px_0px_#1a0f0d] my-auto">
                <h2 className="text-3xl sm:text-4xl font-display font-black text-timber-800 mb-2 uppercase tracking-tighter">Vault Entry.</h2>
                {selectedRequestId && (
                    <p className="mb-4 sm:mb-6 text-[9px] sm:text-[10px] font-black text-red-900 uppercase bg-red-100 p-2 rounded-lg border border-red-900/20">Fulfilling Hub Request #{selectedRequestId}</p>
                )}
                <form onSubmit={handleUpload} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-timber-400 uppercase mb-2 block">Resource Title</label>
                    <input type="text" required value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full bg-white border-2 sm:border-4 border-timber-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-black text-timber-800 text-xs sm:text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-timber-400 uppercase mb-2 block">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-2 sm:border-4 border-timber-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-black text-timber-800 text-xs sm:text-sm appearance-none focus:outline-none">
                      <option>Handout</option>
                      <option>Past Question</option>
                      <option>Syllabus</option>
                      <option>Assignment</option>
                    </select>
                  </div>
                  <div className="border-2 sm:border-4 border-dashed border-timber-200 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center">
                    <input type="file" required id="fileInput" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <label htmlFor="fileInput" className="cursor-pointer block">
                      <p className="text-3xl mb-2">📂</p>
                      <p className="font-black text-[9px] sm:text-[10px] text-timber-400 uppercase tracking-widest truncate px-2">{file ? file.name : "Select Document"}</p>
                    </label>
                  </div>
                  <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <button type="button" onClick={() => { setIsModalOpen(false); setSelectedRequestId(null); }} className="flex-1 py-3 sm:py-4 font-black text-timber-400 text-[9px] sm:text-[10px] uppercase border-2 border-transparent hover:border-timber-300 rounded-xl transition-all">Cancel</button>
                    <button type="submit" disabled={isUploading} className="flex-1 py-3 sm:py-4 bg-timber-800 text-gold-leaf rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase disabled:opacity-50 shadow-md">
                        {isUploading ? "Uploading..." : "Verify & Deploy"}
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

const LoadingScreen = () => (
    <div className="min-h-screen bg-[#3E2723] flex flex-col items-center justify-center p-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gold-leaf border-t-transparent rounded-full" />
        <p className="mt-4 sm:mt-6 font-display font-black text-gold-leaf uppercase text-[10px] sm:text-xs tracking-widest text-center">Syncing Command Center...</p>
    </div>
);

const EmptyState = ({ text }) => (
    <div className="py-16 sm:py-24 px-4 text-center border-4 border-dashed border-timber-200 rounded-[30px] sm:rounded-[50px]">
        <p className="font-display font-black text-timber-300 uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[10px] sm:text-xs leading-relaxed">{text}</p>
    </div>
);

export default LecturerDashboard;
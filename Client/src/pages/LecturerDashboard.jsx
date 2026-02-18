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
  
  const [uploadTitle, setUploadTitle] = useState('');
  const [category, setCategory] = useState('Handout');
  const [file, setFile] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const token = localStorage.getItem('rootle_token');
  const BACKEND_URL = "http://localhost:5000";

  const fetchDashboardData = async () => {
    if (!user || !user.id) return;
    
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
          // If rejecting deletion, we target the Request ID. If Purging, we target the Resource ID.
          // The 'id' passed to this function will be different based on the button clicked.
          if (action === 'permanent') {
            endpoint = `${BACKEND_URL}/api/resources/admin/permanent/${id}`;
            method = 'DELETE';
          } else {
             // action is 'reject'
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
    <div className="flex min-h-screen bg-[#3E2723] overflow-hidden" style={{ backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay' }}>
      
      {/* Sidebar */}
      <aside className="w-72 bg-timber-900 text-timber-100 p-8 fixed h-full border-r-4 border-red-900/30 shadow-2xl flex flex-col z-20">
        <div className="mb-12">
            <div className="text-4xl font-display font-black text-gold-leaf tracking-tighter">Rootle.</div>
            <div className="text-[10px] font-black text-red-500 tracking-[0.4em] uppercase">Staff Command</div>
        </div>

        <nav className="space-y-4 flex-1">
          {['Review Queue', 'Department Vault', 'World Library', 'Community Wishlist', 'Deletion Inbox'].map((item) => (
            <motion.div key={item} whileHover={{ x: 10 }} onClick={() => setActiveTab(item)}
              className={`cursor-pointer font-display uppercase text-[10px] font-black tracking-widest p-4 rounded-xl flex items-center gap-4 transition-all ${
                activeTab === item ? 'bg-red-900/40 text-gold-leaf border-l-4 border-gold-leaf' : 'text-timber-400 hover:text-timber-100'
              }`}>
              {item}
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto border-t border-red-900/50 pt-6">
            <div className="bg-black/20 p-4 rounded-2xl mb-4 border border-red-900/30">
              <p className="text-[8px] text-gold-leaf/50 font-black uppercase tracking-[0.2em] mb-2">Authenticated Staff</p>
              <h4 className="text-sm font-black text-white uppercase leading-tight">{user?.fullName || 'Lecturer Name'}</h4>
              <p className="text-[9px] text-red-400 font-bold uppercase mt-1">{user?.departmentName}</p>
            </div>
            <button onClick={logout} className="w-full py-3 bg-red-950/50 border border-red-900 text-[9px] font-black uppercase text-red-400 rounded-lg">Terminate Session</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12 bg-[#F5F5DC] rounded-l-[60px] my-4 shadow-[-30px_0_60px_rgba(0,0,0,0.5)] min-h-[95vh] overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <p className="text-red-900 font-black text-[10px] uppercase tracking-[0.4em] mb-2">{activeTab}</p>
            <h1 className="text-7xl font-display font-black text-timber-800 tracking-tighter leading-none">
              {activeTab === 'Review Queue' ? 'The Gate.' : 
               activeTab === 'Department Vault' ? 'The Vault.' : 
               activeTab === 'Community Wishlist' ? 'The Hub.' : 'Registry.'}
            </h1>
          </div>
          
          <button onClick={() => { setSelectedRequestId(null); setUploadTitle(''); setIsModalOpen(true); }} className="bg-timber-800 text-gold-leaf px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">
            + New Upload
          </button>
        </header>

        <div className="grid gap-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {dataList.length > 0 ? dataList.map((item) => {
                const isMyDepartment = (item.department_id === user?.departmentId || item.departmentId === user?.departmentId);

                // --- 1. RENDER WISHLIST CARDS ---
                if (activeTab === 'Community Wishlist') {
                  return (
                    <div key={item.id} className="bg-white border-4 border-timber-800 p-8 rounded-[40px] flex justify-between items-center shadow-[15px_15px_0px_0px_#3E2723]">
                      <div>
                        <span className="text-[8px] bg-red-900 text-white px-2 py-1 rounded font-black uppercase mb-2 inline-block">Student Wish</span>
                        <h3 className="font-display font-black text-2xl text-timber-800 uppercase mb-1">{item.title}</h3>
                        <p className="text-timber-400 font-bold text-xs">Req by: {item.student_name} • {item.description}</p>
                      </div>
                      <button onClick={() => { 
                          setUploadTitle(`RE: ${item.title}`); 
                          setSelectedRequestId(item.id); 
                          setIsModalOpen(true); 
                      }} className="px-6 py-3 bg-timber-800 text-gold-leaf font-black text-[10px] uppercase rounded-xl hover:scale-105 transition-all">Fulfill Request</button>
                    </div>
                  );
                }

                // --- 2. RENDER STANDARD RESOURCE CARDS ---
                return (
                    <div key={item.id || item.request_id} className="bg-white border-4 border-timber-800 p-8 rounded-[40px] flex justify-between items-center shadow-[15px_15px_0px_0px_#3E2723] group transition-all">
                        <div className="flex gap-6 items-center">
                            <div className="w-16 h-16 bg-timber-100 rounded-2xl flex items-center justify-center text-3xl border-2 border-timber-800 group-hover:bg-gold-leaf transition-colors">
                            {item.category === 'Past Question' ? '📜' : '📄'}
                            </div>
                            <div>
                                <h3 className="font-display font-black text-2xl text-timber-800 uppercase leading-none mb-1">{item.title}</h3>
                                <p className="text-timber-400 font-black text-[10px] uppercase tracking-widest">
                                    {item.category} • {item.uploader_name || item.student_name || 'System'}
                                    {!isMyDepartment && activeTab === 'World Library' && <span className="text-red-900 ml-2 border border-red-900 px-1 rounded text-[8px]">EXTERNAL</span>}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={() => handleViewFile(item.file_url)} className="px-6 py-2 bg-timber-100 text-timber-800 border-2 border-timber-800 font-black text-[9px] uppercase rounded-lg">Preview</button>
                            
                            {activeTab === 'Review Queue' && (
                                <>
                                    <button onClick={() => handleAction(item.id, 'reject')} className="px-6 py-2 bg-red-100 text-red-900 border-2 border-red-900 font-black text-[9px] uppercase rounded-lg">Reject</button>
                                    <button onClick={() => handleAction(item.id, 'approve')} className="px-6 py-2 bg-timber-800 text-gold-leaf font-black text-[9px] uppercase rounded-lg">Approve</button>
                                </>
                            )}
                            
                            {activeTab === 'Deletion Inbox' && (
                                <>
                                    {/* Pass request_id to reject (Keep File), pass resource_id to purge */}
                                    <button onClick={() => handleAction(item.request_id, 'reject')} className="px-6 py-2 bg-timber-100 text-timber-800 border-2 border-timber-800 font-black text-[9px] uppercase rounded-lg">Keep File</button>
                                    <button onClick={() => handleAction(item.resource_id, 'permanent')} className="px-6 py-2 bg-red-900 text-white font-black text-[9px] uppercase rounded-lg hover:bg-black">Confirm Purge</button>
                                </>
                            )}

                            {(activeTab === 'Department Vault' || (activeTab === 'World Library' && isMyDepartment)) && (
                                <button onClick={() => handleAction(item.id, 'permanent')} className="px-6 py-2 bg-red-900 text-white font-black text-[9px] uppercase rounded-lg hover:bg-black transition-all">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-timber-900/80 backdrop-blur-md p-6">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#F5F5DC] p-10 rounded-[50px] border-8 border-timber-800 w-full max-w-lg shadow-[30px_30px_0px_0px_#1a0f0d]">
                <h2 className="text-4xl font-display font-black text-timber-800 mb-2 uppercase tracking-tighter">Vault Entry.</h2>
                {selectedRequestId && (
                    <p className="mb-6 text-[10px] font-black text-red-900 uppercase bg-red-100 p-2 rounded-lg border border-red-900/20">Fulfilling Hub Request #{selectedRequestId}</p>
                )}
                <form onSubmit={handleUpload} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-timber-400 uppercase mb-2 block">Resource Title</label>
                    <input type="text" required value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full bg-white border-4 border-timber-800 p-4 rounded-2xl font-black text-timber-800 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-timber-400 uppercase mb-2 block">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-4 border-timber-800 p-4 rounded-2xl font-black text-timber-800 text-sm appearance-none focus:outline-none">
                      <option>Handout</option>
                      <option>Past Question</option>
                      <option>Syllabus</option>
                      <option>Assignment</option>
                    </select>
                  </div>
                  <div className="border-4 border-dashed border-timber-200 p-8 rounded-3xl text-center">
                    <input type="file" required id="fileInput" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <label htmlFor="fileInput" className="cursor-pointer">
                      <p className="text-3xl mb-2">📂</p>
                      <p className="font-black text-[10px] text-timber-400 uppercase tracking-widest">{file ? file.name : "Select Document"}</p>
                    </label>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => { setIsModalOpen(false); setSelectedRequestId(null); }} className="flex-1 py-4 font-black text-timber-400 text-[10px] uppercase">Cancel</button>
                    <button type="submit" disabled={isUploading} className="flex-1 py-4 bg-timber-800 text-gold-leaf rounded-2xl font-black text-[10px] uppercase disabled:opacity-50">
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
    <div className="min-h-screen bg-[#3E2723] flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-16 h-16 border-4 border-gold-leaf border-t-transparent rounded-full" />
        <p className="mt-6 font-display font-black text-gold-leaf uppercase text-xs">Syncing Command Center...</p>
    </div>
);

const EmptyState = ({ text }) => (
    <div className="py-24 text-center border-4 border-dashed border-timber-200 rounded-[50px]">
        <p className="font-display font-black text-timber-300 uppercase tracking-[0.5em] text-xs">{text}</p>
    </div>
);

export default LecturerDashboard;
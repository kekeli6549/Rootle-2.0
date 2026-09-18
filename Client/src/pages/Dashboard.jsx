import React, { useState, useEffect } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import API from '../api';
import UploadModal from '../components/UploadModal';
import Toast from '../components/Toast';
import DownloadAction from '../components/DownloadAction';
import FileViewerModal from '../components/FileViewerModal';
import RatingSystem from '../components/RatingSystem';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('My Library');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [selectedFile, setSelectedFile] = useState(null);

  const userId = user?._id || user?.id;

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const displayDept = user?.departmentName || user?.department || "Awaiting Sync...";
  const displayID = user?.studentId || user?.staffId || user?.idNumber || "ROOT-2026";

  const getFileIcon = (fileUrl) => {
    const extension = fileUrl?.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf': return { icon: '📕', label: 'PDF', color: 'text-red-600' };
      case 'doc':
      case 'docx': return { icon: '📘', label: 'DOCX', color: 'text-blue-600' };
      case 'zip':
      case 'rar': return { icon: '📦', label: 'ZIP', color: 'text-orange-600' };
      case 'pptx': return { icon: '📙', label: 'PPTX', color: 'text-orange-500' };
      default: return { icon: '📄', label: 'FILE', color: 'text-timber-400' };
    }
  };

  const fetchData = async () => {
    if (!user || !userId) return;
    setLoading(true);
    try {
      let endpoint = '/resources';
      const params = {};

      if (viewMode === 'My Requests') {
        endpoint = '/resources/requests';
      } else {
        if (searchQuery) params.search = searchQuery;
        if (activeCategory !== 'All') params.category = activeCategory;
        
        if (viewMode === 'My Library') {
          params.mine = 'true';
          params.status = 'all';
        } 
        else if (viewMode === 'Department Feed') {
          const deptId = user?.departmentId || user?.department_id;
          if (deptId && deptId !== 'undefined') {
            params.departmentId = deptId;
            params.status = 'approved';
          }
        } 
        else if (viewMode === 'Trending Research') {
          params.trending = 'true';
          params.status = 'approved';
        }
        else if (viewMode === 'World View') {
           params.status = 'approved';
        }
      }

      const response = await API.get(endpoint, { params });
      const data = response.data;
      
      if (viewMode === 'My Requests') {
          const myRequests = Array.isArray(data) ? data.filter(req => (req.requester_id || req.requester || req.requesterId) === userId) : [];
          setItems(myRequests);
      } else {
          setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [isModalOpen, searchQuery, activeCategory, viewMode, user]);

  const handleDownload = async (resId, fileUrl) => {
    if (!fileUrl) return showToast("File path missing", "error");
    
    try {
        await API.post(`/resources/download/${resId}`);
    } catch (err) { console.error("Stat update failed"); }

    try {
      const cleanPath = fileUrl.replace(/\\/g, '/');
      const response = await fetch(`http://localhost:5000/${cleanPath}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = cleanPath.split('/').pop();
      link.setAttribute('download', filename); 
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("ROOTLE SECURED", "success");
      fetchData(); 
    } catch (error) {
      showToast("DOWNLOAD FAILED", "error");
    }
  };

  const handleRate = async (resourceId, rating) => {
    try {
      const response = await API.post('/resources/rate', { resourceId, rating });
      if (response.status === 200 || response.status === 201) {
        showToast("RATING LOGGED", "success");
        fetchData(); 
      }
    } catch (err) {
      showToast("RATING FAILED", "error");
    }
  };

  const handleDeleteResource = async (e, resId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to pull this from the vault?")) return;
    try {
        const response = await API.delete(`/resources/${resId}`);
        if (response.status === 200 || response.status === 201) {
            setItems(prev => prev.filter(item => (item._id || item.id) !== resId));
            showToast("REMOVAL REQUEST SENT", "success"); 
        }
    } catch (err) {
        showToast("NETWORK ERROR", "error");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5DC] relative overflow-hidden">
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ 
          backgroundImage: `url('https://www.transparenttextures.com/patterns/graphy.png'), url('https://img.freepik.com/free-vector/hand-drawn-abstract-leaves-pattern_23-2148997368.jpg')`,
          backgroundSize: '200px, cover',
          backgroundRepeat: 'repeat, no-repeat'
        }}
      />

      <aside className="w-72 bg-timber-800 text-timber-100 flex flex-col p-8 fixed h-full border-r-4 border-timber-500 shadow-2xl z-50">
        <div className="text-3xl font-display font-black tracking-tighter mb-12 text-gold-leaf">Rootle.</div>
        <nav className="space-y-6 flex-1">
          {['My Library', 'Department Feed', 'Trending Research', 'World View', 'My Requests'].map((item) => (
            <motion.div 
              key={item}
              whileHover={{ x: 10, color: "#bf953f" }}
              onClick={() => setViewMode(item)}
              className={`cursor-pointer font-display uppercase text-[11px] font-black tracking-[0.15em] flex items-center gap-4 transition-colors ${
                viewMode === item ? 'text-gold-leaf' : 'text-timber-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${viewMode === item ? 'bg-gold-leaf' : 'bg-timber-500'}`}></div>
              {item}
            </motion.div>
          ))}
          <motion.div 
            whileHover={{ x: 10, color: "#bf953f" }}
            onClick={() => navigate('/requests')}
            className="cursor-pointer font-display uppercase text-[11px] font-black tracking-[0.15em] flex items-center gap-4 transition-colors text-gold-leaf mt-8 pt-4 border-t border-timber-600/30"
          >
            <span className="text-lg">🤝</span> Request Hub
          </motion.div>
          <motion.div 
            whileHover={{ x: 10, color: "#bf953f" }}
            onClick={() => navigate('/leaderboard')}
            className="cursor-pointer font-display uppercase text-[11px] font-black tracking-[0.15em] flex items-center gap-4 transition-colors text-gold-leaf"
          >
            <span className="text-lg">🏆</span> Leader Hub
          </motion.div>
          <button onClick={() => { logout(); navigate('/login'); }} className="mt-4 text-[10px] font-black uppercase text-red-400 hover:text-red-200 transition-colors text-left block">
            Exit System
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-timber-600">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-timber-100 border-2 border-gold-leaf overflow-hidden flex items-center justify-center text-timber-800 font-black text-xl shadow-inner">
                  {user?.fullName?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-timber-100 leading-none">{user?.fullName || "Scholar"}</p>
                  <p className="text-[9px] text-timber-400 uppercase mt-1 tracking-widest font-bold">ID: {displayID}</p>
                </div>
             </div>
             <div className="bg-[#bf953f] border-2 border-gold-leaf p-3 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-timber-900/70 mb-1">Active Faculty</p>
                <p className="text-[12px] font-display font-black uppercase text-timber-900 leading-tight">{displayDept}</p>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-12 z-10 relative">
        <header className="flex justify-between items-end mb-8">
          <div className="flex-1 max-w-2xl">
            <p className="text-timber-500 font-display font-black uppercase text-[10px] tracking-[0.3em]">
              {viewMode} • {new Date().toLocaleDateString()}
            </p>
            <h1 className="text-6xl font-display font-black text-timber-800 tracking-tighter mb-4">
                {viewMode === 'My Requests' ? 'Your Wishes.' : 'Library.'}
            </h1>
            {viewMode !== 'My Requests' && (
                <div className="relative max-w-md">
                <input 
                    type="text"
                    placeholder="SEARCH FOR RESOURCES..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-4 border-timber-800 px-6 py-3 rounded-xl font-display text-[11px] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-gold-leaf/20 shadow-lg"
                />
                </div>
            )}
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)} 
            className="bg-timber-800 text-gold-leaf px-8 py-4 rounded-2xl font-display font-black text-sm uppercase tracking-widest border-4 border-gold-leaf shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all" 
          >
            + Rootle New File
          </motion.button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.length > 0 ? (
              items.map((item) => {
                const itemId = item._id || item.id;
                if (viewMode === 'My Requests') {
                    const isFulfilled = item.is_fulfilled ?? item.isFulfilled;
                    const createdAt = item.created_at || item.createdAt;
                    return (
                        <div key={itemId} className="bg-white border-4 border-timber-800 p-6 rounded-[30px] shadow-[10px_10px_0px_0px_rgba(191,149,63,1)]">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-2xl">🤝</span>
                                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${isFulfilled ? 'bg-green-100 text-green-800 border border-green-800' : 'bg-timber-800 text-gold-leaf'}`}>
                                    {isFulfilled ? "FULFILLED" : "PENDING"}
                                </span>
                            </div>
                            <h3 className="font-display font-black text-timber-800 text-xl tracking-tight leading-tight">{item.title}</h3>
                            <p className="text-timber-500 text-[11px] mt-2 italic">"{item.description}"</p>
                            <p className="text-timber-400 text-[9px] font-bold uppercase mt-4 tracking-tighter">Posted: {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    );
                }

                const fileUrl = item.file_url || item.fileUrl;
                const fileInfo = getFileIcon(fileUrl);
                const uploaderId = item.uploader_id || item.uploader || item.uploaderId;
                const isOwner = uploaderId === userId;
                const isPending = item.status === 'pending';
                const downloadCount = item.download_count ?? item.downloadCount ?? 0;
                const avgRating = item.average_rating ?? item.averageRating ?? 0;
                const createdAt = item.created_at || item.createdAt;
                const uploaderName = item.uploader_name || item.uploaderName || 'Scholar';

                return (
                  <motion.div 
                    key={itemId}
                    whileHover={{ y: -10, rotate: -1 }}
                    onClick={() => !isPending && setSelectedFile(item)}
                    className={`bg-white border-4 border-timber-800 p-6 rounded-[30px] shadow-[12px_12px_0px_0px_rgba(62,39,35,1)] group relative transition-all ${isPending ? 'opacity-70 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(62,39,35,1)]'}`}
                  >
                    {!isPending && (
                      <DownloadAction 
                        count={downloadCount}
                        onClick={() => handleDownload(itemId, fileUrl)} 
                      />
                    )}

                    {isOwner && (
                      <button 
                        onClick={(e) => handleDeleteResource(e, itemId)}
                        className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 text-white rounded-full border-4 border-timber-800 flex items-center justify-center font-black opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg"
                      >
                        ×
                      </button>
                    )}

                    {isPending && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-full border border-white uppercase animate-pulse">Awaiting Review</span>
                        </div>
                    )}

                    <div className="bg-timber-100 h-44 rounded-2xl mb-4 flex flex-col items-center justify-center border-4 border-dashed border-timber-300 group-hover:border-gold-leaf transition-colors overflow-hidden">
                        <span className="text-5xl mb-2 group-hover:scale-125 transition-transform">{fileInfo.icon}</span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${fileInfo.color}`}>{fileInfo.label}</span>
                    </div>

                    <h3 className="font-display font-black text-timber-800 text-xl tracking-tight leading-tight pr-12 group-hover:text-gold-leaf transition-colors">{item.title}</h3>
                    
                    {!isPending && (
                      <RatingSystem 
                        currentRating={avgRating} 
                        onRate={(val) => handleRate(itemId, val)} 
                      />
                    )}

                    <p className="text-timber-500 text-[10px] font-black uppercase mt-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-leaf"></span>
                      {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'} • {uploaderName}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-32 text-center border-8 border-dotted border-timber-300 rounded-[60px] bg-white/50 backdrop-blur-sm">
                <span className="text-6xl mb-6 block opacity-20">📂</span>
                <p className="font-display font-black text-timber-400 uppercase text-xl tracking-widest">
                  {loading ? "SEARCHING THE ARCHIVES..." : "THE VAULT IS EMPTY."}
                </p>
              </div>
            )}
        </div>
      </main>

      <Toast isVisible={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      <AnimatePresence>
        {isModalOpen && (
          <UploadModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onUploadSuccess={() => { showToast("UPLOAD SYNCED TO THE GATE", "success"); fetchData(); }} 
          />
        )}
        {selectedFile && (
          <FileViewerModal 
            isOpen={!!selectedFile} 
            onClose={() => setSelectedFile(null)} 
            fileUrl={selectedFile.file_url || selectedFile.fileUrl} 
            title={selectedFile.title} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
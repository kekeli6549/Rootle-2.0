import React, { useState, useEffect } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import scribbleBg from '../assets/scribble-bg.png';
import UploadModal from '../components/UploadModal';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('My Library');
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();

  // --- DATA SYNC LAYER ---
  const displayDept = user?.department || user?.departmentName || user?.dept || "Awaiting Sync...";
  const displayID = user?.idNumber || user?.staffId || user?.studentId || "ROOT-2026";

  // --- NEW: DYNAMIC ICON LOGIC ---
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

  const categories = ['All', 'Notes', 'Past Questions', 'Research', 'Textbooks'];

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const token = localStorage.getItem('rootle_token');
        const url = new URL('http://localhost:5000/api/resources');
        
        if (searchQuery) url.searchParams.append('search', searchQuery);
        if (activeCategory !== 'All') url.searchParams.append('category', activeCategory);
        
        if (viewMode === 'My Library') {
          url.searchParams.append('mine', 'true');
        } else if (viewMode === 'Department Feed' && (user?.department || user?.departmentName)) {
          url.searchParams.append('department', user?.department || user?.departmentName);
        } else if (viewMode === 'Trending Research') {
          url.searchParams.append('trending', 'true');
        } 

        const response = await fetch(url, {
          headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        if (response.ok) setResources(data);
      } catch (err) {
        console.error("Failed to fetch library feed:", err);
      }
    };

    const debounceTimer = setTimeout(fetchResources, 300);
    return () => clearTimeout(debounceTimer);
  }, [isModalOpen, searchQuery, activeCategory, viewMode, user]);

  const handleDownload = async (resId, fileUrl) => {
    try {
        const token = localStorage.getItem('rootle_token');
        await fetch(`http://localhost:5000/api/resources/download/${resId}`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        });
    } catch (err) { console.error("Stat update failed"); }

    const baseUrl = "http://localhost:5000/";
    const cleanPath = fileUrl.replace(/\\/g, '/');
    window.open(`${baseUrl}${cleanPath}`, '_blank');
  };

  const handleDeleteRequest = async (e, resId) => {
    e.stopPropagation();
    if (!window.confirm("Remove this from your library?")) return;

    try {
        const token = localStorage.getItem('rootle_token');
        const response = await fetch(`http://localhost:5000/api/resources/${resId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (response.ok) {
            setResources(prev => prev.filter(res => res.id !== resId));
        }
    } catch (err) {
        console.error("Delete request failed");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5DC]">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-timber-800 text-timber-100 flex flex-col p-8 fixed h-full border-r-4 border-timber-500 shadow-2xl z-20">
        <div className="text-3xl font-display font-black tracking-tighter mb-12 text-gold-leaf">Rootle.</div>
        
        <nav className="space-y-6 flex-1">
          {['My Library', 'Department Feed', 'Trending Research', 'World View'].map((item) => (
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
          <button onClick={handleLogout} className="mt-4 text-[10px] font-black uppercase text-red-400 hover:text-red-200 transition-colors text-left">
            Exit System
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-timber-600">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-timber-100 border-2 border-gold-leaf overflow-hidden flex items-center justify-center text-timber-800 font-black text-xl shadow-inner">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-timber-100 leading-none">
                    {user?.fullName || user?.username || "Scholar"}
                  </p>
                  <p className="text-[9px] text-timber-400 uppercase mt-1 tracking-widest font-bold">
                    ID: {displayID}
                  </p>
                </div>
             </div>
             
             <div className="bg-[#bf953f] border-2 border-gold-leaf p-3 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]">
               <p className="text-[8px] font-black uppercase tracking-[0.2em] text-timber-900/70 mb-1">Active Faculty</p>
               <p className="text-[12px] font-display font-black uppercase text-timber-900 leading-tight">
                 {displayDept}
               </p>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-12">
        <header className="flex justify-between items-end mb-8">
          <div className="flex-1 max-w-2xl">
            <p className="text-timber-500 font-display font-black uppercase text-[10px] tracking-[0.3em]">
              {viewMode} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="text-6xl font-display font-black text-timber-800 tracking-tighter mb-4">
               {viewMode === 'Trending Research' ? 'The Heat.' : 
                viewMode === 'Department Feed' ? 'Dept. Vault.' : 
                viewMode === 'World View' ? 'Global.' : 'Your Library.'}
            </h1>
            
            <div className="relative max-w-md">
              <input 
                type="text"
                placeholder="SEARCH FOR RESOURCES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-timber-800 px-4 py-2 rounded-lg font-display text-[10px] font-black tracking-widest placeholder:text-timber-300 focus:outline-none focus:ring-2 focus:ring-gold-leaf"
              />
            </div>
          </div>

          <motion.button 
            onClick={() => setIsModalOpen(true)} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-timber-800 text-gold-leaf px-8 py-4 rounded-xl font-display font-black text-sm uppercase tracking-widest shadow-xl border-2 border-gold-leaf transition-all" 
          >
            + Rootle New File
          </motion.button>
        </header>

        <div className="flex gap-4 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-display text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${
                activeCategory === cat ? 'bg-timber-800 text-gold-leaf border-timber-800' : 'bg-transparent text-timber-400 border-timber-200 hover:border-timber-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.length > 0 ? (
              resources.map((res) => {
                const fileInfo = getFileIcon(res.file_url);
                return (
                  <motion.div 
                    key={res.id}
                    whileHover={{ y: -10 }}
                    onClick={() => handleDownload(res.id, res.file_url)} 
                    className="bg-white border-4 border-timber-800 p-6 rounded-[30px] shadow-[10px_10px_0px_0px_rgba(62,39,35,1)] cursor-pointer group relative"
                  >
                    {viewMode === 'My Library' && (
                      <button 
                        onClick={(e) => handleDeleteRequest(e, res.id)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full border-2 border-timber-800 flex items-center justify-center font-black opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                      >
                        ×
                      </button>
                    )}

                    <div className="bg-timber-100 h-40 rounded-2xl mb-4 flex flex-col items-center justify-center border-2 border-dashed border-timber-300 group-hover:border-timber-800 transition-colors relative">
                        {viewMode === 'World View' && (
                          <div className="absolute bottom-2 right-2 bg-timber-800 text-gold-leaf text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
                            {res.department}
                          </div>
                        )}

                        <span className="text-4xl mb-2">{fileInfo.icon}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${fileInfo.color}`}>{fileInfo.label}</span>
                    </div>
                    <h3 className="font-display font-black text-timber-800 text-xl tracking-tight leading-tight">{res.title}</h3>
                    <p className="text-timber-500 text-[10px] font-bold uppercase mt-2">
                      {new Date(res.created_at).toLocaleDateString()} • {res.uploader_name}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center border-4 border-dashed border-timber-300 rounded-[40px]">
                <p className="font-display font-black text-timber-400 uppercase tracking-widest">No matching resources found.</p>
              </div>
            )}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
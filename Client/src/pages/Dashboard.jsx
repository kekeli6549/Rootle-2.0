import React, { useState } from 'react'; // FIXED: Added useState
import { motion, AnimatePresence } from 'framer-motion'; // FIXED: Added AnimatePresence
import scribbleBg from '../assets/scribble-bg.png';
import UploadModal from '../components/UploadModal';

const Dashboard = () => {
  // State to handle the visibility of our Upload Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5F5DC]">
      
      {/* SIDEBAR - Fixed position so it doesn't scroll away */}
      <aside className="w-72 bg-timber-800 text-timber-100 flex flex-col p-8 fixed h-full border-r-4 border-timber-500 shadow-2xl z-20">
        <div className="text-3xl font-display font-black tracking-tighter mb-12 text-gold-leaf">
          Rootle.
        </div>
        
        <nav className="space-y-6 flex-1">
          {['My Library', 'Department Feed', 'Trending Research', 'Uploads'].map((item) => (
            <motion.div 
              key={item}
              whileHover={{ x: 10, color: "#bf953f" }}
              className="cursor-pointer font-display uppercase text-xs font-black tracking-widest flex items-center gap-4"
            >
              <div className="w-2 h-2 bg-timber-500 rounded-full"></div>
              {item}
            </motion.div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="mt-auto pt-8 border-t border-timber-600">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-timber-100 border-2 border-gold-leaf overflow-hidden">
               {/* User Avatar Placeholder */}
             </div>
             <div>
               <p className="text-[10px] font-black uppercase text-timber-100">Lord Snow</p>
               <p className="text-[8px] text-timber-400">STUDENT ID: 2026/001</p>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - ml-72 accounts for the fixed sidebar width */}
      <main className="flex-1 ml-72 p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="text-timber-500 font-display font-black uppercase text-[10px] tracking-[0.3em]">January 28, 2026</p>
            <h1 className="text-6xl font-display font-black text-timber-800 tracking-tighter">Your Library.</h1>
          </div>

          {/* OPEN MODAL BUTTON */}
          <motion.button 
            onClick={() => setIsModalOpen(true)} // FIXED: Added click handler
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-timber-800 text-gold-leaf px-8 py-4 rounded-xl font-display font-black text-sm uppercase tracking-widest shadow-xl border-2 border-gold-leaf transition-all" 
          >
            + Rootle New File
          </motion.button>
        </header>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {/* Example Card */}
           <motion.div 
             whileHover={{ y: -10 }}
             className="bg-white border-4 border-timber-800 p-6 rounded-[30px] shadow-[10px_10px_0px_0px_rgba(62,39,35,1)] cursor-pointer group"
           >
             <div className="bg-timber-100 h-40 rounded-2xl mb-4 flex items-center justify-center border-2 border-dashed border-timber-300 group-hover:border-timber-800 transition-colors">
                <span className="text-timber-800 font-display font-black opacity-40 group-hover:opacity-100 transition-opacity">PDF PREVIEW</span>
             </div>
             <h3 className="font-display font-black text-timber-800 text-xl tracking-tight">Advanced Economics 301</h3>
             <p className="text-timber-500 text-[10px] font-bold uppercase mt-2">Added 2h ago • Chidi Obi</p>
           </motion.div>
        </div>
      </main>

      {/* THE MODAL LOGIC - Placed outside the main flow to avoid stacking issues */}
      <AnimatePresence>
        {isModalOpen && (
          <UploadModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
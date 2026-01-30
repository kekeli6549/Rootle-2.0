import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; // NEW
import { useNavigate } from 'react-router-dom';
import scribbleBg from '../assets/scribble-bg.png';

const LecturerDashboard = () => {
  const { user, logout } = useAuth(); // NEW
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className="flex min-h-screen bg-[#3E2723]" style={{ backgroundImage: `url(${scribbleBg})`, backgroundBlendMode: 'overlay' }}>
      {/* SIDEBAR */}
      <aside className="w-72 bg-timber-900 text-timber-100 p-8 fixed h-full border-r-4 border-red-900 shadow-2xl flex flex-col">
        <div className="text-3xl font-display font-black text-gold-leaf mb-12">Rootle Staff.</div>
        <nav className="space-y-6 flex-1">
          {['Review Queue', 'Verified Notes', 'Department Analytics', 'Staff Meetings'].map((item) => (
            <motion.div key={item} whileHover={{ x: 10, color: "#fcf6ba" }} className="cursor-pointer font-display uppercase text-xs font-black tracking-widest flex items-center gap-4">
              <div className="w-2 h-2 bg-red-800 rounded-full"></div>
              {item}
            </motion.div>
          ))}
        </nav>
        
        {/* NEW: Staff Profile/Logout Info */}
        <div className="mt-auto border-t border-red-900/50 pt-6">
           <p className="text-[10px] font-black uppercase text-timber-100">{user?.fullName}</p>
           <p className="text-[8px] text-red-400 font-mono mb-4 uppercase">ID: {user?.staffId || "ADMIN-KEY"}</p>
           <button onClick={handleLogout} className="text-[9px] font-black uppercase text-gold-leaf hover:underline">Secure Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-72 p-12 bg-[#F5F5DC] rounded-l-[60px] my-4 shadow-[-20px_0_50px_rgba(0,0,0,0.3)]">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-display font-black text-timber-800 tracking-tighter">Verification Queue</h1>
            <p className="text-red-900 font-bold text-xs uppercase tracking-widest mt-2">{user?.department || "Unassigned Faculty"}</p>
          </div>
          <div className="bg-red-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
            3 Pending Reviews
          </div>
        </header>

        {/* REVIEW CARDS */}
        <div className="space-y-6">
           <div className="bg-white border-4 border-timber-800 p-8 rounded-[30px] flex justify-between items-center shadow-[10px_10px_0px_0px_rgba(127,29,29,1)]">
             <div>
               <h3 className="font-display font-black text-2xl text-timber-800 uppercase">Structural Analysis II - Past Question</h3>
               <p className="text-timber-500 font-medium italic text-sm">Waiting for your approval...</p>
             </div>
             <div className="flex gap-4">
               <button className="px-6 py-2 bg-red-100 text-red-900 border-2 border-red-900 font-black rounded-lg hover:bg-red-900 hover:text-white transition-all">Reject</button>
               <button className="px-6 py-2 bg-timber-800 text-gold-leaf border-2 border-timber-800 font-black rounded-lg shadow-md">Approve & Publish</button>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default LecturerDashboard;
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // 1. Import this
import scribbleBg from '../assets/scribble-bg.png';

const Landing = () => {
  return (
    <div 
      className="min-h-screen relative overflow-hidden font-body selection:bg-timber-500 selection:text-white"
      style={{ 
        backgroundColor: '#F5F5DC',
        backgroundImage: `url(${scribbleBg})`,
        backgroundSize: '500px',
        backgroundRepeat: 'repeat'
      }}
    >
      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex justify-between items-center px-12 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-timber-800 rounded-lg flex items-center justify-center text-timber-100 font-display font-bold">R</div>
          <span className="text-3xl font-display font-black text-timber-800 tracking-tighter glow-backlight">
            Rootle.
          </span>
        </div>

        <div className="flex gap-8 items-center">
          {/* NAVBAR: LOG IN -> GOES TO LOGIN */}
          <Link to="/login">
            <motion.button 
              whileHover={{ scale: 1.05, letterSpacing: "0.1em" }}
              className="text-timber-800 font-display uppercase text-xs font-black tracking-widest hover:text-timber-500 transition-all"
            >
              Log In
            </motion.button>
          </Link>
          
          {/* NAVBAR: GET STARTED -> GOES TO REGISTER */}
          <Link to="/register">
            <motion.button 
              whileHover={{ backgroundColor: "#3E2723", color: "#F5F5DC" }}
              className="bg-transparent border-2 border-timber-800 text-timber-800 px-8 py-2 rounded-full font-display uppercase text-xs font-black tracking-widest transition-colors duration-300"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 max-w-screen-2xl mx-auto px-12 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <div>
          <h1 className="text-[9rem] font-display font-black text-timber-800 leading-[0.8] mb-2">Share</h1>
          <h2 className="text-[9rem] font-display font-black leading-[0.8] mb-8 text-gold-leaf glow-backlight">Rootle</h2>

          <p className="text-xl text-timber-700 max-w-md mb-12 leading-relaxed font-medium">
            The decentralized <span className="italic font-bold text-timber-800">Library</span> for the modern academia. 
            Connect, share notes, and grow the roots of knowledge.
          </p>

          <div className="flex gap-6">
            {/* HERO: START ROOTLING -> GOES TO LOGIN */}
            <Link to="/login">
              <motion.button 
                whileHover={{ x: 5, y: 5, boxShadow: "none" }}
                className="bg-timber-100 text-timber-800 px-10 py-5 rounded-xl font-display font-black text-xl border-4 border-timber-800 shadow-[10px_10px_0px_0px_rgba(62,39,35,1)] transition-all"
              >
                Start Rootling
              </motion.button>
            </Link>

            {/* HERO: EXPLORE -> GOES TO REGISTER */}
            <Link to="/register">
              <motion.button 
                whileHover={{ backgroundColor: "rgba(160, 82, 45, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 rounded-xl font-display font-black text-xl text-timber-800 border-4 border-timber-800 transition-all"
              >
                Explore
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Right Imagery */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="relative group"
        >
          <div className="rounded-[60px] border-4 border-timber-800 overflow-hidden shadow-2xl relative">
            <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop" alt="Library" className="w-full h-[750px] object-cover" />
            
            {/* Scrim Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-16">
               <div className="absolute inset-0 bg-gradient-to-t from-timber-800/90 via-timber-800/20 to-transparent pointer-events-none" />
               <div className="relative z-10 max-w-sm">
                 <p className="font-display text-4xl leading-tight italic text-[#F5F5DC] font-bold shadow-black drop-shadow-md">
                   "Education is not the filling of a pail, but the lighting of a fire."
                 </p>
                 <div className="flex items-center gap-4 mt-8">
                   <span className="w-12 h-[1px] bg-timber-400"></span>
                   <p className="text-timber-200 font-display font-black tracking-[0.4em] uppercase text-[10px]">W.B. Yeats</p>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
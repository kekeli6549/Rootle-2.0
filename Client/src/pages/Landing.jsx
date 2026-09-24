import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
      <nav className="relative z-50 flex justify-between items-center px-6 sm:px-12 py-6 sm:py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-timber-800 rounded-lg flex items-center justify-center text-timber-100 font-display font-bold text-sm sm:text-base">R</div>
          <span className="text-2xl sm:text-3xl font-display font-black text-timber-800 tracking-tighter glow-backlight">
            Rootle.
          </span>
        </div>

        <div className="flex gap-4 sm:gap-8 items-center">
          <Link to="/login">
            <motion.button 
              whileHover={{ scale: 1.05, letterSpacing: "0.1em" }}
              className="hidden sm:block text-timber-800 font-display uppercase text-[10px] sm:text-xs font-black tracking-widest hover:text-timber-500 transition-all"
            >
              Log In
            </motion.button>
          </Link>
          
          <Link to="/register">
            <motion.button 
              whileHover={{ backgroundColor: "#3E2723", color: "#F5F5DC" }}
              className="bg-transparent border-2 border-timber-800 text-timber-800 px-5 py-2 sm:px-8 sm:py-2 rounded-full font-display uppercase text-[10px] sm:text-xs font-black tracking-widest transition-colors duration-300 whitespace-nowrap"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 sm:px-12 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        
        {/* Left Content */}
        <div className="text-center lg:text-left mt-8 lg:mt-0 order-2 lg:order-1">
          <h1 className="text-6xl sm:text-8xl lg:text-[9rem] font-display font-black text-timber-800 leading-none lg:leading-[0.8] mb-2">Share</h1>
          <h2 className="text-6xl sm:text-8xl lg:text-[9rem] font-display font-black leading-none lg:leading-[0.8] mb-6 sm:mb-8 text-gold-leaf glow-backlight">Rootle</h2>

          <p className="text-base sm:text-lg lg:text-xl text-timber-700 max-w-md mx-auto lg:mx-0 mb-8 sm:mb-12 leading-relaxed font-medium">
            The decentralized <span className="italic font-bold text-timber-800">Library</span> for modern academia. 
            Connect, share notes, and grow the roots of knowledge.
          </p>

          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6">
            <Link to="/login" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ x: 5, y: 5, boxShadow: "none" }}
                className="w-full sm:w-auto bg-timber-100 text-timber-800 px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-display font-black text-lg sm:text-xl border-4 border-timber-800 shadow-[6px_6px_0px_0px_rgba(62,39,35,1)] sm:shadow-[10px_10px_0px_0px_rgba(62,39,35,1)] transition-all"
              >
                Start Rootling
              </motion.button>
            </Link>

            <Link to="/register" className="w-full sm:w-auto">
              <motion.button 
                whileHover={{ backgroundColor: "rgba(160, 82, 45, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-display font-black text-lg sm:text-xl text-timber-800 border-4 border-timber-800 transition-all"
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
          className="relative group order-1 lg:order-2"
        >
          <div className="rounded-[30px] sm:rounded-[40px] lg:rounded-[60px] border-4 border-timber-800 overflow-hidden shadow-2xl relative">
            <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop" alt="Library" className="w-full h-[400px] sm:h-[500px] lg:h-[750px] object-cover" />
            
            {/* Scrim Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-16">
               <div className="absolute inset-0 bg-gradient-to-t from-timber-800/95 via-timber-800/40 to-transparent pointer-events-none" />
               <div className="relative z-10 max-w-sm">
                 <p className="font-display text-2xl sm:text-3xl lg:text-4xl leading-tight italic text-[#F5F5DC] font-bold shadow-black drop-shadow-md">
                   "Education is not the filling of a pail, but the lighting of a fire."
                 </p>
                 <div className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-8">
                   <span className="w-8 sm:w-12 h-[1px] bg-timber-400"></span>
                   <p className="text-timber-200 font-display font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase text-[9px] sm:text-[10px]">W.B. Yeats</p>
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
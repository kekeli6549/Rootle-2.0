import React from 'react';
import { motion } from 'framer-motion';

const DownloadAction = ({ onClick, loading }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation(); // Prevents triggering card click
        onClick();
      }}
      className="bg-timber-800 border-2 border-gold-leaf p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(191,149,63,1)] hover:shadow-none transition-all flex items-center justify-center group"
      title="Download from Vault"
    >
      <span className="text-xl group-hover:animate-bounce">📥</span>
      <span className="ml-2 text-[10px] font-black uppercase text-gold-leaf tracking-tighter">
        {loading ? 'SYNCING...' : 'GET FILE'}
      </span>
    </motion.button>
  );
};

export default DownloadAction;
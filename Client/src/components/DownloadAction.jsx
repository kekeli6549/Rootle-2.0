import React from 'react';
import { motion } from 'framer-motion';

const DownloadAction = ({ onClick, count = 0, disabled }) => {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2 z-20">
      {/* Moved count badge to be centered above the button */}
      <span className="bg-timber-900 text-gold-leaf text-[8px] font-black px-2 py-1 rounded border border-gold-leaf shadow-md whitespace-nowrap">
        {count} ROOTLED
      </span>
      
      <motion.button
        whileHover={!disabled ? { scale: 1.1, backgroundColor: '#bf953f' } : {}}
        whileTap={!disabled ? { scale: 0.9 } : {}}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        disabled={disabled}
        className={`w-12 h-12 rounded-full border-2 border-timber-800 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] transition-colors ${
          disabled ? 'bg-timber-200 cursor-not-allowed' : 'bg-gold-leaf text-timber-900'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v12m0 0l-4-4m4 4l4-4M8 20h8" />
        </svg>
      </motion.button>
    </div>
  );
};

export default DownloadAction;
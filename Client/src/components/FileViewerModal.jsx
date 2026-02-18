import React from 'react';
import { motion } from 'framer-motion';

const FileViewerModal = ({ isOpen, onClose, fileUrl, title }) => {
  if (!isOpen) return null;

  const BACKEND_URL = "http://localhost:5000";
  const fullUrl = `${BACKEND_URL}/${fileUrl?.replace(/\\/g, '/')}`;
  const extension = fileUrl?.split('.').pop().toLowerCase();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-timber-900/90 backdrop-blur-sm"
    >
      <div className="bg-[#F5F5DC] w-full max-w-5xl h-[90vh] rounded-[40px] border-4 border-gold-leaf overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b-4 border-timber-800 flex justify-between items-center bg-white">
          <h2 className="font-display font-black text-2xl text-timber-800 uppercase tracking-tighter">{title}</h2>
          <button 
            onClick={onClose}
            className="bg-red-500 text-white font-black px-6 py-2 rounded-full border-2 border-timber-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
          >
            CLOSE VAULT
          </button>
        </div>
        
        <div className="flex-1 bg-timber-200 p-4">
          {extension === 'pdf' ? (
            <iframe src={fullUrl} className="w-full h-full rounded-2xl border-2 border-timber-800" title={title} />
          ) : ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? (
            <div className="w-full h-full flex items-center justify-center">
              <img src={fullUrl} alt={title} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <span className="text-8xl mb-4">📄</span>
              <p className="font-display font-black text-timber-800 text-xl">PREVIEW NOT AVAILABLE FOR .{extension.toUpperCase()}</p>
              <p className="text-timber-500 mt-2 italic">Please use the download button to view this resource.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FileViewerModal;
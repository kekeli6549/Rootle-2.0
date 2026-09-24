import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FileViewerModal = ({ isOpen, onClose, fileUrl, title }) => {
  if (!isOpen) return null;

  const fullFileUrl = fileUrl?.startsWith('http') ? fileUrl : `http://localhost:5000/${fileUrl?.replace(/^\/+/, '')}`;
  const fileExtension = fileUrl?.split('.').pop().toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#3E2723]/80 backdrop-blur-sm p-2 sm:p-4">
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }} 
          animate={{ scale: 1, y: 0, opacity: 1 }} 
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="bg-[#F5F5DC] border-2 md:border-4 border-[#3E2723] p-4 md:p-8 rounded-2xl md:rounded-[40px] w-full max-w-4xl h-[90vh] md:h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_#1a0f0d] md:shadow-[16px_16px_0px_0px_#1a0f0d] relative"
        >
          {/* Header */}
          <div className="flex justify-between items-start md:items-center mb-4 pb-4 border-b-2 md:border-b-4 border-[#3E2723] gap-2">
            <div className="overflow-hidden">
              <span className="inline-block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#C5A059] bg-[#3E2723] px-2 py-1 md:px-3 rounded-full mb-1">
                Vault Preview ⚡
              </span>
              <h2 className="text-xl md:text-3xl font-black text-[#3E2723] tracking-tight mt-1 truncate max-w-[200px] sm:max-w-md md:max-w-2xl">
                {title || "Resource Document"}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 md:w-12 md:h-12 bg-[#3E2723] text-[#F5F5DC] rounded-xl md:rounded-2xl border-2 border-[#3E2723] font-black text-lg md:text-xl flex-shrink-0 flex items-center justify-center hover:bg-[#C5A059] hover:text-[#3E2723] transition-colors shadow-[2px_2px_0px_0px_#1a0f0d] md:shadow-[4px_4px_0px_0px_#1a0f0d]"
            >
              ×
            </button>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 bg-white border-2 md:border-4 border-[#3E2723] rounded-xl md:rounded-3xl overflow-hidden relative flex items-center justify-center shadow-inner">
            {isPdf ? (
              <iframe 
                src={`${fullFileUrl}#toolbar=0`} 
                title={title}
                className="w-full h-full border-none"
              />
            ) : isImage ? (
              <img 
                src={fullFileUrl} 
                alt={title} 
                className="max-h-full max-w-full object-contain p-2 md:p-4" 
              />
            ) : (
              <div className="text-center p-4 md:p-8">
                <span className="text-5xl md:text-6xl mb-4 block">📄</span>
                <p className="font-black text-[#3E2723] uppercase text-base md:text-lg mb-2">Preview Not Available for .{fileExtension?.toUpperCase()} Files</p>
                <p className="text-[10px] md:text-xs text-[#8D6E63] mb-6 px-4">Download the file directly from your dashboard to view its contents on your device.</p>
                <a 
                  href={fullFileUrl} 
                  download 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-[#C5A059] border-2 md:border-4 border-[#3E2723] px-6 py-3 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs text-[#3E2723] shadow-[4px_4px_0px_0px_#3E2723] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                >
                  Download File ⚡
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FileViewerModal;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E2723]/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }} 
          animate={{ scale: 1, y: 0, opacity: 1 }} 
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="bg-[#F5F5DC] border-4 border-[#3E2723] p-6 md:p-8 rounded-[40px] w-full max-w-4xl h-[85vh] flex flex-col shadow-[16px_16px_0px_0px_#1a0f0d] relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b-4 border-[#3E2723]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] bg-[#3E2723] px-3 py-1 rounded-full">
                Vault Preview ⚡
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#3E2723] tracking-tight mt-1 truncate max-w-2xl">
                {title || "Resource Document"}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-[#3E2723] text-[#F5F5DC] rounded-2xl border-2 border-[#3E2723] font-black text-xl flex items-center justify-center hover:bg-[#C5A059] hover:text-[#3E2723] transition-colors shadow-[4px_4px_0px_0px_#1a0f0d]"
            >
              ×
            </button>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 bg-white border-4 border-[#3E2723] rounded-3xl overflow-hidden relative flex items-center justify-center shadow-inner">
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
                className="max-h-full max-w-full object-contain p-4" 
              />
            ) : (
              <div className="text-center p-8">
                <span className="text-6xl mb-4 block">📄</span>
                <p className="font-black text-[#3E2723] uppercase text-lg mb-2">Preview Not Available for .{fileExtension?.toUpperCase()} Files</p>
                <p className="text-xs text-[#8D6E63] mb-6">Download the file directly from your dashboard to view its contents on your device.</p>
                <a 
                  href={fullFileUrl} 
                  download 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-[#C5A059] border-4 border-[#3E2723] px-6 py-3 rounded-2xl font-black uppercase text-xs text-[#3E2723] shadow-[4px_4px_0px_0px_#3E2723] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
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
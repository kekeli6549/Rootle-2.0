import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, fulfillRequestId = null, requestTitle = "" }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState('Notes');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (requestTitle) {
      setTitle(`RE: ${requestTitle}`);
    } else {
      setTitle("");
    }
  }, [requestTitle, isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to upload.");

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    if (fulfillRequestId) formData.append('requestId', fulfillRequestId);

    try {
      const response = await API.post('/resources/upload', formData);

      if (response.status === 200 || response.status === 201) {
        if (onUploadSuccess && typeof onUploadSuccess === 'function') {
          onUploadSuccess("VAULT UPDATED! ⚡", "success");
        }
        onClose();
      } else {
        alert(response.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload UI Error:", err);
      alert(err.response?.data?.message || "System Error. Check your server logs.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#3E2723]/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#F5F5DC] border-2 md:border-4 border-[#3E2723] p-6 md:p-10 rounded-[32px] md:rounded-[40px] w-full max-w-lg shadow-[12px_12px_0px_0px_#1a0f0d] md:shadow-[20px_20px_0px_0px_#1a0f0d] my-auto max-h-[95vh] overflow-y-auto"
          >
            <h2 className="text-2xl md:text-4xl font-black text-[#3E2723] mb-4 md:mb-2 uppercase tracking-tighter">Vault Entry.</h2>
            
            {fulfillRequestId && (
              <div className="bg-[#E8F5E9] border-2 border-[#2E7D32] p-2 md:p-3 rounded-xl md:rounded-2xl mb-4 md:mb-6 shadow-[2px_2px_0px_0px_#2E7D32] md:shadow-[3px_3px_0px_0px_#2E7D32]">
                <p className="text-[9px] md:text-[10px] font-black text-[#2E7D32] uppercase text-center tracking-widest truncate">
                  ⚡ FULFILLING HUB REQUEST #{fulfillRequestId.slice(-6)}
                </p>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1 md:mb-2 text-[#5D4037]">Resource Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  className="w-full bg-white border-2 md:border-4 border-[#3E2723] p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-[#3E2723] outline-none shadow-[2px_2px_0px_0px_#3E2723] md:shadow-[4px_4px_0px_0px_#3E2723] focus:ring-2 focus:ring-[#C5A059] transition-all" 
                  placeholder="Enter title..." 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1 md:mb-2 text-[#5D4037]">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full bg-white border-2 md:border-4 border-[#3E2723] p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-[#3E2723] outline-none shadow-[2px_2px_0px_0px_#3E2723] md:shadow-[4px_4px_0px_0px_#3E2723] transition-all"
                >
                  {['Notes', 'Past Questions', 'Research', 'Textbooks'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="border-2 md:border-4 border-dashed border-[#8D6E63] rounded-2xl md:rounded-3xl p-6 md:p-8 text-center relative hover:border-[#C5A059] bg-white/40 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                <div className="flex flex-col items-center pointer-events-none px-2">
                  <span className="text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform">📂</span>
                  <p className="font-black text-[#3E2723] uppercase text-[10px] md:text-xs tracking-wider truncate w-full text-center">
                    {file ? file.name : "Click or Drag File Here"}
                  </p>
                  <span className="text-[9px] md:text-[10px] text-[#8D6E63] font-bold mt-1">PDF, DOCX, PPT, or Images</span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-full sm:flex-1 font-black text-[#8D6E63] uppercase text-xs tracking-wider py-3 md:py-4 hover:text-[#3E2723] border-2 border-transparent hover:bg-[#8D6E63]/10 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading} 
                  className="w-full sm:flex-1 bg-[#C5A059] border-2 md:border-4 border-[#3E2723] p-3 md:p-4 rounded-xl md:rounded-2xl font-black uppercase text-xs text-[#3E2723] shadow-[4px_4px_0px_0px_#3E2723] hover:bg-[#b5904d] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {uploading ? "Deploying..." : "Verify & Deploy ⚡"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
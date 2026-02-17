import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FulfillModal = ({ isOpen, onClose, request, onFulfillSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleFulfill = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select the file first! 📁");

    setLoading(true);
    const token = localStorage.getItem('rootle_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', request.title); // Keep the title the same as requested
    formData.append('category', 'Notes'); // Default category
    formData.append('requestId', request.id); // The Link!

    try {
      const response = await fetch('http://localhost:5000/api/resources/upload', {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData,
      });

      if (response.ok) {
        onFulfillSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || "Something went wrong.");
      }
    } catch (err) {
      alert("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-[#3E2723]/60">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#F5F5DC] w-full max-w-md rounded-[40px] border-4 border-[#3E2723] p-8 shadow-[20px_20px_0px_0px_rgba(62,39,35,1)] relative"
      >
        <button onClick={onClose} className="absolute top-6 right-8 text-[#3E2723] font-black text-xl">✕</button>

        <h2 className="text-3xl font-black text-[#3E2723] tracking-tighter mb-2">Fulfill Wish 🎁</h2>
        <p className="text-[#5D4037] text-xs font-bold mb-6 uppercase tracking-widest">
            For: {request.title}
        </p>

        <form onSubmit={handleFulfill} className="space-y-6">
          <div className="border-4 border-dashed border-[#3E2723]/30 rounded-3xl p-8 text-center bg-white/50 relative">
            {file ? (
              <div>
                <p className="text-[#3E2723] font-black text-sm truncate mb-2">{file.name}</p>
                <button type="button" onClick={() => setFile(null)} className="text-red-600 text-[10px] font-black uppercase">Change</button>
              </div>
            ) : (
              <>
                <p className="text-[#3E2723] font-bold text-sm">Select the file to upload</p>
                <input 
                  type="file" 
                  required
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => setFile(e.target.files[0])} 
                />
              </>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#2E7D32] text-white rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(27,94,32,1)] hover:translate-y-1 hover:shadow-none transition-all"
          >
            {loading ? "UPLOADING..." : "SEND TO THE HUB ✓"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default FulfillModal;
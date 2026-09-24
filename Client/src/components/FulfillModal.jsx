import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
    formData.append('title', request.title);
    formData.append('category', 'Notes');
    formData.append('requestId', request.id);

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-[#3E2723]/60 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#F5F5DC] w-full max-w-md rounded-3xl md:rounded-[40px] border-2 md:border-4 border-[#3E2723] p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(62,39,35,1)] md:shadow-[20px_20px_0px_0px_rgba(62,39,35,1)] relative my-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-6 md:top-6 md:right-8 text-[#3E2723] font-black text-xl hover:scale-110 transition-transform">✕</button>

        <h2 className="text-2xl md:text-3xl font-black text-[#3E2723] tracking-tighter mb-2 pr-6">Fulfill Wish 🎁</h2>
        <p className="text-[#5D4037] text-[10px] md:text-xs font-bold mb-6 uppercase tracking-widest truncate">
            For: {request.title}
        </p>

        <form onSubmit={handleFulfill} className="space-y-6">
          <div className="border-2 md:border-4 border-dashed border-[#3E2723]/30 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center bg-white/50 relative">
            {file ? (
              <div>
                <p className="text-[#3E2723] font-black text-xs md:text-sm truncate mb-2 px-2">{file.name}</p>
                <button type="button" onClick={() => setFile(null)} className="text-red-600 text-[10px] font-black uppercase hover:underline">Change</button>
              </div>
            ) : (
              <>
                <p className="text-[#3E2723] font-bold text-xs md:text-sm">Select the file to upload</p>
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
            className="w-full py-3 md:py-4 bg-[#2E7D32] text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-[4px_4px_0px_0px_rgba(27,94,32,1)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? "UPLOADING..." : "SEND TO THE HUB ✓"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default FulfillModal;
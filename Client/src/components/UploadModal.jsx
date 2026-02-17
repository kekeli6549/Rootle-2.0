import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, fulfillRequestId = null, requestTitle = "" }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState('Notes');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (requestTitle) setTitle(`RE: ${requestTitle}`);
  }, [requestTitle]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file.");

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    if (fulfillRequestId) formData.append('requestId', fulfillRequestId);

    try {
      const response = await fetch('http://localhost:5000/api/resources/upload', {
        method: 'POST',
        headers: { 'x-auth-token': localStorage.getItem('rootle_token') },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Safe check to prevent the TypeError in your console
        if (onUploadSuccess && typeof onUploadSuccess === 'function') {
          onUploadSuccess("VAULT UPDATED! ⚡", "success");
        }
        onClose();
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload UI Error:", err);
      alert("System Error. Check your server logs.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#F5F5DC] border-4 border-[#3E2723] p-8 rounded-[40px] w-full max-w-lg shadow-[20px_20px_0px_0px_rgba(62,39,35,1)]">
        <h2 className="text-4xl font-black text-[#3E2723] mb-2 uppercase tracking-tighter">Vault Entry.</h2>
        
        {fulfillRequestId && (
          <div className="bg-green-100 border-2 border-green-300 p-2 rounded-xl mb-6">
            <p className="text-[10px] font-black text-green-700 uppercase text-center tracking-widest">
                FULFILLING HUB REQUEST #{fulfillRequestId}
            </p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-[#5D4037]">Resource Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-white border-2 border-[#3E2723] p-4 rounded-2xl font-bold text-[#3E2723] outline-none" placeholder="Title" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-[#5D4037]">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-2 border-[#3E2723] p-4 rounded-2xl font-bold text-[#3E2723] outline-none">
              {['Notes', 'Past Questions', 'Research', 'Textbooks'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="border-4 border-dashed border-[#D7CCC8] rounded-3xl p-8 text-center relative hover:border-[#C5A059] transition-colors cursor-pointer">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <p className="font-black text-[#8D6E63] uppercase">{file ? file.name : "Select File 📂"}</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 font-black text-[#8D6E63] uppercase">Cancel</button>
            <button type="submit" disabled={uploading} className="flex-1 bg-[#C5A059] border-2 border-[#3E2723] p-4 rounded-2xl font-black uppercase text-[#3E2723] shadow-[4px_4px_0px_0px_rgba(62,39,35,1)]">
              {uploading ? "Deploying..." : "Verify & Deploy"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UploadModal;
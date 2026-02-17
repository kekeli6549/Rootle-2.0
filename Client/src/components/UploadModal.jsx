import React, { useState } from 'react';
import { motion } from 'framer-motion';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, requestId = null, requestTitle = "" }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(requestTitle ? `RE: ${requestTitle}` : "");
  const [category, setCategory] = useState('Notes');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file.");

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    
    // CRITICAL: This links the upload to the Request Hub item
    if (requestId) {
      formData.append('requestId', requestId);
    }

    try {
      const token = localStorage.getItem('rootle_token');
      const response = await fetch('http://localhost:5000/api/resources/upload', {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess("VAULT UPDATED & REQUEST FULFILLED! ⚡", "success");
        onClose();
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("System Error during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-timber-900/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-[#F5F5DC] border-4 border-timber-800 p-8 rounded-[40px] w-full max-w-lg shadow-[20px_20px_0px_0px_rgba(62,39,35,1)]"
      >
        <h2 className="text-4xl font-display font-black text-timber-800 mb-2 uppercase tracking-tighter">Vault Entry.</h2>
        
        {requestId && (
          <div className="bg-red-100 border-2 border-red-200 p-2 rounded-xl mb-6">
            <p className="text-[10px] font-black text-red-600 uppercase text-center">Fulfilling Hub Request #{requestId}</p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-timber-500">Resource Title</label>
            <input 
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full bg-white border-2 border-timber-800 p-4 rounded-2xl font-display font-black text-timber-800 focus:ring-4 ring-gold-leaf/20 outline-none"
              placeholder="E.g. Advanced Tort Law Notes"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-timber-500">Category</label>
            <select 
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border-2 border-timber-800 p-4 rounded-2xl font-display font-black text-timber-800 outline-none"
            >
              {['Notes', 'Past Question', 'Research', 'Textbook'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="border-4 border-dashed border-timber-300 rounded-3xl p-8 text-center hover:border-gold-leaf transition-colors cursor-pointer relative">
            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-2">📂</span>
              <p className="text-[10px] font-black text-timber-400 uppercase">
                {file ? file.name : "Drop file or click to browse"}
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 p-4 font-display font-black uppercase text-timber-400 hover:text-timber-800 transition-colors">Cancel</button>
            <button 
              type="submit" disabled={uploading}
              className="flex-1 bg-gold-leaf border-2 border-timber-800 p-4 rounded-2xl font-display font-black uppercase text-timber-800 shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
            >
              {uploading ? "Verifying..." : "Verify & Deploy"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UploadModal;
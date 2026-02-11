import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notes'); 
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        pdf: '📕', doc: '📘', docx: '📘', ppt: '📙', pptx: '📙',
        xls: '📊', xlsx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
        zip: '📦', rar: '📦'
    };
    return icons[ext] || '📄';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 50 * 1024 * 1024) return onUploadSuccess("FILE TOO HEAVY (MAX 50MB)", "error");
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return onUploadSuccess("SELECT A FILE, CHIEF!", "error");
    
    setLoading(true);
    const token = localStorage.getItem('rootle_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);

    try {
      const response = await fetch('http://localhost:5000/api/resources/upload', {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData, 
      });

      const data = await response.json();
      if (response.ok) {
        // Trigger the fancy Toast in Dashboard.jsx
        onUploadSuccess("KNOWLEDGE ROOTLED! AWAITING APPROVAL 🚀", "success");
        setFile(null);
        setTitle('');
        onClose();
      } else {
        onUploadSuccess(data.message || "SYSTEM ERROR", "error");
      }
    } catch (err) {
      onUploadSuccess("SERVER CONNECTION FAILED", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-timber-900/60">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-[#F5F5DC] w-full max-w-2xl rounded-[40px] border-4 border-timber-800 p-10 shadow-[20px_20px_0px_0px_rgba(62,39,35,0.3)] relative"
      >
        <button onClick={onClose} className="absolute top-6 right-8 text-timber-800 font-black text-2xl hover:rotate-90 transition-transform">✕</button>

        <h2 className="text-4xl font-display font-black text-timber-800 tracking-tighter mb-1 text-center">Vault Deposit.</h2>
        <p className="text-timber-500 uppercase text-[10px] text-center font-black tracking-[0.2em] mb-8">
            FACULTY: {user?.departmentName || 'GENERAL'} • UPLOADER: {user?.fullName || 'Scholar'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`relative h-56 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
              dragActive ? 'border-gold-leaf bg-timber-100' : 'border-timber-300 bg-white/50'
            }`}
          >
            {file ? (
              <div className="text-center">
                <div className="text-5xl mb-2">{getFileIcon(file.name)}</div>
                <p className="text-timber-800 font-black text-sm max-w-[250px] truncate">{file.name}</p>
                <button type="button" onClick={() => setFile(null)} className="text-red-600 text-[10px] font-black uppercase mt-2 hover:underline">Change File</button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-timber-800 rounded-full flex items-center justify-center mb-4 text-gold-leaf text-2xl shadow-lg">↑</div>
                <p className="text-timber-800 font-bold">Drag files here or <span className="text-timber-500 underline cursor-pointer">browse</span></p>
                <p className="text-timber-400 text-[9px] font-black mt-2 uppercase tracking-widest text-center">PDF • DOCX • PPTX • XLSX • ZIP • JPEG • PNG (MAX 50MB)</p>
              </>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-timber-800 block mb-2 tracking-widest">Resource Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white border-2 border-timber-800 p-4 rounded-xl font-bold focus:ring-2 ring-gold-leaf outline-none" placeholder="e.g. Intro to Torts" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-timber-800 block mb-2 tracking-widest">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-2 border-timber-800 p-4 rounded-xl font-bold cursor-pointer outline-none">
                {['Notes', 'Past Questions', 'Research', 'Textbooks'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <motion.button 
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-2xl font-display font-black text-xl bg-timber-800 text-gold-leaf uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(191,149,63,0.4)] disabled:opacity-50"
          >
            {loading ? "DIGITIZING..." : "COMMENCE UPLOAD"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadModal;
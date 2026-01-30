import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 

const UploadModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notes'); // Matched to your dashboard categories
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Helper to show the right icon based on file extension
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
    return '📄';
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
      if (droppedFile.size > 50 * 1024 * 1024) return alert("File is too heavy! (Max 50MB)");
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first, Chief!");
    
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
        alert("Knowledge Rootled Successfully! 🚀");
        setFile(null);
        setTitle('');
        onClose();
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (err) {
      alert("Connection failed. Check your server.");
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

        <h2 className="text-4xl font-display font-black text-timber-800 tracking-tighter mb-1">Rootle a New File.</h2>
        <p className="text-timber-500 uppercase text-[10px] font-black tracking-[0.2em] mb-8">UPLOADING AS: {user?.fullName}</p>

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
                <div className="w-16 h-16 bg-timber-800 rounded-full flex items-center justify-center mb-4 text-gold-leaf text-2xl">↑</div>
                <p className="text-timber-800 font-bold">Drag files here or <span className="text-timber-500 underline cursor-pointer">browse</span></p>
                <p className="text-timber-400 text-[9px] font-black mt-2 uppercase tracking-widest">PDF • DOCX • PPTX • XLSX • IMG (MAX 50MB)</p>
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
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-2 border-timber-800 p-4 rounded-xl font-bold cursor-pointer outline-none appearance-none">
                <option value="Notes">Notes</option>
                <option value="Past Questions">Past Questions</option>
                <option value="Research">Research</option>
                <option value="Textbooks">Textbooks</option>
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
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const UploadModal = ({ isOpen, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-timber-900/40">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[#F5F5DC] w-full max-w-2xl rounded-[40px] border-4 border-timber-800 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-8 text-timber-800 font-display font-black text-2xl hover:scale-125 transition-transform"
        >
          ✕
        </button>

        <h2 className="text-4xl font-display font-black text-timber-800 tracking-tighter mb-2">Rootle a New File.</h2>
        <p className="text-timber-500 uppercase text-[10px] font-black tracking-widest mb-8">Share your wisdom with the community</p>

        <form className="space-y-6">
          {/* DRAG AND DROP AREA */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative h-64 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
              dragActive ? 'border-timber-500 bg-timber-100' : 'border-timber-300 bg-transparent'
            }`}
          >
            {file ? (
              <div className="text-center">
                <div className="bg-timber-800 text-gold-leaf px-4 py-2 rounded-lg font-black text-xs uppercase mb-2">File Selected</div>
                <p className="text-timber-800 font-bold">{file.name}</p>
                <button onClick={() => setFile(null)} className="text-red-900 text-[10px] font-black uppercase mt-4 underline">Remove</button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-timber-200 rounded-full flex items-center justify-center mb-4">
                   <span className="text-2xl">📄</span>
                </div>
                <p className="text-timber-800 font-bold">Drag & Drop or <span className="text-timber-500 underline cursor-pointer">Browse</span></p>
                <p className="text-timber-400 text-[10px] font-bold mt-2 uppercase">PDF, DOCX, or PPTX (Max 50MB)</p>
              </>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-timber-800 block mb-2">Subject/Course</label>
              <input className="w-full bg-white border-2 border-timber-800 p-3 rounded-xl outline-none" placeholder="e.g. CSC 301" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-timber-800 block mb-2">Category</label>
              <select className="w-full bg-white border-2 border-timber-800 p-3 rounded-xl outline-none appearance-none">
                <option>Lecture Note</option>
                <option>Past Question</option>
                <option>Research Paper</option>
              </select>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#3E2723", color: "#F5F5DC" }}
            className="w-full py-5 rounded-2xl font-display font-black text-xl border-4 border-timber-800 text-timber-800 uppercase tracking-widest transition-all shadow-[6px_6px_0px_0px_rgba(62,39,35,1)]"
          >
            UPLOAD TO ROOTLE
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadModal;
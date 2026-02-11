import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RequestHub = ({ user, showToast }) => {
  const [requests, setRequests] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '' });

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('rootle_token');
      const response = await fetch('http://localhost:5000/api/resources/requests', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) setRequests(data);
    } catch (err) {
      console.error("Hub Error:", err);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rootle_token');
      const response = await fetch('http://localhost:5000/api/resources/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        showToast("WISH POSTED TO THE VAULT", "success");
        setNewRequest({ title: '', description: '' });
        setIsPosting(false);
        fetchRequests();
      }
    } catch (err) {
      showToast("FAILED TO POST REQUEST", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-black text-timber-800 uppercase tracking-tighter">Community Wishlist</h2>
        <motion.button 
          onClick={() => setIsPosting(!isPosting)}
          whileHover={{ scale: 1.05 }}
          className="bg-gold-leaf text-timber-900 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg border-2 border-timber-800"
        >
          {isPosting ? 'Cancel' : '+ Request a Resource'}
        </motion.button>
      </div>

      <AnimatePresence>
        {isPosting && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-white border-4 border-timber-800 p-6 rounded-[30px] shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] space-y-4 overflow-hidden"
          >
            <input 
              required placeholder="WHAT DO YOU NEED? (e.g. CSC 201 Past Questions)"
              value={newRequest.title}
              onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
              className="w-full bg-timber-50 border-2 border-timber-800 p-3 rounded-xl font-bold outline-none"
            />
            <textarea 
              placeholder="ANY SPECIFIC DETAILS? (Year, Lecturer, Topic...)"
              value={newRequest.description}
              onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
              className="w-full bg-timber-50 border-2 border-timber-800 p-3 rounded-xl font-bold h-24 outline-none"
            />
            <button className="w-full bg-timber-800 text-gold-leaf py-3 rounded-xl font-black uppercase tracking-widest hover:bg-timber-700 transition-colors">
              Dispatch Request
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => (
          <motion.div 
            key={req.id}
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="bg-[#FFFBF0] border-2 border-timber-800 p-5 rounded-2xl flex justify-between items-center group hover:bg-white transition-all shadow-md"
          >
            <div>
              <p className="text-[8px] font-black text-gold-leaf uppercase tracking-widest mb-1">{req.dept_name || 'General'}</p>
              <h4 className="font-display font-black text-timber-800 text-lg uppercase">{req.title}</h4>
              <p className="text-timber-500 text-xs italic">{req.description}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-timber-400 uppercase tracking-widest">Requested by</p>
              <p className="text-[10px] font-bold text-timber-800 uppercase">{req.requester_name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RequestHub;
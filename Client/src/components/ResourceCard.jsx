import React from 'react';
import { motion } from 'framer-motion';
import RatingSystem from './RatingSystem';

const ResourceCard = ({ resource, onRate, onDownload, onDeleteRequest }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[#FFF8E1] p-6 rounded-2xl border-4 border-[#3E2723] flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(62,39,35,0.8)] relative overflow-hidden"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="bg-[#D7CCC8] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#3E2723]">
            {resource.category || 'General'}
          </span>
          <span className="text-[11px] font-bold text-[#8D6E63]">
            {new Date(resource.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-xl font-black text-[#3E2723] leading-tight mb-2 uppercase tracking-tight">
          {resource.title}
        </h3>
        
        <div className="text-xs font-bold text-[#5D4037] mb-2">
          Uploaded by: <span className="text-[#3E2723] underline">{resource.uploader_name || 'Anonymous Scholar'}</span>
        </div>
      </div>

      <div>
        {/* Rating System Integration */}
        <RatingSystem 
          currentRating={resource.average_rating || 0} 
          onRate={(ratingVal) => onRate(resource._id, ratingVal)} 
        />

        <div className="pt-4 mt-4 border-t-2 border-[#3E2723]/10 flex justify-between items-center">
          <span className="text-[10px] font-black text-[#8D6E63] uppercase">
            📥 {resource.download_count || 0} Downloads
          </span>

          <div className="flex gap-2">
            {onDeleteRequest && (
              <button 
                onClick={() => onDeleteRequest(resource._id)}
                className="text-[10px] font-black bg-red-700 text-white px-3 py-2 rounded-lg hover:bg-red-800 transition"
                title="Flag for deletion"
              >
                Report ⚠️
              </button>
            )}
            <button 
              onClick={() => onDownload(resource)}
              className="text-[10px] font-black bg-[#3E2723] text-[#F5F5DC] px-4 py-2 rounded-lg hover:bg-[#5D4037] transition shadow"
            >
              Download 📂
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
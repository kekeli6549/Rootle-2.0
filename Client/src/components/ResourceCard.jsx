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
      className="bg-[#FFF8E1] p-4 md:p-6 rounded-2xl border-2 md:border-4 border-[#3E2723] flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(62,39,35,0.8)] relative overflow-hidden"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="bg-[#D7CCC8] px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#3E2723]">
            {resource.category || 'General'}
          </span>
          <span className="text-[10px] md:text-[11px] font-bold text-[#8D6E63]">
            {new Date(resource.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-lg md:text-xl font-black text-[#3E2723] leading-tight mb-2 uppercase tracking-tight line-clamp-2 md:line-clamp-none">
          {resource.title}
        </h3>
        
        <div className="text-[10px] md:text-xs font-bold text-[#5D4037] mb-2 truncate">
          Uploaded by: <span className="text-[#3E2723] underline">{resource.uploader_name || 'Anonymous Scholar'}</span>
        </div>
      </div>

      <div>
        <RatingSystem 
          currentRating={resource.average_rating || 0} 
          onRate={(ratingVal) => onRate(resource._id, ratingVal)} 
        />

        <div className="pt-4 mt-4 border-t-2 border-[#3E2723]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <span className="text-[10px] font-black text-[#8D6E63] uppercase">
            📥 {resource.download_count || 0} Downloads
          </span>

          <div className="flex gap-2 w-full sm:w-auto">
            {onDeleteRequest && (
              <button 
                onClick={() => onDeleteRequest(resource._id)}
                className="flex-1 sm:flex-none text-[10px] font-black bg-red-700 text-white px-3 py-2 md:px-3 md:py-2 rounded-lg hover:bg-red-800 transition text-center"
                title="Flag for deletion"
              >
                Report ⚠️
              </button>
            )}
            <button 
              onClick={() => onDownload(resource)}
              className="flex-1 sm:flex-none text-[10px] font-black bg-[#3E2723] text-[#F5F5DC] px-4 py-2 rounded-lg hover:bg-[#5D4037] transition shadow text-center"
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
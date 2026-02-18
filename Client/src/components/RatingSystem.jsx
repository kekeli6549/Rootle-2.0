import React from 'react';

const RatingSystem = ({ currentRating, onRate }) => {
  // Ensure we display a clean decimal for the average
  const displayAvg = Number(currentRating || 0).toFixed(1);

  return (
    <div className="flex flex-col gap-2 mt-4 relative z-10">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-timber-500 uppercase tracking-widest">Avg. Rating</span>
        <span className="text-[10px] font-black bg-timber-800 text-gold-leaf px-2 py-0.5 rounded shadow-sm">
          {displayAvg} / 5
        </span>
      </div>
      
      <div className="flex items-center gap-1 bg-timber-100/80 w-fit px-2 py-1.5 rounded-xl border-2 border-timber-200">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={(e) => {
                e.stopPropagation();
                onRate(num);
              }}
              className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all transform active:scale-90 ${
                Math.round(currentRating) >= num 
                  ? 'bg-gold-leaf text-timber-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]' 
                  : 'bg-white text-timber-400 hover:bg-gold-leaf/20 border border-timber-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingSystem;
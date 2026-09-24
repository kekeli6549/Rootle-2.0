import React from 'react';

const Logo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 md:w-10 md:h-10',
    lg: 'w-12 h-12 md:w-14 md:h-14',
  };

  return (
    <div className={`flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      {/* Tiny Logo Icon (Diamond/Chevron with Lightning Bolt) */}
      <div className={`relative flex items-center justify-center bg-[#3E2723] rounded-xl border-2 border-[#1a0f0d] shadow-[3px_3px_0px_0px_#C5A059] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform ${sizeClasses[size] || sizeClasses.md}`}>
        <svg 
          viewBox="0 0 24 24" 
          className="w-4 h-4 md:w-5 md:h-5 text-[#C5A059] fill-current drop-shadow"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      {/* Rootle Brand Name in Native Font Style */}
      <span className="font-display font-black tracking-tighter text-[#3E2723] uppercase text-xl md:text-2xl flex items-center gap-1.5">
        Rootle
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C5A059] border border-[#3E2723] animate-pulse"></span>
      </span>
    </div>
  );
};

export default Logo;
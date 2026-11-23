import React from 'react';
import rootleSvg from '../assets/rootle.svg';

/**
 * Logo component for Rootle.
 * Uses the actual rootle.svg asset (globe icon) so the brand mark matches
 * the project identity shown in the logo image.
 */
const Logo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 md:w-10 md:h-10',
    lg: 'w-12 h-12 md:w-14 md:h-14',
    xl: 'w-16 h-16 md:w-20 md:h-20',
  };

  return (
    <div className={`flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      {/* Globe icon from rootle.svg asset */}
      <div
        className={`relative flex items-center justify-center rounded-xl border-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)] group-hover:translate-y-[-2px] transition-transform duration-300 ${sizeClasses[size] || sizeClasses.md}`}
      >
        <img
          src={rootleSvg}
          alt="Rootle logo"
          className="w-full h-full object-contain select-none"
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Rootle Brand Name */}
      <span className="font-display font-black tracking-tighter text-[#3E2723] uppercase text-xl sm:text-2xl flex items-center gap-1.5 leading-none group-hover:text-[#C5A059] transition-colors">
        Rootle<span className="text-gold-leaf">.</span>
      </span>
    </div>
  );
};

export default Logo;

import React from 'react';

/**
 * Logo component for Rootle.
 * Uses the actual SVG assets so the brand mark renders crisply at any size.
 * Pass `variant` to match the background:
 *   - 'default'  -> rootle in brown.svg  (dark backgrounds / timber UI)
 *   - 'white'    -> rootle in white.svg  (light / dark contrast)
 *   - 'black'    -> rootle in Black.svg  (print / light backgrounds)
 *   - 'full'     -> rootle.svg           (full master, landing page hero)
 */
const Logo = ({ size = 'md', variant = 'default', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 md:w-10 md:h-10',
    lg: 'w-12 h-12 md:w-14 md:h-14',
    xl: 'w-16 h-16 md:w-20 md:h-20',
  };

  const srcMap = {
    default: '/src/assets/rootle in brown.svg',
    white: '/src/assets/rootle in white.svg',
    black: '/src/assets/rootle in Black.svg',
    full: '/src/assets/rootle.svg',
  };

  return (
    <div className={`flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      {/* Brand icon using the real SVG asset */}
      <div
        className={`relative flex items-center justify-center rounded-xl border-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)] group-hover:translate-y-[-2px] transition-transform duration-300 ${sizeClasses[size] || sizeClasses.md}`}
      >
        <img
          src={srcMap[variant] || srcMap.default}
          alt="Rootle logo"
          className="w-full h-full object-contain select-none"
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Rootle Brand Name */}
      <span className="font-display font-black tracking-tighter text-[#3E2723] uppercase text-xl md:text-2xl flex items-center gap-1.5 leading-none">
        Rootle
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C5A059] border border-[#3E2723] animate-pulse"></span>
      </span>
    </div>
  );
};

export default Logo;

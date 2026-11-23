import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';

/**
 * Top header bar used on every page.
 * Shows the Rootle SVG logo + brand name at top left,
 * with navigation links / actions aligned right.
 */
export const Header = ({ showNav = true, brandLink = '/' }) => {
  const navigate = useNavigate();

  const navLinks = [
    { to: '/dashboard/student', label: 'Library', role: 'student' },
    { to: '/dashboard/lecturer', label: 'Staff', role: 'staff' },
    { to: '/dashboard/superadmin', label: 'Super Admin', role: 'superadmin' },
    { to: '/leaderboard', label: 'Leaderboard', role: null },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-timber-800/60 bg-timber-50/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* LEFT: Logo + Brand */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <Link to={brandLink} className="flex items-center gap-2 sm:gap-3 group">
              <Logo size="lg" variant="default" />
              <span className="font-display font-black tracking-tighter text-[#3E2723] uppercase text-xl sm:text-2xl lg:text-3xl flex items-center gap-1.5 leading-none group-hover:text-[#C5A059] transition-colors">
                Rootle<span className="text-gold-leaf">.</span>
              </span>
            </Link>
          </div>

          {/* RIGHT: Navigation */}
          {showNav && (
            <nav className="hidden sm:flex items-center gap-6 sm:gap-8 ml-auto flex-1 justify-end">
              <Link
                to="/login"
                className="text-timber-800 font-display font-black uppercase text-xs sm:text-sm tracking-widest hover:text-gold-leaf transition-colors px-4 py-2 rounded-lg hover:bg-white/50 transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-timber-800 text-timber-100 font-display font-black uppercase text-xs sm:text-sm tracking-widest px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-[#C5A059] hover:text-[#3E2723] transition-all motion-safe:hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

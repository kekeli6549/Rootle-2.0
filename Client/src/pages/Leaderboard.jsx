import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import scribbleBg from '../assets/scribble-bg.png';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('All');

  const fetchRankings = async (roleFilter = 'All') => {
    try {
      setLoading(true);
      const res = await API.get(`/resources/rankings?role=${roleFilter}`);
      setRankings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings(selectedRole);
  }, [selectedRole]);

  // Badge color mapping based on Level
  const getBadgeColor = (level) => {
    switch (level) {
      case 5: return 'bg-purple-900 text-purple-200 border-purple-400';
      case 4: return 'bg-amber-600 text-white border-amber-300';
      case 3: return 'bg-blue-800 text-blue-100 border-blue-400';
      case 2: return 'bg-emerald-700 text-emerald-100 border-emerald-400';
      case 1: return 'bg-[#8D6E63] text-[#F5F5DC] border-[#3E2723]';
      default: return 'bg-gray-300 text-gray-700 border-gray-400';
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-12 relative" style={{ backgroundColor: '#F5F5DC', backgroundImage: `url(${scribbleBg})`, backgroundSize: '400px' }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 sm:mb-10 gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#3E2723] tracking-tighter mb-2">Hall of Fame.</h1>
          <p className="text-[#5D4037] text-sm sm:text-base font-medium italic">Recognizing top contributors scaling up Rootle knowledge 🏆</p>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="flex bg-[#FFF8E1] border-2 border-[#3E2723] rounded-xl p-1 shadow-sm w-full sm:w-auto overflow-x-auto">
            {['All', 'student', 'lecturer'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all ${
                  selectedRole === role 
                    ? 'bg-[#3E2723] text-[#F5F5DC] shadow' 
                    : 'text-[#3E2723] hover:bg-[#D7CCC8]/55'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <button onClick={() => navigate(-1)} className="px-6 py-2 border-2 border-[#3E2723] rounded-full font-bold text-[#3E2723] text-sm hover:bg-[#D7CCC8] transition w-full sm:w-auto">Back</button>
        </div>
      </div>

      {/* Rankings List / Table */}
      <div className="bg-[#FFF8E1] rounded-[20px] sm:rounded-[30px] border-2 sm:border-4 border-[#3E2723] shadow-[4px_4px_0px_0px_rgba(62,39,35,0.9)] sm:shadow-[8px_8px_0px_0px_rgba(62,39,35,0.9)] overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <div className="min-w-[600px] lg:min-w-full">
            <div className="grid grid-cols-12 bg-[#3E2723] text-[#F5F5DC] px-4 sm:px-6 py-3 sm:py-4 font-black text-[9px] sm:text-xs uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Scholar / Contributor</div>
              <div className="col-span-2 text-center">Role</div>
              <div className="col-span-2 text-center">Uploads</div>
              <div className="col-span-2 text-right pr-2">Badge Tier</div>
            </div>

            {loading ? (
              <div className="py-16 sm:py-20 text-center font-black text-[#3E2723] text-base sm:text-lg animate-pulse">
                Calculating Leaderboard Stats...
              </div>
            ) : rankings.length === 0 ? (
              <div className="py-16 sm:py-20 text-center font-bold text-[#5D4037] text-sm sm:text-base px-4">
                No rankings found for this category yet. Be the first to upload! 🚀
              </div>
            ) : (
              <div className="divide-y-2 divide-[#3E2723]/10">
                {rankings.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.userId || index} 
                    className="grid grid-cols-12 px-4 sm:px-6 py-3 sm:py-4 items-center hover:bg-[#FFE0B2]/30 transition-colors"
                  >
                    <div className="col-span-1 text-center font-black text-base sm:text-lg text-[#3E2723]">
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                    </div>
                    <div className="col-span-5 flex flex-col truncate pr-2">
                      <span className="font-black text-[#3E2723] text-sm sm:text-base truncate">{item.fullName}</span>
                      <span className="text-[10px] sm:text-xs text-[#8D6E63] font-medium truncate">{item.email}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="bg-[#D7CCC8] px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase text-[#3E2723]">
                        {item.role}
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-black text-[#3E2723] text-base sm:text-lg">
                      {item.totalUploads}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[10px] font-black border uppercase shadow-sm truncate max-w-full ${getBadgeColor(item.level)}`}>
                        {item.badgeTitle}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
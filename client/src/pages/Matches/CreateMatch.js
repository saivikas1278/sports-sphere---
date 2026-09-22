import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  ArrowRight
} from 'lucide-react';
import { 
  FaFutbol, FaTableTennis, FaRunning, FaVolleyballBall, FaBasketballBall, FaBaseballBall
} from 'react-icons/fa';
import { GiWhistle } from 'react-icons/gi';

const CreateMatch = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState(null);

  const sportsOptions = [
    { id: 'cricket', name: 'Cricket', icon: <FaBaseballBall className="w-8 h-8" />, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'badminton', name: 'Badminton', icon: <FaTableTennis className="w-8 h-8" />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'kabaddi', name: 'Kabaddi', icon: <FaRunning className="w-8 h-8" />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'volleyball', name: 'Volleyball', icon: <FaVolleyballBall className="w-8 h-8" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'basketball', name: 'Basketball', icon: <FaBasketballBall className="w-8 h-8" />, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'soccer', name: 'Soccer', icon: <FaFutbol className="w-8 h-8" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  const handleSportSelect = (sportId) => {
    setSelectedSport(sportId);
    setTimeout(() => {
      navigate(`/matches/create/${sportId}/teams`);
    }, 300);
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 md:py-10 relative z-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-4 md:mb-6 md:mb-10 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div className="w-16 h-16 mx-auto rounded-2xl md:rounded-3xl bg-blue-500 text-white flex items-center justify-center mb-4 shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]">
            <GiWhistle size={32} />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">Create a Match</h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Select a sport below to start a new match, track scores, and monitor team performance.
          </p>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {sportsOptions.map((sport) => (
            <button
              key={sport.id}
              onClick={() => handleSportSelect(sport.id)}
              className={`p-4 md:p-6 rounded-[32px] glass-panel bg-white/60 flex flex-col items-center justify-center text-center transition-all group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,255,0.08)] ${
                selectedSport === sport.id ? 'ring-4 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.02]'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${sport.bg} ${sport.color} shadow-sm border border-white`}>
                {sport.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{sport.name}</h3>
              <div className={`w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center transition-all duration-300 ${
                selectedSport === sport.id ? 'opacity-100 translate-y-0 text-blue-600' : 'opacity-0 translate-y-2 text-blue-400 group-hover:opacity-100 group-hover:translate-y-0'
              }`}>
                <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-4 md:mt-6 md:mt-12 text-center p-4 md:p-6 rounded-2xl md:rounded-3xl glass-panel bg-gradient-to-r from-blue-50 to-indigo-50 border border-white/60">
          <p className="text-sm font-semibold text-blue-700 flex items-center justify-center gap-2">
            <Trophy size={16} />
            Matches you create will automatically appear on the Live Scoreboard.
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default CreateMatch;

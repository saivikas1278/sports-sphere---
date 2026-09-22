import React from 'react';
import { MapPin, Clock } from 'lucide-react';

const StandardMatchCard = ({ image, sport, title, location, time, onBook, actionText = 'Book Now' }) => {
  return (
    <div className="p-4 rounded-[32px] glass-panel overflow-hidden flex flex-col gap-4 transition-transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,255,0.08)]">
      {/* Image Container */}
      <div className="w-full h-40 rounded-2xl overflow-hidden relative">
        <img 
          src={image || 'https://via.placeholder.com/400x200?text=Sports+Match'} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/70 backdrop-blur-md rounded-full text-xs font-semibold text-slate-800 shadow-sm">
          {sport}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-blue-500 shrink-0" />
            <span className="truncate max-w-[120px]">{location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-blue-500 shrink-0" />
            <span>{time}</span>
          </div>
        </div>
      </div>
      
      {/* Action */}
      <button 
        onClick={onBook}
        className="mt-2 w-full py-3 rounded-full bg-blue-500 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] transition-all hover:scale-[1.02] hover:bg-blue-600 active:scale-[0.98]"
      >
        {actionText}
      </button>
    </div>
  );
};

export default StandardMatchCard;

import React, { useState } from 'react';

const InteractiveCalendarGrid = ({ 
  dates = [], // e.g. [{ date: 1, day: 'Mon', fullDate: '2025-09-01' }, ...]
  onSelectDate 
}) => {
  const [selectedDate, setSelectedDate] = useState(dates[0]?.fullDate || null);

  const handleSelect = (fullDate) => {
    setSelectedDate(fullDate);
    if (onSelectDate) onSelectDate(fullDate);
  };

  // If no dates provided, generate a generic 7-day view for demo purposes
  const displayDates = dates.length > 0 ? dates : Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.getDate(),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: d.toISOString().split('T')[0]
    };
  });

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-4">
      <div className="flex items-center gap-3 px-4 w-max">
        {displayDates.map((item) => {
          const isActive = selectedDate === item.fullDate;
          
          return (
            <button
              key={item.fullDate}
              onClick={() => handleSelect(item.fullDate)}
              className={`flex flex-col items-center justify-center min-w-[4rem] h-[5rem] rounded-2xl md:rounded-3xl transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-500 text-white shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] scale-105' 
                  : 'glass-panel text-slate-700 hover:bg-white/80 hover:-translate-y-1'
              }`}
            >
              <span className={`text-xs font-medium mb-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                {item.day}
              </span>
              <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {item.date}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveCalendarGrid;

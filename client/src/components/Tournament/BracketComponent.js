import React from 'react';
import { Trophy } from 'lucide-react';

const MatchNode = ({ match }) => {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live' || match.status === 'in_progress';
  const homeTeam = match.homeTeam || { name: 'TBD' };
  const awayTeam = match.awayTeam || { name: 'TBD' };
  
  const winnerId = match.result?.winner?._id || match.result?.winner;
  const homeWinner = isCompleted && (
    match.result?.winner === 'home' ||
    (winnerId && String(winnerId) === String(homeTeam?._id || homeTeam?.id)) ||
    (match.score?.home > match.score?.away && match.result?.winner !== 'away')
  );
  const awayWinner = isCompleted && (
    match.result?.winner === 'away' ||
    (winnerId && String(winnerId) === String(awayTeam?._id || awayTeam?.id)) ||
    (match.score?.away > match.score?.home && match.result?.winner !== 'home')
  );

  const homeScore = match.score?.home ?? match.result?.homeScore ?? (isCompleted || isLive ? 0 : '-');
  const awayScore = match.score?.away ?? match.result?.awayScore ?? (isCompleted || isLive ? 0 : '-');

  return (
    <div className={`flex flex-col w-52 bg-white/90 border rounded-2xl shadow-sm overflow-hidden text-sm my-2 relative z-10 glass-panel transition-all duration-300 hover:shadow-md ${
      isLive ? 'border-red-400 ring-2 ring-red-400/30' : isCompleted ? 'border-emerald-300/80' : 'border-slate-200'
    }`}>
      {/* Status Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider">
        <span className="text-slate-500 truncate max-w-[120px]">{match.roundName || `Match ${match.position !== undefined ? match.position + 1 : ''}`}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-red-600 font-extrabold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> LIVE
          </span>
        )}
        {isCompleted && (
          <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
            <Trophy size={10} className="text-amber-500" /> FINAL
          </span>
        )}
        {!isLive && !isCompleted && (
          <span className="text-slate-400 font-medium">UPCOMING</span>
        )}
      </div>

      {/* Home Team */}
      <div className={`flex justify-between items-center p-2.5 border-b border-slate-100 transition-colors ${
        homeWinner ? 'bg-emerald-50/80 font-bold text-slate-900' : 'text-slate-700'
      }`}>
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 text-[10px] font-black text-blue-700">
            {homeTeam.logo ? (
              <img src={homeTeam.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              homeTeam.name?.substring(0, 2).toUpperCase() || 'TB'
            )}
          </div>
          <span className="truncate text-xs font-semibold">
            {homeTeam.name || 'TBD'}
          </span>
        </div>
        {(isCompleted || isLive) && (
          <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded ${
            homeWinner ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-700'
          }`}>
            {homeScore}
          </span>
        )}
      </div>
      
      {/* Away Team */}
      <div className={`flex justify-between items-center p-2.5 transition-colors ${
        awayWinner ? 'bg-emerald-50/80 font-bold text-slate-900' : 'text-slate-700'
      }`}>
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 text-[10px] font-black text-purple-700">
            {awayTeam.logo ? (
              <img src={awayTeam.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              awayTeam.name?.substring(0, 2).toUpperCase() || 'TB'
            )}
          </div>
          <span className="truncate text-xs font-semibold">
            {awayTeam.name || 'TBD'}
          </span>
        </div>
        {(isCompleted || isLive) && (
          <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded ${
            awayWinner ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-700'
          }`}>
            {awayScore}
          </span>
        )}
      </div>
    </div>
  );
};

const BracketComponent = ({ bracket, matches = [] }) => {
  const isRoundRobin = bracket?.format === 'round-robin' || matches.some(m => m.round === 'round-robin');

  if (isRoundRobin && matches.length > 0) {
    return (
      <div className="p-4 md:p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-white/80 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Round Robin Group Schedule</h3>
            <p className="text-xs text-slate-500 font-medium">Every team plays every other team in the group.</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full uppercase">
            {matches.length} Total Matches
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <div key={match._id || match.id} className="flex justify-center">
              <MatchNode match={match} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center text-slate-500 glass-panel bg-white/40 rounded-3xl border border-white/60">
        <Trophy className="mx-auto text-slate-300 mb-3" size={40} />
        <p className="font-bold text-base text-slate-700">Tournament Bracket Inactive</p>
        <p className="text-sm mt-1 text-slate-500">The bracket tree will be displayed as soon as tournament seeding and matches are initialized.</p>
      </div>
    );
  }

  // Organize matches by round Name or round number
  const roundColumns = bracket.rounds.map((roundInfo) => {
    let roundMatches = matches.filter(m => {
      if (m.round === roundInfo.name || m.roundName === roundInfo.name) return true;
      if (m.round !== undefined && String(m.round) === String(roundInfo.round)) return true;
      if (roundInfo.name && m.roundName) {
        const cleanA = roundInfo.name.toLowerCase().replace(/s$/, '').trim();
        const cleanB = m.roundName.toLowerCase().replace(/s$/, '').trim();
        if (cleanA === cleanB) return true;
      }
      return false;
    });

    // Sort by position or matchNumber
    roundMatches.sort((a, b) => {
      const posA = a.position !== undefined ? a.position : a.matchNumber || 0;
      const posB = b.position !== undefined ? b.position : b.matchNumber || 0;
      return posA - posB;
    });

    // Pad with placeholders if bracket rounds have more matches than scheduled
    const displayMatches = [...roundMatches];
    const expectedCount = roundInfo.matches || Math.max(displayMatches.length, 1);
    while (displayMatches.length < expectedCount) {
      displayMatches.push({
        _id: `placeholder-${roundInfo.round || 1}-${displayMatches.length}`,
        status: 'scheduled',
        roundName: roundInfo.name,
        homeTeam: { name: 'TBD' },
        awayTeam: { name: 'TBD' },
        score: { home: 0, away: 0 }
      });
    }

    return {
      ...roundInfo,
      matchList: displayMatches
    };
  });

  return (
    <div className="overflow-x-auto pb-6 relative pt-2 scrollbar-thin">
      <div className="flex justify-start items-stretch min-w-max px-2">
        {roundColumns.map((col, colIndex) => (
          <div key={col.round || colIndex} className="flex flex-col mx-3 sm:mx-5" style={{ width: '220px' }}>
            <div className="text-center pb-3 mb-2 border-b border-slate-200/60 sticky left-0">
              <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                {col.name}
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">
                {col.matchList.length} {col.matchList.length === 1 ? 'Match' : 'Matches'}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-around relative py-2">
              {col.matchList.map((match, matchIndex) => (
                <div key={match._id} className="relative flex items-center justify-center my-3">
                  <MatchNode match={match} />
                  
                  {/* Connectors to next round (only when next round exists) */}
                  {colIndex < roundColumns.length - 1 && (
                    <div className="hidden sm:block absolute left-[100%] top-1/2 w-6 h-[2px] bg-slate-300/80 z-0" />
                  )}
                  {/* Connector from prev round */}
                  {colIndex > 0 && (
                    <div className="hidden sm:block absolute right-[100%] top-1/2 w-6 h-[2px] bg-slate-300/80 z-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BracketComponent;

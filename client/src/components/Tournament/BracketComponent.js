import React from 'react';

const MatchNode = ({ match }) => {
  const isCompleted = match.status === 'completed';
  const homeTeam = match.homeTeam || { name: 'TBD' };
  const awayTeam = match.awayTeam || { name: 'TBD' };
  
  let homeWinner = false;
  let awayWinner = false;
  
  if (isCompleted && match.result) {
    if (match.result.winner === 'home') homeWinner = true;
    if (match.result.winner === 'away') awayWinner = true;
  }

  return (
    <div className="flex flex-col w-48 bg-white/70 border border-white/60 rounded-xl shadow-sm overflow-hidden text-sm my-2 relative z-10 glass-panel">
      {/* Home Team */}
      <div className={`flex justify-between items-center p-2 border-b border-slate-200/50 ${homeWinner ? 'bg-blue-50/50' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {homeTeam.logo ? (
              <img src={homeTeam.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-slate-500">{homeTeam.name?.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className={`truncate ${homeWinner ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
            {homeTeam.name}
          </span>
        </div>
        {isCompleted && (
          <span className={`font-mono font-bold ${homeWinner ? 'text-blue-600' : 'text-slate-500'}`}>
            {match.result?.homeScore || 0}
          </span>
        )}
      </div>
      
      {/* Away Team */}
      <div className={`flex justify-between items-center p-2 ${awayWinner ? 'bg-blue-50/50' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {awayTeam.logo ? (
              <img src={awayTeam.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-slate-500">{awayTeam.name?.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className={`truncate ${awayWinner ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
            {awayTeam.name}
          </span>
        </div>
        {isCompleted && (
          <span className={`font-mono font-bold ${awayWinner ? 'text-blue-600' : 'text-slate-500'}`}>
            {match.result?.awayScore || 0}
          </span>
        )}
      </div>
    </div>
  );
};

const BracketComponent = ({ bracket, matches }) => {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center text-slate-500 glass-panel bg-white/40 rounded-2xl">
        <p className="font-semibold">Bracket generation pending.</p>
        <p className="text-sm mt-1">Bracket will be visible once the tournament starts.</p>
      </div>
    );
  }

  // Organize matches by round Name
  const roundColumns = bracket.rounds.map((roundInfo) => {
    // Try to find matches matching this round name
    let roundMatches = matches.filter(m => m.round === roundInfo.name);
    
    // Fallback logic if names don't exactly match but round number matches
    if (roundMatches.length === 0) {
      // Assuming matches can be inferred if they have matchNumber or sequence
      // This is highly dependent on backend logic. For now, if empty, we map empty placeholders
    }

    // Pad with placeholders if backend hasn't generated them yet
    const displayMatches = [...roundMatches];
    while (displayMatches.length < roundInfo.matches) {
      displayMatches.push({
        _id: `placeholder-${roundInfo.round}-${displayMatches.length}`,
        status: 'pending',
        homeTeam: { name: 'TBD' },
        awayTeam: { name: 'TBD' }
      });
    }

    return {
      ...roundInfo,
      matchList: displayMatches
    };
  });

  return (
    <div className="overflow-x-auto pb-4 md:pb-8 relative pt-4">
      <div className="flex justify-start min-w-max">
        {roundColumns.map((col, colIndex) => (
          <div key={col.round} className="flex flex-col mx-4" style={{ width: '200px' }}>
            <h3 className="text-center font-bold text-slate-700 mb-4 md:mb-6 uppercase tracking-wider text-sm sticky left-0">
              {col.name}
            </h3>
            
            <div className="flex-1 flex flex-col justify-around relative">
              {col.matchList.map((match, matchIndex) => (
                <div key={match._id} className="relative flex items-center h-full my-2">
                  <MatchNode match={match} />
                  
                  {/* Connectors to next round */}
                  {colIndex < roundColumns.length - 1 && (
                    <div className="absolute left-[100%] top-1/2 w-8 h-[2px] bg-slate-300">
                      {matchIndex % 2 === 0 ? (
                        <div className="absolute right-0 top-0 w-[2px] bg-slate-300" style={{ height: 'calc(50% + 2rem)' }} />
                      ) : (
                        <div className="absolute right-0 bottom-0 w-[2px] bg-slate-300" style={{ height: 'calc(50% + 2rem)' }} />
                      )}
                    </div>
                  )}
                  {/* Connector from prev round */}
                  {colIndex > 0 && (
                    <div className="absolute right-[100%] top-1/2 w-8 h-[2px] bg-slate-300" />
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

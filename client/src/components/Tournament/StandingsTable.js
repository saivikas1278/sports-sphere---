import React from 'react';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const StandingsTable = ({ standings }) => {
  if (!standings || standings.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center text-slate-500 glass-panel bg-white/40 rounded-2xl">
        <Trophy className="mx-auto mb-3 text-slate-400" size={32} />
        <p className="font-semibold">No standings available yet.</p>
        <p className="text-sm mt-1">Standings will be generated once matches are completed.</p>
      </div>
    );
  }

  // Sort standings by points, then goal difference
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = (a.for || a.goalsFor || 0) - (a.against || a.goalsAgainst || 0);
    const gdB = (b.for || b.goalsFor || 0) - (b.against || b.goalsAgainst || 0);
    return gdB - gdA;
  });

  return (
    <div className="overflow-x-auto rounded-[24px] glass-panel bg-white/60 border border-white/60 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100/50 text-slate-600 border-b border-slate-200/50">
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-16">Pos</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase">Team</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-16">P</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-16 text-green-600">W</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-16 text-slate-400">D</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-16 text-red-500">L</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-16 md:w-24">GD</th>
            <th className="p-4 font-bold text-sm tracking-wider uppercase text-center w-12 md:w-20 text-blue-600">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/40">
          {sortedStandings.map((teamStats, index) => {
            const team = teamStats.team;
            const played = teamStats.played || 0;
            const won = teamStats.won || 0;
            const drawn = teamStats.drawn || 0;
            const lost = teamStats.lost || 0;
            const points = teamStats.points || 0;
            const goalsFor = teamStats.for || teamStats.goalsFor || 0;
            const goalsAgainst = teamStats.against || teamStats.goalsAgainst || 0;
            const gd = goalsFor - goalsAgainst;

            // Trend indicator (mocked based on position for now, normally would compare with previous matchweek)
            let TrendIcon = Minus;
            let trendColor = 'text-slate-400';
            if (index < 3) { TrendIcon = ArrowUp; trendColor = 'text-green-500'; }
            if (index > sortedStandings.length - 3) { TrendIcon = ArrowDown; trendColor = 'text-red-500'; }

            return (
              <tr 
                key={team._id || index} 
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="p-4 text-center font-bold text-slate-700">
                  <div className="flex items-center justify-center gap-1">
                    {index + 1}
                    <TrendIcon size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${trendColor}`} />
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {team.name ? team.name.substring(0, 2).toUpperCase() : '??'}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-800">{team.name || 'Unknown Team'}</span>
                  </div>
                </td>
                <td className="p-4 text-center font-medium text-slate-600">{played}</td>
                <td className="p-4 text-center font-medium text-slate-600">{won}</td>
                <td className="p-4 text-center font-medium text-slate-400">{drawn}</td>
                <td className="p-4 text-center font-medium text-slate-600">{lost}</td>
                <td className="p-4 text-center font-medium text-slate-600">
                  <span className={gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-500' : ''}>
                    {gd > 0 ? `+${gd}` : gd}
                  </span>
                </td>
                <td className="p-4 text-center font-black text-blue-600 text-lg">{points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable;

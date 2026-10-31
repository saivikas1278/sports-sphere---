import React, { useState } from 'react';
import { Trophy, Share2, Copy, Check, X, MapPin, Calendar, Award } from 'lucide-react';

const MatchdayStoryCard = ({ isOpen, onClose, match }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !match) return null;

  const team1Name = match.teams?.team1?.name || match.homeTeam?.name || 'Home Team';
  const team2Name = match.teams?.team2?.name || match.awayTeam?.name || 'Away Team';
  const score1 = match.teams?.team1?.score ?? match.score?.home ?? 0;
  const score2 = match.teams?.team2?.score ?? match.score?.away ?? 0;
  const sport = (match.sport || match.tournament?.sport || 'Sports').toUpperCase();
  const tournamentName = match.tournament?.name || 'Championship Match';
  const venue = typeof match.venue === 'object' ? match.venue?.name : (match.venue || 'Sports Arena');
  const winnerName = match.result?.winner === 'home' || match.result?.winner === match.homeTeam?._id
    ? team1Name
    : match.result?.winner === 'away' || match.result?.winner === match.awayTeam?._id
    ? team2Name
    : match.result?.details || null;

  const handleCopySummary = () => {
    const summary = `🏆 ${tournamentName} [${sport}]\n⚔️ ${team1Name} (${score1}) vs ${team2Name} (${score2})\n✨ Winner: ${winnerName || 'Match Completed'}\n📍 Venue: ${venue}\n⚡ Followed live on SportSphere: ${window.location.href}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col p-6 space-y-6">
        {/* Top Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-black text-[10px] tracking-widest uppercase">
              {sport} MATCHDAY
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tournament Title */}
        <div className="text-center space-y-1">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Official Tournament</h4>
          <h3 className="text-xl font-black tracking-tight text-white line-clamp-1">{tournamentName}</h3>
        </div>

        {/* Story Card Body (9:16 Aspect Visual) */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-5 flex flex-col items-center justify-center space-y-5 relative overflow-hidden backdrop-blur-sm">
          {/* Subtle athletic backdrop glows */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Team 1 */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white/40 flex items-center justify-center font-black text-xl shadow-lg">
              {team1Name.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-extrabold text-base tracking-tight text-white mt-1 max-w-[180px] truncate">{team1Name}</span>
            <span className="font-black text-3xl tracking-tight text-blue-300">{score1}</span>
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3 w-full justify-center">
            <div className="h-[1px] bg-white/10 flex-1"></div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/60 px-3 py-0.5 rounded-full border border-white/10">VS</span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="font-black text-3xl tracking-tight text-indigo-300">{score2}</span>
            <span className="font-extrabold text-base tracking-tight text-white max-w-[180px] truncate">{team2Name}</span>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/40 flex items-center justify-center font-black text-xl shadow-lg mt-1">
              {team2Name.substring(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Winner Banner */}
          {winnerName && (
            <div className="w-full mt-2 py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 flex items-center justify-center gap-2 text-amber-300 font-extrabold text-xs">
              <Trophy size={14} className="text-amber-400 flex-shrink-0" />
              <span className="truncate">{winnerName} Victorious</span>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
          <span className="flex items-center gap-1 truncate max-w-[140px]">
            <MapPin size={12} className="text-blue-400" /> {venue}
          </span>
          {match.date && (
            <span className="flex items-center gap-1 text-slate-300">
              <Calendar size={12} className="text-cyan-400" /> {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="flex items-center gap-1 font-bold text-slate-300">
            <Award size={12} className="text-indigo-400" /> SportSphere
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleCopySummary}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Copied Summary!' : 'Copy Summary'}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${team1Name} vs ${team2Name} - ${tournamentName}`,
                  text: `Match Result: ${team1Name} (${score1}) vs ${team2Name} (${score2})!`,
                  url: window.location.href
                }).catch(() => {});
              } else {
                handleCopySummary();
              }
            }}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95 text-white"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchdayStoryCard;

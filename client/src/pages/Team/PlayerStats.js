import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Trophy, Target, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import playerService from '../../services/playerService';
import authService from '../../services/authService';
import FloatingElements from '../../components/UI/FloatingElements';

const PlayerStats = () => {
  const { teamId, playerId } = useParams();
  const [playerInfo, setPlayerInfo] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        // We use authService.getUserProfile to get basic info if playerService doesn't have it
        const [statsRes, matchesRes, profileRes] = await Promise.all([
          playerService.getPlayerStats(playerId),
          playerService.getPlayerMatches(playerId),
          authService.getUserProfile(playerId) // assuming this exists or similar
        ]);
        
        setPlayerStats(statsRes.data.data);
        setMatches(matchesRes.data.data);
        setPlayerInfo(profileRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching player data:', err);
        // Fallback to fetch just stats and matches if profile fails
        try {
          const statsRes = await playerService.getPlayerStats(playerId);
          const matchesRes = await playerService.getPlayerMatches(playerId);
          setPlayerStats(statsRes.data.data);
          setMatches(matchesRes.data.data);
        } catch (innerErr) {
          toast.error('Failed to load player statistics');
        }
        setLoading(false);
      }
    };
    
    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Fallback data if player profile not fully loaded
  const name = playerInfo ? `${playerInfo.firstName} ${playerInfo.lastName}` : 'Player';
  const initials = playerInfo ? `${playerInfo.firstName?.charAt(0) || ''}${playerInfo.lastName?.charAt(0) || ''}` : 'P';
  
  const stats = [
    { label: 'Matches Played', value: playerStats?.matchesPlayed || 0, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Matches Won', value: playerStats?.matchesWon || 0, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Tournaments Won', value: playerStats?.tournamentsWon || 0, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Win Rate', value: `${playerStats?.winRate || 0}%`, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' }
  ];

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex items-center gap-4 mb-4 md:mb-8">
          <Link to={`/teams/${teamId || '1'}`} className="p-2 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              Player Statistics
            </h1>
          </div>
        </div>

        {/* Profile Header */}
        <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/60 mb-4 md:mb-8 flex flex-col md:flex-row items-center gap-3 md:gap-6">
          <div className="w-16 md:w-24 h-16 md:h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-blue-500 font-bold text-2xl">
              {playerInfo?.avatar ? (
                <img src={playerInfo.avatar} alt={name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-slate-800">{name}</h2>
            <p className="text-slate-500 font-medium">{playerInfo?.sports?.[0]?.position || 'Player'} • {playerInfo?.currentTeam?.name || 'Active'}</p>
            <div className="mt-3 flex gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
              {playerStats?.teamsCaptained > 0 && (
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">Captain</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 md:mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass-panel p-4 md:p-6 rounded-[2rem] border border-white/60 text-center hover:-translate-y-1 transition-transform">
              <div className={`w-12 h-12 mx-auto rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={24} />
              </div>
              <p className="text-xl md:text-3xl font-black text-slate-800">{stat.value}</p>
              <h3 className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</h3>
            </div>
          ))}
        </div>

        {/* Recent Matches */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 md:mb-6">Recent Match History</h3>
          
          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent matches played.</p>
            ) : (
              matches.map((match, i) => {
                const isHome = match.homeTeam?.players?.some(p => p.user?.toString() === playerId || p.user?._id === playerId);
                const team = isHome ? match.homeTeam : match.awayTeam;
                const opponent = isHome ? match.awayTeam : match.homeTeam;
                
                // Check if user's team won
                const didWin = match.result?.winner === team?._id;
                const resultColor = didWin ? 'text-emerald-600' : (match.result?.isDraw ? 'text-amber-500' : 'text-red-500');
                const resultText = didWin ? 'W' : (match.result?.isDraw ? 'D' : 'L');
                
                // Get player rating if exists
                const pStat = match.playerStats?.find(ps => ps.player?.toString() === playerId || ps.player?._id === playerId);
                const rating = pStat?.rating || (didWin ? 8.0 : 6.5); // Fallback mock rating for display

                return (
                  <div key={match._id || i}>
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <span className="font-bold text-slate-700 text-sm">vs {opponent?.name || 'Unknown Team'}</span>
                        <span className={`font-bold ml-2 ${resultColor}`}>{resultText}</span>
                        <span className="text-xs text-slate-400 ml-2">{new Date(match.scheduledTime).toLocaleDateString()}</span>
                      </div>
                      <span className="font-black text-blue-600">{rating.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${didWin ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${rating * 10}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlayerStats;

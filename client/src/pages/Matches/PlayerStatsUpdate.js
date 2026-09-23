import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-form-hook';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Activity } from 'lucide-react';
import matchService from '../../services/matchService';
import playerService from '../../services/playerService';
import FloatingElements from '../../components/UI/FloatingElements';
import Button from '../../components/UI/Button';

const PlayerStatsUpdate = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use state to manage stats for players
  const [playerStats, setPlayerStats] = useState([]);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        const matchData = res.data.data;
        setMatch(matchData);
        
        // Initialize player stats from existing data or create new
        if (matchData.playerStats && matchData.playerStats.length > 0) {
          setPlayerStats(matchData.playerStats);
        } else {
          // Scaffold default stats for all players in both teams
          const initialStats = [];
          
          matchData.homeTeam?.players?.forEach(p => {
            initialStats.push({
              player: p.user?._id || p.user,
              team: 'home',
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0,
              minutesPlayed: 0,
              rating: 0
            });
          });
          
          matchData.awayTeam?.players?.forEach(p => {
            initialStats.push({
              player: p.user?._id || p.user,
              team: 'away',
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0,
              minutesPlayed: 0,
              rating: 0
            });
          });
          
          setPlayerStats(initialStats);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching match:', err);
        toast.error('Failed to load match details');
        setLoading(false);
      }
    };
    
    fetchMatch();
  }, [matchId]);

  const handleStatChange = (playerId, field, value) => {
    setPlayerStats(prevStats => 
      prevStats.map(stat => 
        stat.player === playerId ? { ...stat, [field]: Number(value) } : stat
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await playerService.updateMatchPlayerStats(matchId, { playerStats });
      toast.success('Player statistics updated successfully');
      navigate(`/matches/${matchId}`);
    } catch (err) {
      console.error('Error updating player stats:', err);
      toast.error(err.response?.data?.error || 'Failed to update player stats');
    }
  };

  const getPlayerName = (playerId, teamType) => {
    const team = teamType === 'home' ? match.homeTeam : match.awayTeam;
    const playerObj = team?.players?.find(p => (p.user?._id || p.user) === playerId);
    if (!playerObj?.user) return 'Unknown Player';
    return `${playerObj.user.firstName} ${playerObj.user.lastName}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!match) {
    return <div className="min-h-screen flex items-center justify-center">Match not found</div>;
  }

  return (
    <div className="min-h-screen relative pt-24 pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <Activity className="text-blue-500" /> Update Player Statistics
            </h1>
            <p className="text-slate-500">{match.homeTeam?.name} vs {match.awayTeam?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Home Team Stats */}
          <div className="glass-panel p-6 rounded-3xl border border-white/60">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              {match.homeTeam?.name} Players
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="pb-3 pr-4 font-bold">Player</th>
                    <th className="pb-3 px-2 font-bold text-center">Goals</th>
                    <th className="pb-3 px-2 font-bold text-center">Assists</th>
                    <th className="pb-3 px-2 font-bold text-center text-amber-500">Y. Cards</th>
                    <th className="pb-3 px-2 font-bold text-center text-red-500">R. Cards</th>
                    <th className="pb-3 px-2 font-bold text-center">Mins</th>
                    <th className="pb-3 pl-2 font-bold text-center">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.filter(s => s.team === 'home').map(stat => (
                    <tr key={stat.player} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-medium text-slate-700">{getPlayerName(stat.player, 'home')}</td>
                      <td className="py-3 px-2"><input type="number" min="0" value={stat.goals} onChange={(e) => handleStatChange(stat.player, 'goals', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" value={stat.assists} onChange={(e) => handleStatChange(stat.player, 'assists', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" max="2" value={stat.yellowCards} onChange={(e) => handleStatChange(stat.player, 'yellowCards', e.target.value)} className="w-16 p-2 rounded-lg border border-amber-200 text-center focus:ring-2 focus:ring-amber-500 mx-auto block bg-amber-50" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" max="1" value={stat.redCards} onChange={(e) => handleStatChange(stat.player, 'redCards', e.target.value)} className="w-16 p-2 rounded-lg border border-red-200 text-center focus:ring-2 focus:ring-red-500 mx-auto block bg-red-50" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" value={stat.minutesPlayed} onChange={(e) => handleStatChange(stat.player, 'minutesPlayed', e.target.value)} className="w-20 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                      <td className="py-3 pl-2"><input type="number" min="0" max="10" step="0.1" value={stat.rating} onChange={(e) => handleStatChange(stat.player, 'rating', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Away Team Stats */}
          <div className="glass-panel p-6 rounded-3xl border border-white/60">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              {match.awayTeam?.name} Players
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="pb-3 pr-4 font-bold">Player</th>
                    <th className="pb-3 px-2 font-bold text-center">Goals</th>
                    <th className="pb-3 px-2 font-bold text-center">Assists</th>
                    <th className="pb-3 px-2 font-bold text-center text-amber-500">Y. Cards</th>
                    <th className="pb-3 px-2 font-bold text-center text-red-500">R. Cards</th>
                    <th className="pb-3 px-2 font-bold text-center">Mins</th>
                    <th className="pb-3 pl-2 font-bold text-center">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.filter(s => s.team === 'away').map(stat => (
                    <tr key={stat.player} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 font-medium text-slate-700">{getPlayerName(stat.player, 'away')}</td>
                      <td className="py-3 px-2"><input type="number" min="0" value={stat.goals} onChange={(e) => handleStatChange(stat.player, 'goals', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" value={stat.assists} onChange={(e) => handleStatChange(stat.player, 'assists', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" max="2" value={stat.yellowCards} onChange={(e) => handleStatChange(stat.player, 'yellowCards', e.target.value)} className="w-16 p-2 rounded-lg border border-amber-200 text-center focus:ring-2 focus:ring-amber-500 mx-auto block bg-amber-50" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" max="1" value={stat.redCards} onChange={(e) => handleStatChange(stat.player, 'redCards', e.target.value)} className="w-16 p-2 rounded-lg border border-red-200 text-center focus:ring-2 focus:ring-red-500 mx-auto block bg-red-50" /></td>
                      <td className="py-3 px-2"><input type="number" min="0" value={stat.minutesPlayed} onChange={(e) => handleStatChange(stat.player, 'minutesPlayed', e.target.value)} className="w-20 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                      <td className="py-3 pl-2"><input type="number" min="0" max="10" step="0.1" value={stat.rating} onChange={(e) => handleStatChange(stat.player, 'rating', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-blue-500 mx-auto block" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" className="flex items-center gap-2 px-8 py-3 rounded-full text-base font-bold shadow-lg shadow-blue-500/30">
              <Save size={20} />
              Save Player Statistics
            </Button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default PlayerStatsUpdate;
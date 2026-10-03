import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Trophy } from 'lucide-react';
import tournamentService from '../../services/tournamentService';
import { fetchTournamentSchedule } from '../../redux/slices/tournamentSlice';

const PointsScoringConsole = ({ match, tournamentId }) => {
  const dispatch = useDispatch();
  
  // Local state for optimistic UI updates
  const [setsData, setSetsData] = useState(match?.setsData || {
    sets: [{ homeScore: 0, awayScore: 0 }],
    currentSet: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match?.setsData) {
      setSetsData(match.setsData);
    }
  }, [match]);

  const currentSetData = setsData.sets[setsData.currentSet - 1] || { homeScore: 0, awayScore: 0 };

  const handleScoreAction = async (actionData) => {
    setLoading(true);
    try {
      // Re-using the same endpoint logic or we can assume it hits the generic score endpoint
      // if we haven't built a specific sets one. For now, we'll use a generic PUT score endpoint:
      const response = await tournamentService.updateMatchScore(tournamentId, match._id, {
        home: currentSetData.homeScore + (actionData.team === 'home' ? actionData.value : 0),
        away: currentSetData.awayScore + (actionData.team === 'away' ? actionData.value : 0),
        setsData: {
          ...setsData,
          sets: setsData.sets.map((s, i) => 
            i === setsData.currentSet - 1 
              ? { 
                  homeScore: s.homeScore + (actionData.team === 'home' ? actionData.value : 0),
                  awayScore: s.awayScore + (actionData.team === 'away' ? actionData.value : 0)
                } 
              : s
          )
        }
      });
      
      if (response.success) {
        setSetsData(response.data.setsData || response.data.match?.setsData);
        dispatch(fetchTournamentSchedule(tournamentId));
      }
    } catch (error) {
      console.error('Error updating points score:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl w-full max-w-2xl mx-auto my-6">
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {match?.homeTeam?.name || 'Home'} <span className="text-slate-400 font-medium">vs</span> {match?.awayTeam?.name || 'Away'}
          </h2>
          <p className="text-sm font-bold text-green-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            <Trophy size={14} /> Points Scoring (Set {setsData.currentSet})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Home Team */}
        <div className="flex flex-col items-center p-6 bg-slate-50/50 rounded-3xl border border-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <h3 className="font-bold text-lg text-slate-600 uppercase tracking-wider mb-2">
            {match?.homeTeam?.name || 'Home'}
          </h3>
          <div className="text-7xl font-black text-slate-800 my-4">
            {currentSetData.homeScore}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleScoreAction({ team: 'home', value: -1 })}
              disabled={loading || currentSetData.homeScore === 0}
              className="w-12 h-12 rounded-full font-bold text-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              -
            </button>
            <button
              onClick={() => handleScoreAction({ team: 'home', value: 1 })}
              disabled={loading}
              className="w-16 h-12 rounded-2xl font-black text-xl bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition-all shadow-sm"
            >
              +1
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center p-6 bg-slate-50/50 rounded-3xl border border-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <h3 className="font-bold text-lg text-slate-600 uppercase tracking-wider mb-2">
            {match?.awayTeam?.name || 'Away'}
          </h3>
          <div className="text-7xl font-black text-slate-800 my-4">
            {currentSetData.awayScore}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleScoreAction({ team: 'away', value: -1 })}
              disabled={loading || currentSetData.awayScore === 0}
              className="w-12 h-12 rounded-full font-bold text-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              -
            </button>
            <button
              onClick={() => handleScoreAction({ team: 'away', value: 1 })}
              disabled={loading}
              className="w-16 h-12 rounded-2xl font-black text-xl bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-all shadow-sm"
            >
              +1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsScoringConsole;

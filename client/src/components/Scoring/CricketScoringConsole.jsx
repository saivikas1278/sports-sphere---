import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RotateCcw, Activity } from 'lucide-react';
import tournamentService from '../../services/tournamentService';
import { fetchTournamentSchedule } from '../../redux/slices/tournamentSlice';

const CricketScoringConsole = ({ match, tournamentId }) => {
  const dispatch = useDispatch();
  
  // Local state for optimistic UI updates
  const [cricketData, setCricketData] = useState(match?.cricketData || {
    innings: [
      { team: match?.homeTeam?._id, runs: 0, wickets: 0, overs: 0, balls: 0 },
      { team: match?.awayTeam?._id, runs: 0, wickets: 0, overs: 0, balls: 0 }
    ],
    recentBalls: []
  });
  const [loading, setLoading] = useState(false);

  // Sync if match prop changes externally
  useEffect(() => {
    if (match?.cricketData) {
      setCricketData(match.cricketData);
    }
  }, [match]);

  const activeInningIndex = 0; // Simplified for now; assume home team bats first
  const activeInning = cricketData.innings[activeInningIndex];
  
  const handleScoreAction = async (actionData) => {
    setLoading(true);
    try {
      // API call to the newly created endpoint
      const response = await tournamentService.updateCricketBall(tournamentId, match._id, actionData);
      
      if (response.success) {
        setCricketData(response.data.cricketData);
        // Refresh the Redux state to trigger wider UI updates (like Bracket Tree)
        dispatch(fetchTournamentSchedule(tournamentId));
      }
    } catch (error) {
      console.error('Error updating cricket score:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl w-full max-w-2xl mx-auto my-6">
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {match?.homeTeam?.name || 'Home'} <span className="text-slate-400 font-medium">vs</span> {match?.awayTeam?.name || 'Away'}
          </h2>
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-1">Cricket Scoring Panel</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-blue-600">
            {activeInning.runs}/{activeInning.wickets}
          </div>
          <div className="text-sm font-bold text-slate-500">
            {activeInning.overs}.{activeInning.balls} Overs
          </div>
        </div>
      </div>

      {/* Timeline of recent balls */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Activity size={14} /> Recent Deliveries
        </h3>
        <div className="flex gap-2 items-center min-h-[40px] bg-slate-100/50 p-2 rounded-xl border border-slate-200/50">
          {cricketData.recentBalls.length === 0 ? (
            <span className="text-sm text-slate-400 italic px-2">No deliveries yet...</span>
          ) : (
            cricketData.recentBalls.map((ball, i) => (
              <div 
                key={i} 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                  ${ball === 'W' ? 'bg-red-500 text-white' : 
                    ball === '4' || ball === '6' ? 'bg-green-500 text-white' : 
                    ball === 'Wd' || ball === 'Nb' ? 'bg-amber-400 text-white' : 
                    'bg-white text-slate-700 border border-slate-200'}`}
              >
                {ball}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Pad */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[0, 1, 2, 3, 4, 6].map(runs => (
          <button
            key={runs}
            onClick={() => handleScoreAction({ action: 'score', runs, teamId: activeInning.team })}
            disabled={loading}
            className={`py-4 rounded-2xl font-black text-xl transition-all shadow-sm
              ${runs === 4 || runs === 6 ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
          >
            {runs}
          </button>
        ))}
        <button
          onClick={() => handleScoreAction({ action: 'wicket', isWicket: true, teamId: activeInning.team })}
          disabled={loading}
          className="col-span-2 py-4 rounded-2xl font-black text-xl bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 shadow-sm transition-all"
        >
          WICKET
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => handleScoreAction({ action: 'extra', isWide: true, teamId: activeInning.team })}
          disabled={loading}
          className="py-3 rounded-xl font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all"
        >
          Wide (Wd)
        </button>
        <button
          onClick={() => handleScoreAction({ action: 'extra', isNoBall: true, teamId: activeInning.team })}
          disabled={loading}
          className="py-3 rounded-xl font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all"
        >
          No Ball (Nb)
        </button>
        <button
          onClick={() => handleScoreAction({ action: 'undo', teamId: activeInning.team })}
          disabled={loading || cricketData.recentBalls.length === 0}
          className="py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw size={16} /> Undo
        </button>
      </div>

    </div>
  );
};

export default CricketScoringConsole;

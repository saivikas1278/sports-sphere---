import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Trophy, Plus, Minus, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import tournamentService from '../../services/tournamentService';
import { fetchTournamentSchedule } from '../../redux/slices/tournamentSlice';
import { getSocket, joinMatchRoom, leaveMatchRoom, joinTournamentRoom, leaveTournamentRoom } from '../../services/socket';
import { showToast } from '../../utils/toast';

const StandardScoringConsole = ({ match, tournamentId }) => {
  const dispatch = useDispatch();

  const [homeScore, setHomeScore] = useState(match?.score?.home ?? 0);
  const [awayScore, setAwayScore] = useState(match?.score?.away ?? 0);
  const [status, setStatus] = useState(match?.status || 'scheduled');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [, setWinnerDeclared] = useState(match?.result?.winner || null);
  const [resultDetails, setResultDetails] = useState(match?.result?.details || null);

  const homeName = match?.homeTeam?.name || 'Home Team';
  const awayName = match?.awayTeam?.name || 'Away Team';
  const sportName = (match?.sport || match?.tournament?.sport || 'sports').toUpperCase();

  // Keep local state in sync if parent match prop changes
  useEffect(() => {
    if (match) {
      setHomeScore(match.score?.home ?? 0);
      setAwayScore(match.score?.away ?? 0);
      setStatus(match.status || 'scheduled');
      setWinnerDeclared(match.result?.winner || null);
      setResultDetails(match.result?.details || null);
    }
  }, [match]);

  // Real-time socket subscription
  useEffect(() => {
    if (!match?._id) return;
    const matchId = match._id;
    const socketInstance = getSocket();

    joinMatchRoom(matchId);
    if (tournamentId) {
      joinTournamentRoom(tournamentId);
    }

    const onScoreUpdate = (data) => {
      if (!data) return;
      const updatedMatchId = String(data.matchId || data.match?._id || data._id);
      if (updatedMatchId === String(matchId)) {
        if (data.score) {
          setHomeScore(data.score.home ?? 0);
          setAwayScore(data.score.away ?? 0);
        }
        if (data.status) {
          setStatus(data.status);
        }
        if (data.winner !== undefined) {
          setWinnerDeclared(data.winner);
        }
        if (data.resultText || data.result?.details) {
          setResultDetails(data.resultText || data.result?.details);
        }
      }
    };

    if (socketInstance) {
      socketInstance.on('score-updated', onScoreUpdate);
      socketInstance.on('match-score-updated', onScoreUpdate);
      socketInstance.on('match:score_updated', onScoreUpdate);
    }

    return () => {
      leaveMatchRoom(matchId);
      if (tournamentId) {
        leaveTournamentRoom(tournamentId);
      }
      if (socketInstance) {
        socketInstance.off('score-updated', onScoreUpdate);
        socketInstance.off('match-score-updated', onScoreUpdate);
        socketInstance.off('match:score_updated', onScoreUpdate);
      }
    };
  }, [match?._id, tournamentId]);

  const handleScoreAdjust = (team, delta) => {
    if (status === 'completed') return;
    if (team === 'home') {
      setHomeScore(prev => Math.max(0, prev + delta));
    } else {
      setAwayScore(prev => Math.max(0, prev + delta));
    }
  };

  const handleSaveScore = async (completeMatch = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let winner = null;
      if (completeMatch) {
        if (homeScore > awayScore) {
          winner = 'home';
        } else if (awayScore > homeScore) {
          winner = 'away';
        } else {
          setErrorMsg('Knockout matches cannot end in a draw. Adjust score to determine a winner.');
          setLoading(false);
          return;
        }
      }

      const payload = {
        homeScore,
        awayScore,
        winner: completeMatch ? winner : undefined,
        details: completeMatch
          ? `${winner === 'home' ? homeName : awayName} won ${Math.max(homeScore, awayScore)} - ${Math.min(homeScore, awayScore)}`
          : undefined
      };

      const res = await tournamentService.updateMatchResult(tournamentId, match._id, payload);
      if (res.success || res.data) {
        showToast(completeMatch ? 'Match finalized and winner advanced!' : 'Score updated successfully!', 'success');
        if (completeMatch) {
          setStatus('completed');
          setWinnerDeclared(winner === 'home' ? match.homeTeam?._id : match.awayTeam?._id);
          setResultDetails(payload.details);
        }
        dispatch(fetchTournamentSchedule(tournamentId));
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update score';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = status === 'completed';

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/70 p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-2xl mx-auto my-6 transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/80 pb-5 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
              {sportName}
            </span>
            {isCompleted ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <Trophy size={12} /> Finished
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 animate-pulse">
                Live Match
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mt-1">
            {homeName} <span className="text-slate-400 font-medium">vs</span> {awayName}
          </h2>
        </div>
      </div>

      {/* Match Completed Banner */}
      {isCompleted && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy size={20} className="text-amber-300" />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">Official Result</p>
              <h3 className="text-base md:text-lg font-black">{resultDetails || 'Match Completed'}</h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">Final</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scoreboard Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Home Team */}
        <div className="flex flex-col items-center p-6 bg-gradient-to-b from-blue-50/50 to-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
          <h3 className="font-extrabold text-sm md:text-base text-slate-700 uppercase tracking-wider text-center truncate w-full mb-2">
            {homeName}
          </h3>
          <span className="text-5xl md:text-6xl font-black text-slate-800 my-2 tracking-tight">
            {homeScore}
          </span>
          {!isCompleted && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleScoreAdjust('home', -1)}
                disabled={loading || homeScore <= 0}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-all disabled:opacity-40"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => handleScoreAdjust('home', 1)}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center p-6 bg-gradient-to-b from-purple-50/50 to-white rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-500"></div>
          <h3 className="font-extrabold text-sm md:text-base text-slate-700 uppercase tracking-wider text-center truncate w-full mb-2">
            {awayName}
          </h3>
          <span className="text-5xl md:text-6xl font-black text-slate-800 my-2 tracking-tight">
            {awayScore}
          </span>
          {!isCompleted && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleScoreAdjust('away', -1)}
                disabled={loading || awayScore <= 0}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-all disabled:opacity-40"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => handleScoreAdjust('away', 1)}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center font-bold transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={() => handleSaveScore(false)}
            disabled={loading}
            className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex justify-center items-center gap-2"
          >
            <Save size={16} /> Save Live Score
          </button>
          <button
            onClick={() => handleSaveScore(true)}
            disabled={loading}
            className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 size={16} /> Finalize & End Match
          </button>
        </div>
      )}
    </div>
  );
};

export default StandardScoringConsole;

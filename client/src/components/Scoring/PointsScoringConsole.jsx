import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Trophy, RotateCcw, Flame, CheckCircle2, AlertCircle, Info, Zap } from 'lucide-react';
import tournamentService from '../../services/tournamentService';
import { fetchTournamentSchedule } from '../../redux/slices/tournamentSlice';
import { getSocket, joinMatchRoom, leaveMatchRoom, joinTournamentRoom, leaveTournamentRoom } from '../../services/socket';
import {
  createInitialPointsState,
  resolveConfig,
  getActiveSetStatus,
  getSetRules
} from '../../utils/pointsScoringEngine';

const PointsScoringConsole = ({ match, tournamentId }) => {
  const dispatch = useDispatch();

  const sportName = match?.tournament?.sport || match?.sport || 'badminton';
  const config = resolveConfig(match?.setsData?.config || sportName);

  // Local state for optimistic UI updates
  const [setsData, setSetsData] = useState(
    match?.setsData || createInitialPointsState(
      sportName,
      match?.homeTeam?._id,
      match?.awayTeam?._id,
      config
    )
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync if match prop changes externally
  useEffect(() => {
    if (match?.setsData) {
      setSetsData({
        ...match.setsData,
        config: resolveConfig(match.setsData.config || match.setsData.sport || sportName),
        isCompleted: match.status === 'completed' || match.setsData.isCompleted,
        resultText: match.result?.details || match.setsData.resultText
      });
    }
  }, [match, sportName]);

  // Real-time socket subscription for points matches
  useEffect(() => {
    if (!match?._id) return;
    const matchId = match._id;
    const socketInstance = getSocket();

    joinMatchRoom(matchId);
    if (tournamentId) {
      joinTournamentRoom(tournamentId);
    }

    const onIncomingPointsScore = (data) => {
      if (!data) return;
      const updatedMatchId = String(data.matchId || data.match?._id || data._id);
      if (updatedMatchId === String(matchId) && data.setsData) {
        setSetsData({
          ...data.setsData,
          config: resolveConfig(data.setsData.config || data.setsData.sport || sportName),
          isCompleted: data.status === 'completed' || data.setsData.isCompleted,
          resultText: data.resultText || data.setsData.resultText
        });
      }
    };

    if (socketInstance) {
      socketInstance.on('score-updated', onIncomingPointsScore);
      socketInstance.on('match-score-updated', onIncomingPointsScore);
      socketInstance.on('match:score_updated', onIncomingPointsScore);
    }

    return () => {
      leaveMatchRoom(matchId);
      if (tournamentId) {
        leaveTournamentRoom(tournamentId);
      }
      if (socketInstance) {
        socketInstance.off('score-updated', onIncomingPointsScore);
        socketInstance.off('match-score-updated', onIncomingPointsScore);
        socketInstance.off('match:score_updated', onIncomingPointsScore);
      }
    };
  }, [match?._id, tournamentId, sportName]);

  const activeSetNumber = setsData.currentSet || 1;
  const currentSetObj = setsData.sets?.[activeSetNumber - 1] || { homeScore: 0, awayScore: 0 };
  const rules = getSetRules(setsData.config || config, activeSetNumber);
  const statusInfo = getActiveSetStatus(setsData);

  const homeName = match?.homeTeam?.name || 'Home Team';
  const awayName = match?.awayTeam?.name || 'Away Team';

  const handleScoreAction = async (actionData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await tournamentService.updatePointsScore(tournamentId, match._id, {
        ...actionData,
        sport: sportName
      });

      if (response.success && response.data) {
        setSetsData({
          ...response.data.setsData,
          config: resolveConfig(response.data.setsData?.config || sportName),
          isCompleted: response.data.status === 'completed' || response.data.setsData?.isCompleted,
          resultText: response.data.result?.details || response.data.setsData?.resultText
        });
        dispatch(fetchTournamentSchedule(tournamentId));
      }
    } catch (error) {
      console.error('Error updating points score:', error);
      setErrorMsg(error.response?.data?.error || error.message || 'Failed to update point');
    } finally {
      setLoading(false);
    }
  };

  const canUndo = setsData.pointHistory && setsData.pointHistory.length > 0;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/70 p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-2xl mx-auto my-6 transition-all">
      {/* Header with Sport Badge & Sets Score */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/80 pb-5 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700">
              {config.displayName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-500 bg-slate-100">
              Best of {config.bestOf} Sets
            </span>
            {setsData.isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <Trophy size={12} /> Finished
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-1">
            {homeName} <span className="text-slate-400 font-medium text-lg">vs</span> {awayName}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
            <Info size={13} className="text-blue-500" />
            Set target: {rules.targetPoints} pts • Win by {rules.winBy}
            {rules.cap ? ` • Cap at ${rules.cap} pts` : ''}
            {rules.isDeciding ? ' (Deciding Set)' : ''}
          </p>
        </div>

        {/* Big Sets Won Scoreboard */}
        <div className="text-left md:text-right bg-slate-50/80 md:bg-transparent p-3 md:p-0 rounded-2xl w-full md:w-auto">
          <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Sets Score</p>
          <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mt-0.5">
            <span className="text-blue-600">{setsData.homeSetsWon ?? 0}</span>
            <span className="text-slate-300 mx-2">-</span>
            <span className="text-rose-600">{setsData.awaySetsWon ?? 0}</span>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            First to {config.setsToWin} sets wins
          </p>
        </div>
      </div>

      {/* Match Completed Banner */}
      {setsData.isCompleted && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm animate-in fade-in duration-300">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Match Concluded</p>
            <p className="text-lg md:text-xl font-black text-emerald-900">
              {setsData.resultText || match?.result?.details || 'Match Finished'}
            </p>
          </div>
        </div>
      )}

      {/* Set-by-Set History Chips */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Set History Breakdown
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {setsData.sets?.map((s, idx) => (
            <div
              key={idx}
              className={`px-3.5 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all shadow-sm
                ${s.setNumber === activeSetNumber && !setsData.isCompleted
                  ? 'bg-blue-50/90 border-blue-300 text-blue-900 ring-2 ring-blue-400/20'
                  : s.isCompleted
                  ? 'bg-slate-100/80 border-slate-200/80 text-slate-700'
                  : 'bg-slate-50/50 border-slate-200/50 text-slate-400'}`}
            >
              <span>Set {s.setNumber}:</span>
              <span className="font-black">
                {s.homeScore} - {s.awayScore}
              </span>
              {s.isCompleted && (
                <CheckCircle2 size={14} className="text-emerald-500" />
              )}
              {s.setNumber === activeSetNumber && !setsData.isCompleted && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Set Status Indicator (Deuce / Match Point / Set Point) */}
      {!setsData.isCompleted && (
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Current Set: <strong className="text-slate-800">Set {activeSetNumber}</strong>
            </span>
          </div>

          <div>
            {statusInfo.isDeuce ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-sm animate-pulse">
                <Flame size={14} className="text-amber-600" /> {statusInfo.label}
              </span>
            ) : statusInfo.isMatchPoint ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-sm">
                <Zap size={14} className="text-rose-600" /> MATCH POINT
              </span>
            ) : statusInfo.isSetPoint ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 shadow-sm">
                <Zap size={14} className="text-indigo-600" /> SET POINT
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">
                Playing to {rules.targetPoints}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Set Scoring Arena */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Home Team Point Box */}
        <div className="flex flex-col items-center p-6 bg-gradient-to-b from-blue-50/50 to-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
          <h3 className="font-extrabold text-sm md:text-base text-slate-700 uppercase tracking-wider text-center truncate w-full mb-1">
            {homeName}
          </h3>
          <p className="text-xs font-semibold text-blue-600">
            {setsData.homeSetsWon ?? 0} {setsData.homeSetsWon === 1 ? 'set' : 'sets'} won
          </p>
          <div className="text-6xl md:text-7xl font-black text-slate-800 my-4 tracking-tight">
            {currentSetObj.homeScore}
          </div>
          <button
            onClick={() => handleScoreAction({ action: 'point', team: 'home' })}
            disabled={loading || setsData.isCompleted}
            className="w-full py-4 rounded-2xl font-black text-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            +1 Point
          </button>
        </div>

        {/* Away Team Point Box */}
        <div className="flex flex-col items-center p-6 bg-gradient-to-b from-rose-50/50 to-white rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
          <h3 className="font-extrabold text-sm md:text-base text-slate-700 uppercase tracking-wider text-center truncate w-full mb-1">
            {awayName}
          </h3>
          <p className="text-xs font-semibold text-rose-600">
            {setsData.awaySetsWon ?? 0} {setsData.awaySetsWon === 1 ? 'set' : 'sets'} won
          </p>
          <div className="text-6xl md:text-7xl font-black text-slate-800 my-4 tracking-tight">
            {currentSetObj.awayScore}
          </div>
          <button
            onClick={() => handleScoreAction({ action: 'point', team: 'away' })}
            disabled={loading || setsData.isCompleted}
            className="w-full py-4 rounded-2xl font-black text-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-200 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            +1 Point
          </button>
        </div>
      </div>

      {/* Bottom Controls: Undo */}
      <div className="flex justify-end items-center">
        <button
          onClick={() => handleScoreAction({ action: 'undo' })}
          disabled={loading || !canUndo}
          className="py-3 px-5 rounded-2xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
        >
          <RotateCcw size={16} /> Undo Last Point
        </button>
      </div>
    </div>
  );
};

export default PointsScoringConsole;

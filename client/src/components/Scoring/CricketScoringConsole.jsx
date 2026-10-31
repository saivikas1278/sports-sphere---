import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RotateCcw, Activity, Trophy, Target, TrendingUp, Clock, ArrowRightLeft, AlertCircle } from 'lucide-react';
import tournamentService from '../../services/tournamentService';
import { fetchTournamentSchedule } from '../../redux/slices/tournamentSlice';
import { calculateMetrics, calculateTarget } from '../../utils/cricketScoringEngine';
import { getSocket, joinMatchRoom, leaveMatchRoom, joinTournamentRoom, leaveTournamentRoom } from '../../services/socket';

const CricketScoringConsole = ({ match, tournamentId }) => {
  const dispatch = useDispatch();

  // Local state for optimistic UI updates
  const [cricketData, setCricketData] = useState(
    match?.cricketData || {
      innings: [
        { team: match?.homeTeam?._id, runs: 0, wickets: 0, overs: 0, balls: 0 },
        { team: match?.awayTeam?._id, runs: 0, wickets: 0, overs: 0, balls: 0 }
      ],
      currentInningIndex: 0,
      maxOvers: 20,
      maxWickets: 10,
      target: null,
      recentBalls: [],
      ballHistory: [],
      isCompleted: match?.status === 'completed',
      resultText: match?.result?.details || null
    }
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync if match prop changes externally
  useEffect(() => {
    if (match?.cricketData) {
      setCricketData({
        ...match.cricketData,
        isCompleted: match.status === 'completed' || match.cricketData.isCompleted,
        resultText: match.result?.details || match.cricketData.resultText
      });
    }
  }, [match]);

  // Real-time socket subscription for live cricket score updates
  useEffect(() => {
    if (!match?._id) return;
    const matchId = match._id;
    const socketInstance = getSocket();

    joinMatchRoom(matchId);
    if (tournamentId) {
      joinTournamentRoom(tournamentId);
    }

    const onIncomingCricketScore = (data) => {
      if (!data) return;
      const updatedMatchId = String(data.matchId || data.match?._id || data._id);
      if (updatedMatchId === String(matchId) && data.cricketData) {
        setCricketData({
          ...data.cricketData,
          isCompleted: data.status === 'completed' || data.cricketData.isCompleted,
          resultText: data.resultText || data.cricketData.resultText
        });
      }
    };

    if (socketInstance) {
      socketInstance.on('score-updated', onIncomingCricketScore);
      socketInstance.on('match-score-updated', onIncomingCricketScore);
      socketInstance.on('match:score_updated', onIncomingCricketScore);
    }

    return () => {
      leaveMatchRoom(matchId);
      if (tournamentId) {
        leaveTournamentRoom(tournamentId);
      }
      if (socketInstance) {
        socketInstance.off('score-updated', onIncomingCricketScore);
        socketInstance.off('match-score-updated', onIncomingCricketScore);
        socketInstance.off('match:score_updated', onIncomingCricketScore);
      }
    };
  }, [match?._id, tournamentId]);

  const activeInningIndex = cricketData.currentInningIndex ?? 0;
  const inn1 = cricketData.innings?.[0] || { runs: 0, wickets: 0, overs: 0, balls: 0 };
  const inn2 = cricketData.innings?.[1] || { runs: 0, wickets: 0, overs: 0, balls: 0 };
  const activeInning = activeInningIndex === 0 ? inn1 : inn2;

  const homeName = match?.homeTeam?.name || 'Team 1';
  const awayName = match?.awayTeam?.name || 'Team 2';
  const battingTeamName = activeInningIndex === 0 ? homeName : awayName;
  const bowlingTeamName = activeInningIndex === 0 ? awayName : homeName;

  // Compute live match metrics
  const metrics = calculateMetrics(cricketData);
  const target = cricketData.target || (activeInningIndex === 1 ? calculateTarget(inn1.runs) : null);

  const handleScoreAction = async (actionData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await tournamentService.updateCricketBall(tournamentId, match._id, actionData);

      if (response.success && response.data) {
        setCricketData({
          ...response.data.cricketData,
          isCompleted: response.data.status === 'completed' || response.data.cricketData?.isCompleted,
          resultText: response.data.result?.details || response.data.cricketData?.resultText
        });
        // Trigger Redux refresh so live board & brackets update immediately
        dispatch(fetchTournamentSchedule(tournamentId));
      }
    } catch (error) {
      console.error('Error updating cricket score:', error);
      setErrorMsg(error.response?.data?.error || error.message || 'Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const canUndo = (cricketData.ballHistory && cricketData.ballHistory.length > 0) ||
                  (cricketData.recentBalls && cricketData.recentBalls.length > 0);

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/70 p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-2xl mx-auto my-6 transition-all">
      {/* Header & Teams */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/80 pb-5 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700">
              Innings {activeInningIndex + 1}
            </span>
            {cricketData.isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <Trophy size={12} /> Finished
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-1">
            {homeName} <span className="text-slate-400 font-medium text-lg">vs</span> {awayName}
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            Batting: <strong className="text-slate-800">{battingTeamName}</strong> • Bowling: <span className="text-slate-600">{bowlingTeamName}</span>
          </p>
        </div>

        {/* Current Innings Score Counter */}
        <div className="text-left md:text-right bg-slate-50/80 md:bg-transparent p-3 md:p-0 rounded-2xl w-full md:w-auto">
          <div className="text-4xl md:text-5xl font-black text-blue-600 tracking-tight">
            {activeInning.runs}/{activeInning.wickets}
          </div>
          <div className="text-sm font-bold text-slate-600 mt-1">
            {activeInning.overs}.{activeInning.balls} / {cricketData.maxOvers || 20} Overs
          </div>
        </div>
      </div>

      {/* Target & Innings 2 Chase Banner */}
      {activeInningIndex === 1 && target && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-blue-100">Target</p>
                <p className="text-2xl font-black">{target} <span className="text-xs font-semibold text-blue-200">({inn1.runs} in 1st inn)</span></p>
              </div>
            </div>

            <div className="text-right">
              {metrics.runsRequired > 0 ? (
                <>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-blue-100">Chase Equation</p>
                  <p className="text-base font-black">
                    Need <span className="text-amber-300 font-black">{metrics.runsRequired}</span> runs from <span className="text-amber-300 font-black">{metrics.ballsRemaining}</span> balls
                  </p>
                </>
              ) : (
                <div className="px-3 py-1 bg-emerald-500/80 rounded-xl font-bold text-sm">
                  Target Achieved!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match Completed Banner */}
      {cricketData.isCompleted && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Match Concluded</p>
            <p className="text-lg md:text-xl font-black text-emerald-900">
              {cricketData.resultText || match?.result?.details || 'Match Finished'}
            </p>
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

      {/* Live Run Rate Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <TrendingUp size={14} /> Current RR
          </p>
          <p className="text-xl font-black text-slate-800 mt-0.5">{metrics.crr}</p>
        </div>

        {activeInningIndex === 1 ? (
          <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <TrendingUp size={14} /> Req. RR
            </p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">
              {metrics.rrr === Infinity ? '—' : metrics.rrr}
            </p>
          </div>
        ) : (
          <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60">
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Clock size={14} /> Inn 1 Overs
            </p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{inn1.overs}.{inn1.balls}</p>
          </div>
        )}

        <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Clock size={14} /> {activeInningIndex === 1 ? 'Balls Left' : 'Balls Bowled'}
          </p>
          <p className="text-xl font-black text-slate-800 mt-0.5">
            {activeInningIndex === 1 ? metrics.ballsRemaining : metrics.ballsBowled}
          </p>
        </div>

        <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60">
          <p className="text-xs font-bold text-slate-500">1st Inn Total</p>
          <p className="text-xl font-black text-slate-700 mt-0.5">{inn1.runs}/{inn1.wickets}</p>
        </div>
      </div>

      {/* Recent Deliveries Ribbon */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} /> Recent Deliveries (This Over / Innings)
          </h3>
          {activeInningIndex === 0 && !cricketData.isCompleted && (
            <button
              onClick={() => handleScoreAction({ action: 'switch_innings' })}
              disabled={loading}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <ArrowRightLeft size={12} /> End 1st Innings
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center min-h-[44px] bg-slate-100/60 p-2 rounded-2xl border border-slate-200/60 overflow-x-auto">
          {(!cricketData.recentBalls || cricketData.recentBalls.length === 0) ? (
            <span className="text-sm text-slate-400 italic px-2">No deliveries yet...</span>
          ) : (
            cricketData.recentBalls.map((ball, i) => (
              <div
                key={i}
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-sm shadow-sm transition-transform
                  ${ball === 'W' ? 'bg-red-500 text-white' :
                    ball === '4' || ball === '6' ? 'bg-emerald-500 text-white' :
                    ball.includes('Wd') || ball.includes('Nb') ? 'bg-amber-400 text-slate-900' :
                    ball.includes('B') || ball.includes('Lb') ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    'bg-white text-slate-800 border border-slate-200'}`}
              >
                {ball}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Pad: Runs & Wicket */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[0, 1, 2, 3, 4, 6].map((runs) => (
          <button
            key={runs}
            onClick={() => handleScoreAction({ action: 'score', runs, teamId: activeInning.team })}
            disabled={loading || cricketData.isCompleted}
            className={`py-4 rounded-2xl font-black text-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none
              ${runs === 4 || runs === 6
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-emerald-50'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
          >
            {runs}
          </button>
        ))}
        <button
          onClick={() => handleScoreAction({ action: 'wicket', isWicket: true, teamId: activeInning.team })}
          disabled={loading || cricketData.isCompleted}
          className="col-span-2 py-4 rounded-2xl font-black text-xl bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          WICKET (W)
        </button>
      </div>

      {/* Action Pad: Extras & Undo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-2">
        <button
          onClick={() => handleScoreAction({ action: 'extra', isWide: true, teamId: activeInning.team })}
          disabled={loading || cricketData.isCompleted}
          className="py-3 px-2 rounded-xl font-bold text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          Wide (Wd)
        </button>
        <button
          onClick={() => handleScoreAction({ action: 'extra', isNoBall: true, teamId: activeInning.team })}
          disabled={loading || cricketData.isCompleted}
          className="py-3 px-2 rounded-xl font-bold text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          No Ball (Nb)
        </button>
        <button
          onClick={() => handleScoreAction({ action: 'extra', isBye: true, runs: 1, teamId: activeInning.team })}
          disabled={loading || cricketData.isCompleted}
          className="py-3 px-2 rounded-xl font-bold text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          Bye (B)
        </button>
        <button
          onClick={() => handleScoreAction({ action: 'extra', isLegBye: true, runs: 1, teamId: activeInning.team })}
          disabled={loading || cricketData.isCompleted}
          className="py-3 px-2 rounded-xl font-bold text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          Leg Bye (Lb)
        </button>
        <button
          onClick={() => handleScoreAction({ action: 'undo', teamId: activeInning.team })}
          disabled={loading || !canUndo}
          className="col-span-2 md:col-span-1 py-3 px-2 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex justify-center items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <RotateCcw size={15} /> Undo Ball
        </button>
      </div>
    </div>
  );
};

export default CricketScoringConsole;

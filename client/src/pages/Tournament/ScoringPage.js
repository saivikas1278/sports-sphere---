import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import { fetchTournamentSchedule, fetchTournamentById } from '../../redux/slices/tournamentSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CricketScoringConsole from '../../components/Scoring/CricketScoringConsole';
import PointsScoringConsole from '../../components/Scoring/PointsScoringConsole';
import socket from '../../services/socket';

const ScoringPage = () => {
  const { id, matchId } = useParams();
  const dispatch = useDispatch();

  const { schedule, currentTournament, loading } = useSelector((state) => state.tournaments);

  useEffect(() => {
    dispatch(fetchTournamentById(id));
    dispatch(fetchTournamentSchedule(id));
    
    const socketInstance = socket.getSocket();
    if (socketInstance) {
      socketInstance.emit('join_tournament', id);
      
      const handleScoreUpdate = (data) => {
        dispatch(fetchTournamentSchedule(id));
      };
      
      socketInstance.on('match-score-updated', handleScoreUpdate);
      
      return () => {
        socketInstance.emit('leave_tournament', id);
        socketInstance.off('match-score-updated', handleScoreUpdate);
      };
    }
  }, [dispatch, id]);

  // Find the specific match
  let activeMatch = null;
  if (schedule && schedule.schedule) {
    Object.values(schedule.schedule).forEach(roundList => {
      const found = roundList.find(m => m._id === matchId);
      if (found) activeMatch = found;
    });
  }

  if (loading && !activeMatch) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!activeMatch) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to={`/tournaments/${id}/live`} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-4">
          <ChevronLeft size={20} /> Back to Live Board
        </Link>
        <div className="text-center py-10 font-bold text-2xl text-slate-400">Match not found.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl relative z-10">
      <Link to={`/tournaments/${id}/live`} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-6 transition-colors">
        <ChevronLeft size={20} />
        Back to Live Board
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Scoring Console</h1>
        <p className="text-slate-500 font-medium mt-2">{currentTournament?.name}</p>
      </div>

      {activeMatch.sportType === 'cricket' || currentTournament?.sport === 'cricket' ? (
        <CricketScoringConsole match={activeMatch} tournamentId={id} />
      ) : activeMatch.sportType === 'points' || ['badminton', 'tennis', 'table-tennis', 'volleyball'].includes(currentTournament?.sport) ? (
        <PointsScoringConsole match={activeMatch} tournamentId={id} />
      ) : (
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-3xl text-center shadow-xl">
          <p className="text-slate-500 font-medium">Generic scoring not yet implemented for this sport type.</p>
        </div>
      )}
    </div>
  );
};

export default ScoringPage;

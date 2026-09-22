import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Trophy, Activity, Users, Calendar, ChevronLeft } from 'lucide-react';
import { 
  fetchTournamentById,
  fetchTournamentSchedule,
  fetchTournamentBracket,
  fetchTournamentStandings
} from '../../redux/slices/tournamentSlice';
import socket from '../../services/socket';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import BracketComponent from '../../components/Tournament/BracketComponent';
import StandingsTable from '../../components/Tournament/StandingsTable';

const LiveTournamentBoard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { currentTournament, schedule, bracket, standings, loading } = useSelector((state) => state.tournaments);
  
  const [activeTab, setActiveTab] = useState('board'); // 'board', 'matches'

  useEffect(() => {
    // Initial fetches
    dispatch(fetchTournamentById(id));
    dispatch(fetchTournamentSchedule(id));
    dispatch(fetchTournamentBracket(id));
    dispatch(fetchTournamentStandings(id));

    // Listen for socket updates
    if (socket) {
      socket.emit('join_tournament', id);

      const handleBracketUpdate = (updatedBracket) => {
        dispatch({ type: 'tournaments/fetchTournamentBracket/fulfilled', payload: { bracket: updatedBracket } });
      };

      const handleScoreUpdate = (data) => {
        // Trigger a re-fetch of everything on a major score update to keep UI fresh
        dispatch(fetchTournamentSchedule(id));
        dispatch(fetchTournamentBracket(id));
        dispatch(fetchTournamentStandings(id));
      };

      socket.on('tournament:bracket_updated', handleBracketUpdate);
      socket.on('match:score_updated', handleScoreUpdate);

      return () => {
        socket.emit('leave_tournament', id);
        socket.off('tournament:bracket_updated', handleBracketUpdate);
        socket.off('match:score_updated', handleScoreUpdate);
      };
    }
  }, [dispatch, id]);

  if (loading && !currentTournament) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentTournament) {
    return <div className="text-center py-4 md:py-6 md:py-10 md:py-20 font-bold text-2xl text-slate-400">Tournament not found.</div>;
  }

  // Parse schedule matches
  let allMatches = [];
  let liveMatchesCount = 0;
  if (schedule && schedule.schedule) {
    Object.values(schedule.schedule).forEach(roundList => {
      allMatches = [...allMatches, ...roundList];
      liveMatchesCount += roundList.filter(m => m.status === 'in_progress').length;
    });
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-7xl">
      {/* Back Link */}
      <Link to={`/tournaments/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-4 md:mb-6 transition-colors">
        <ChevronLeft size={20} />
        Back to Tournament Details
      </Link>

      {/* Header */}
      <div className="mb-4 md:mb-8 p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-white/40 border border-white/60 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 md:p-8 text-blue-500/10">
          <Activity size={120} />
        </div>
        <Trophy className="text-blue-500 mx-auto mb-4" size={48} />
        <h1 className="text-xl md:text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-2">Live Board: {currentTournament.name}</h1>
        <p className="text-slate-600 font-medium text-lg">Real-time tournament updates, standings, and scoring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
        {[
          { title: 'Live Matches', value: liveMatchesCount, icon: Activity, color: 'text-red-500' },
          { title: 'Teams Playing', value: currentTournament.registeredTeams?.length || 0, icon: Users, color: 'text-blue-500' },
          { title: 'Total Matches', value: allMatches.length, icon: Trophy, color: 'text-amber-500' },
          { title: 'Format', value: currentTournament.format?.replace('-', ' ') || 'Unknown', icon: Calendar, color: 'text-purple-500' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-4 md:p-6 rounded-[24px] glass-panel bg-white/40 border border-white flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
                <p className="text-xl md:text-3xl font-black text-slate-800 capitalize">{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Icon className={stat.color} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="p-4 md:p-8 rounded-[40px] glass-panel bg-white/40 border border-white min-h-[400px]">
        <div className="flex gap-4 mb-4 md:mb-8 border-b border-slate-200/50 pb-4">
          <button 
            onClick={() => setActiveTab('board')}
            className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'board' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
          >
            Tournament Board
          </button>
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'matches' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
          >
            Match Schedule
          </button>
        </div>

        {activeTab === 'board' && (
          <div>
            {currentTournament.format?.includes('elimination') ? (
              <BracketComponent bracket={bracket} matches={allMatches} />
            ) : (
              <StandingsTable standings={standings} />
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {allMatches.length === 0 ? (
              <div className="text-center py-4 md:py-6 md:py-10 text-slate-500 font-medium">No matches scheduled yet.</div>
            ) : (
              allMatches.map((match) => (
                <div key={match._id} className="p-4 bg-white/60 border border-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{match.round || 'Match'}</span>
                    <div className="font-semibold text-slate-800 text-lg mt-1">
                      {match.homeTeam?.name || 'TBD'} vs {match.awayTeam?.name || 'TBD'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(match.scheduledTime).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      match.status === 'completed' ? 'bg-green-100 text-green-700' :
                      match.status === 'in_progress' ? 'bg-red-100 text-red-700 animate-pulse' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {match.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTournamentBoard;

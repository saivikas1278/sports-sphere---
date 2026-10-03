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
import ChatRoom from '../../components/Chat/ChatRoom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const LiveTournamentBoard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { currentTournament, schedule, bracket, standings, loading } = useSelector((state) => state.tournaments);
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'bracket', 'standings', 'chat'

  useEffect(() => {
    // Initial fetches
    dispatch(fetchTournamentById(id));
    dispatch(fetchTournamentSchedule(id));
    dispatch(fetchTournamentBracket(id));
    dispatch(fetchTournamentStandings(id));

    // Listen for socket updates
    const socketInstance = socket.getSocket();
    if (socketInstance) {
      socketInstance.emit('join_tournament', id);

      const handleBracketUpdate = (updatedBracket) => {
        dispatch({ type: 'tournaments/fetchTournamentBracket/fulfilled', payload: { bracket: updatedBracket } });
      };

      const handleScoreUpdate = (data) => {
        // Trigger a re-fetch of everything on a major score update to keep UI fresh
        dispatch(fetchTournamentSchedule(id));
        dispatch(fetchTournamentBracket(id));
        dispatch(fetchTournamentStandings(id));
      };

      socketInstance.on('tournament:bracket_updated', handleBracketUpdate);
      socketInstance.on('match-score-updated', handleScoreUpdate);

      return () => {
        socketInstance.emit('leave_tournament', id);
        socketInstance.off('tournament:bracket_updated', handleBracketUpdate);
        socketInstance.off('match-score-updated', handleScoreUpdate);
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
        <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-8 border-b border-slate-200/50 pb-4">
          <button 
            onClick={() => setActiveTab('live')}
            className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'live' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
          >
            Live Matches & Map
          </button>
          <button 
            onClick={() => setActiveTab('bracket')}
            className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'bracket' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
          >
            Bracket Tree
          </button>
          <button 
            onClick={() => setActiveTab('standings')}
            className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'standings' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
          >
            Standings Table
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'chat' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
          >
            Discussions
          </button>
        </div>

        {activeTab === 'chat' && (
          <div className="h-[600px]">
            <ChatRoom 
              roomType="tournament" 
              roomId={currentTournament._id} 
              roomName={currentTournament.name}
              isModerator={user?._id === currentTournament.organizer?._id || user?._id === currentTournament.organizer}
            />
          </div>
        )}

        {activeTab === 'bracket' && (
          <div>
            <BracketComponent bracket={bracket} matches={allMatches} />
          </div>
        )}

        {activeTab === 'standings' && (
          <div>
            <StandingsTable standings={standings} />
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-slate-700">Scheduled Matches</h3>
              {allMatches.length === 0 ? (
                <div className="text-center py-4 md:py-6 text-slate-500 font-medium">No matches scheduled yet.</div>
              ) : (
                allMatches.map((match) => (
                  <div key={match._id} className="p-4 bg-white/60 border border-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{match.round || 'Match'}</span>
                      <div className="font-semibold text-slate-800 text-lg mt-1 flex items-center gap-2">
                        {match.homeTeam?.name || 'TBD'} vs {match.awayTeam?.name || 'TBD'}
                        
                        {/* Status Badge */}
                        <span className={`ml-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          match.status === 'completed' ? 'bg-green-100 text-green-700' :
                          match.status === 'in_progress' || match.status === 'live' ? 'bg-red-100 text-red-700 animate-pulse border border-red-300' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {match.status?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Sport Specific Score Display */}
                      {match.sportType === 'cricket' && match.cricketData?.innings && match.cricketData.innings[0] && (
                        <div className="mt-2 p-2 bg-slate-100 rounded-lg flex flex-col md:flex-row gap-4 text-sm">
                          <div className="font-bold text-slate-700">
                            {match.homeTeam?.name}: <span className="text-blue-600">{match.cricketData.innings[0].runs}/{match.cricketData.innings[0].wickets}</span> ({match.cricketData.innings[0].overs}.{match.cricketData.innings[0].balls} ov)
                          </div>
                          {match.cricketData.innings[1] && (
                            <div className="font-bold text-slate-700">
                              {match.awayTeam?.name}: <span className="text-blue-600">{match.cricketData.innings[1].runs}/{match.cricketData.innings[1].wickets}</span> ({match.cricketData.innings[1].overs}.{match.cricketData.innings[1].balls} ov)
                            </div>
                          )}
                          <div className="flex gap-1 items-center ml-auto">
                            {match.cricketData.recentBalls?.slice(-6).map((b, i) => (
                              <span key={i} className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm text-slate-500 mt-2">
                        {new Date(match.scheduledTime).toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <Link 
                        to={`/tournaments/${id}/matches/${match._id}/score`}
                        className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap"
                      >
                        Score Match
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <h3 className="font-bold text-xl text-slate-700 mb-4">Location Map</h3>
              {currentTournament.venue?.coordinates ? (
                <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <MapContainer 
                    center={[currentTournament.venue.coordinates.lat || 0, currentTournament.venue.coordinates.lng || 0]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[currentTournament.venue.coordinates.lat || 0, currentTournament.venue.coordinates.lng || 0]}>
                      <Popup>
                        <strong>{currentTournament.venue.name}</strong><br/>
                        {currentTournament.venue.address}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="text-center py-4 md:py-6 text-slate-500 font-medium bg-white/40 rounded-xl border border-white">
                  Location coordinates not provided for this tournament.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTournamentBoard;

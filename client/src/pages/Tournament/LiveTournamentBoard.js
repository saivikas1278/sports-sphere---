import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Trophy, 
  Activity, 
  Calendar, 
  ChevronLeft, 
  Printer, 
  Radio, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Flame,
  Clock,
  CheckCircle2,
  GitBranch,
  Table,
  MapPin
} from 'lucide-react';
import { 
  fetchTournamentById,
  fetchTournamentSchedule,
  fetchTournamentBracket,
  fetchTournamentStandings
} from '../../redux/slices/tournamentSlice';
import { getSocket, joinTournamentRoom, leaveTournamentRoom, joinMatchRoom, leaveMatchRoom } from '../../services/socket';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import BracketComponent from '../../components/Tournament/BracketComponent';
import StandingsTable from '../../components/Tournament/StandingsTable';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon paths in React bundle
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

  // View tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'live', 'upcoming', 'results', 'bracket', 'standings'
  
  // Real-time connection status
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected', 'reconnecting', 'disconnected'
  
  // Local real-time commentary ticker
  const [commentaryFeed, setCommentaryFeed] = useState([
    { id: 'initial', time: 'LIVE SYNC', text: 'Live tournament broadcast feed connected. Real-time scores and bracket progression active.', tag: 'BROADCAST' }
  ]);

  // Local match overrides for instant, zero-latency rendering
  const [localMatches, setLocalMatches] = useState([]);
  const hasMountedRef = useRef(false);

  // Central refetch function for initial load and reconnection recovery
  const refreshAllTournamentData = useCallback(() => {
    dispatch(fetchTournamentById(id));
    dispatch(fetchTournamentSchedule(id));
    dispatch(fetchTournamentBracket(id));
    dispatch(fetchTournamentStandings(id));
  }, [dispatch, id]);

  // Synchronize localMatches from Redux schedule
  useEffect(() => {
    if (schedule) {
      let extracted = [];
      if (Array.isArray(schedule)) {
        extracted = schedule;
      } else if (schedule.schedule && typeof schedule.schedule === 'object') {
        Object.values(schedule.schedule).forEach(roundList => {
          if (Array.isArray(roundList)) {
            extracted.push(...roundList);
          }
        });
      } else if (Array.isArray(schedule.matches)) {
        extracted = schedule.matches;
      }
      setLocalMatches(extracted);
    }
  }, [schedule]);

  // Socket setup, room joining, event listeners, and reconnection handling
  useEffect(() => {
    refreshAllTournamentData();

    const socketInstance = getSocket();
    if (!socketInstance) return;

    // Join tournament room
    joinTournamentRoom(id);

    // Initial connection state
    if (socketInstance.connected) {
      setConnectionStatus('connected');
    }

    // Connect & Reconnection Handlers
    const handleConnect = () => {
      setConnectionStatus('connected');
      joinTournamentRoom(id);

      // Refetch state on reconnect if after initial mount
      if (hasMountedRef.current) {
        refreshAllTournamentData();
        setCommentaryFeed(prev => [
          {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: 'Reconnected to server. Tournament board and brackets synchronized.',
            tag: 'SYNC'
          },
          ...prev.slice(0, 15)
        ]);
      }
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    // Live score update handler
    const handleScoreUpdate = (data) => {
      if (!data) return;

      const updatedMatchId = String(data.matchId || data.match?._id || data._id);
      
      // Update local matches array immediately
      setLocalMatches(prev => prev.map(m => {
        if (String(m._id) === updatedMatchId) {
          return {
            ...m,
            ...data,
            score: data.score || (data.homeScore !== undefined ? { home: data.homeScore, away: data.awayScore } : m.score),
            status: data.status || m.status,
            setsData: data.setsData || m.setsData,
            cricketData: data.cricketData || m.cricketData,
            homeTeam: data.homeTeam || m.homeTeam,
            awayTeam: data.awayTeam || m.awayTeam
          };
        }
        return m;
      }));

      // Add commentary ticker entry
      const scoreStr = data.score ? `${data.score.home ?? 0} - ${data.score.away ?? 0}` : 
                       (data.homeScore !== undefined ? `${data.homeScore} - ${data.awayScore}` : '');
      const eventText = data.event || data.details || (scoreStr ? `Score update: ${scoreStr}` : 'Match score refreshed');

      setCommentaryFeed(prev => [
        {
          id: Date.now().toString() + Math.random().toString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          text: eventText,
          tag: 'SCORE'
        },
        ...prev.slice(0, 15)
      ]);

      // If match was completed or advanced, refresh bracket and schedule in background
      if (data.status === 'completed' || data.event?.includes('Winner advanced')) {
        dispatch(fetchTournamentBracket(id));
        dispatch(fetchTournamentSchedule(id));
      }
    };

    // Bracket update handler
    const handleBracketUpdate = (bracketData) => {
      const updatedBracket = bracketData?.bracket || bracketData;
      if (updatedBracket) {
        dispatch({
          type: 'tournaments/fetchTournamentBracket/fulfilled',
          payload: { bracket: updatedBracket }
        });
        dispatch(fetchTournamentSchedule(id));
        setCommentaryFeed(prev => [
          {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: 'Tournament bracket updated. Advancing winners progressed to next round.',
            tag: 'BRACKET'
          },
          ...prev.slice(0, 15)
        ]);
      }
    };

    // Match status change handler
    const handleStatusChange = (data) => {
      if (!data) return;
      const targetId = String(data.matchId);
      setLocalMatches(prev => prev.map(m => String(m._id) === targetId ? { ...m, status: data.status } : m));
      dispatch(fetchTournamentSchedule(id));
      dispatch(fetchTournamentBracket(id));
    };

    // Register socket listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('reconnect', handleConnect);
    socketInstance.on('reconnecting', handleReconnectAttempt);
    socketInstance.on('match-score-updated', handleScoreUpdate);
    socketInstance.on('score-updated', handleScoreUpdate);
    socketInstance.on('tournament-match-event', handleScoreUpdate);
    socketInstance.on('match-event-added', handleScoreUpdate);
    socketInstance.on('match-status-changed', handleStatusChange);
    socketInstance.on('tournament-match-status-changed', handleStatusChange);
    socketInstance.on('bracket-updated', handleBracketUpdate);
    socketInstance.on('tournament:bracket_updated', handleBracketUpdate);

    hasMountedRef.current = true;

    return () => {
      leaveTournamentRoom(id);
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('reconnect', handleConnect);
      socketInstance.off('reconnecting', handleReconnectAttempt);
      socketInstance.off('match-score-updated', handleScoreUpdate);
      socketInstance.off('score-updated', handleScoreUpdate);
      socketInstance.off('tournament-match-event', handleScoreUpdate);
      socketInstance.off('match-event-added', handleScoreUpdate);
      socketInstance.off('match-status-changed', handleStatusChange);
      socketInstance.off('tournament-match-status-changed', handleStatusChange);
      socketInstance.off('bracket-updated', handleBracketUpdate);
      socketInstance.off('tournament:bracket_updated', handleBracketUpdate);
    };
  }, [dispatch, id, refreshAllTournamentData]);

  // Join match rooms for all extracted matches
  useEffect(() => {
    if (localMatches.length > 0) {
      localMatches.forEach(match => {
        if (match._id) {
          joinMatchRoom(match._id);
        }
      });

      return () => {
        localMatches.forEach(match => {
          if (match._id) {
            leaveMatchRoom(match._id);
          }
        });
      };
    }
  }, [localMatches]);

  const handlePrintBoard = () => {
    window.print();
  };

  if (loading && !currentTournament) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading live tournament board...</span>
      </div>
    );
  }

  if (!currentTournament) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <div className="p-8 rounded-3xl glass-panel bg-white/70 border border-slate-200 shadow-sm">
          <Trophy className="mx-auto text-slate-300 mb-3" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Tournament Not Found</h2>
          <p className="text-slate-500 text-sm mt-1">This tournament may have been removed or does not exist.</p>
          <Link to="/tournaments" className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition">
            Browse Tournaments
          </Link>
        </div>
      </div>
    );
  }

  // Filter match groups
  const liveMatches = localMatches.filter(m => m.status === 'live' || m.status === 'in_progress');
  const upcomingMatches = localMatches.filter(m => m.status === 'scheduled' || m.status === 'pending');
  const completedMatches = localMatches.filter(m => m.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="container mx-auto px-3 sm:px-6 py-4 md:py-8 max-w-7xl">
        
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <Link 
            to={`/tournaments/${id}`} 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors w-fit"
          >
            <ChevronLeft size={18} />
            <span>Tournament Overview</span>
          </Link>

          {/* Connection Status Pill & Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm transition-all ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <Wifi size={13} className="text-emerald-600" />
                  <span>Live Sync</span>
                </>
              ) : connectionStatus === 'reconnecting' ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-amber-600" />
                  <span>Reconnecting</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} className="text-rose-600" />
                  <span>Offline</span>
                </>
              )}
            </div>

            <button
              onClick={refreshAllTournamentData}
              title="Manually refresh board"
              className="p-1.5 bg-white text-slate-600 hover:text-blue-600 rounded-full border border-slate-200 shadow-sm transition hover:shadow"
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={handlePrintBoard}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full border border-slate-200 shadow-sm transition hover:shadow"
            >
              <Printer size={13} className="text-blue-500" />
              <span className="hidden sm:inline">Print Board</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden p-5 sm:p-8 rounded-3xl md:rounded-[36px] bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl mb-6 md:mb-8 border border-white/10">
          <div className="absolute top-0 right-0 p-8 text-blue-500/10 pointer-events-none">
            <Trophy size={160} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-extrabold text-[11px] uppercase tracking-wider border border-blue-400/30">
                  {currentTournament.sport || 'Sports'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  currentTournament.status === 'ongoing' ? 'bg-red-500/30 text-red-300 border-red-400/30 animate-pulse' :
                  currentTournament.status === 'completed' ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30' :
                  'bg-amber-500/30 text-amber-300 border-amber-400/30'
                }`}>
                  {currentTournament.status || 'Scheduled'}
                </span>
                {currentTournament.isVerified && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 font-bold text-[11px]">
                    ✓ Verified Tournament
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight text-white mb-1.5">
                {currentTournament.name}
              </h1>
              <p className="text-blue-200/80 text-xs sm:text-sm font-medium flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-blue-400" />
                  {currentTournament.dates?.tournamentStart ? new Date(currentTournament.dates.tournamentStart).toLocaleDateString() : 'Dates TBA'}
                </span>
                {currentTournament.venue?.name && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-blue-400" />
                    {currentTournament.venue.name}
                  </span>
                )}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 shrink-0">
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-bold text-blue-300/70">Live</span>
                <span className="text-lg sm:text-2xl font-black text-rose-400">{liveMatches.length}</span>
              </div>
              <div className="text-center px-2 border-x border-white/10">
                <span className="block text-[10px] uppercase font-bold text-blue-300/70">Matches</span>
                <span className="text-lg sm:text-2xl font-black text-white">{localMatches.length}</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-[10px] uppercase font-bold text-blue-300/70">Teams</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-400">{currentTournament.registeredTeams?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Broadcast Ticker */}
        <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-rose-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Live Broadcast Ticker
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Zero-Refresh Live Feed
            </span>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 text-xs">
            {commentaryFeed.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-0.5 text-slate-700">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-500 shrink-0">
                  {item.time}
                </span>
                <p className="truncate font-medium flex-1">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* View Selection Tabs (Responsive Horizontal Scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {[
            { id: 'all', label: 'All Matches', count: localMatches.length, icon: Activity },
            { id: 'live', label: 'Live Now', count: liveMatches.length, icon: Flame, color: 'text-rose-500' },
            { id: 'upcoming', label: 'Upcoming', count: upcomingMatches.length, icon: Clock },
            { id: 'results', label: 'Results', count: completedMatches.length, icon: CheckCircle2, color: 'text-emerald-500' },
            { id: 'bracket', label: 'Bracket Tree', icon: GitBranch },
            { id: 'standings', label: 'Standings', icon: Table }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 shadow-sm'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : tab.color || 'text-slate-500'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Bracket Tree View */}
        {activeTab === 'bracket' && (
          <div className="bg-white/80 rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Single-Elimination Knockout Tree</h3>
                <p className="text-xs text-slate-500">Winners advance automatically through rounds upon match completion</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                Live Progression Active
              </span>
            </div>

            <BracketComponent bracket={bracket} matches={localMatches} />
          </div>
        )}

        {/* TAB 2: Standings Table View */}
        {activeTab === 'standings' && (
          <div className="bg-white/80 rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800">Tournament Standings & Leaderboard</h3>
              <p className="text-xs text-slate-500">Points table and ranking statistics</p>
            </div>
            <StandingsTable standings={standings} />
          </div>
        )}

        {/* TAB 3: Match Cards (All, Live, Upcoming, or Results) */}
        {activeTab !== 'bracket' && activeTab !== 'standings' && (
          <div className="space-y-6">
            {/* Live Matches Section (Always prominently highlighted if exists in 'all' view) */}
            {(activeTab === 'all' || activeTab === 'live') && liveMatches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Flame size={18} className="text-rose-500" /> Live In-Progress Matches
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map(match => (
                    <div 
                      key={match._id}
                      className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-rose-300 shadow-md relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-extrabold text-blue-600 uppercase tracking-wider">{match.roundName || `Round ${match.round || 1}`}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px] animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> LIVE
                        </span>
                      </div>

                      {/* Team Matchup & Score */}
                      <div className="space-y-2.5 my-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 font-bold text-slate-800 text-sm sm:text-base">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                              {match.homeTeam?.name?.substring(0, 2).toUpperCase() || 'H'}
                            </div>
                            <span>{match.homeTeam?.name || 'TBD'}</span>
                          </div>
                          <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                            {match.score?.home ?? match.result?.homeScore ?? 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 font-bold text-slate-800 text-sm sm:text-base">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                              {match.awayTeam?.name?.substring(0, 2).toUpperCase() || 'A'}
                            </div>
                            <span>{match.awayTeam?.name || 'TBD'}</span>
                          </div>
                          <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                            {match.score?.away ?? match.result?.awayScore ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Sport Specific Breakdown (Sets or Cricket) */}
                      {match.sportType === 'points' && match.setsData?.sets && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-semibold">Set Scores:</span>
                            {match.setsData.sets.map((set, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[11px]">
                                {set.homeScore}-{set.awayScore}
                              </span>
                            ))}
                          </div>
                          <span className="font-bold text-blue-600 text-[11px]">
                            {match.setsData.statusLabel || `Set ${match.setsData.currentSet || 1}`}
                          </span>
                        </div>
                      )}

                      {match.sportType === 'cricket' && match.cricketData?.innings && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-slate-700">
                            <span>{match.homeTeam?.name}: {match.cricketData.innings[0]?.runs}/{match.cricketData.innings[0]?.wickets} ({match.cricketData.innings[0]?.overs}.{match.cricketData.innings[0]?.balls} ov)</span>
                            {match.cricketData.innings[1] && (
                              <span>{match.awayTeam?.name}: {match.cricketData.innings[1]?.runs}/{match.cricketData.innings[1]?.wickets} ({match.cricketData.innings[1]?.overs}.{match.cricketData.innings[1]?.balls} ov)</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action */}
                      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Real-time socket updates</span>
                        <Link 
                          to={`/tournaments/${id}/matches/${match._id}/score`}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          Scoring Console
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Matches */}
            {(activeTab === 'all' || activeTab === 'upcoming') && upcomingMatches.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock size={18} className="text-blue-500" /> Upcoming Matches
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {upcomingMatches.map(match => (
                    <div 
                      key={match._id}
                      className="p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-extrabold text-blue-600 uppercase tracking-wider">{match.roundName || `Round ${match.round || 1}`}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                          Scheduled
                        </span>
                      </div>

                      <div className="py-2">
                        <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                          <span>{match.homeTeam?.name || 'TBD'}</span>
                          <span className="text-slate-400 font-normal">vs</span>
                          <span>{match.awayTeam?.name || 'TBD'}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Time TBA'}</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                        <Link 
                          to={`/tournaments/${id}/matches/${match._id}/score`}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition"
                        >
                          Launch Score Console
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Results */}
            {(activeTab === 'all' || activeTab === 'results') && completedMatches.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={18} className="text-emerald-500" /> Match Results
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {completedMatches.map(match => {
                    const winnerId = match.result?.winner?._id || match.result?.winner;
                    const homeWinner = winnerId && (String(winnerId) === String(match.homeTeam?._id || match.homeTeam?.id) || winnerId === 'home');
                    const awayWinner = winnerId && (String(winnerId) === String(match.awayTeam?._id || match.awayTeam?.id) || winnerId === 'away');

                    return (
                      <div 
                        key={match._id}
                        className="p-4 bg-white/90 rounded-2xl border border-emerald-200/80 shadow-sm flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-extrabold text-slate-600 uppercase tracking-wider">{match.roundName || `Round ${match.round || 1}`}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                            Final
                          </span>
                        </div>

                        <div className="space-y-1.5 py-1">
                          <div className={`flex justify-between items-center text-sm ${homeWinner ? 'font-black text-slate-900' : 'text-slate-600'}`}>
                            <span className="flex items-center gap-1.5">
                              {homeWinner && <Trophy size={14} className="text-amber-500" />}
                              {match.homeTeam?.name || 'TBD'}
                            </span>
                            <span className="font-mono font-bold text-base">{match.score?.home ?? match.result?.homeScore ?? 0}</span>
                          </div>

                          <div className={`flex justify-between items-center text-sm ${awayWinner ? 'font-black text-slate-900' : 'text-slate-600'}`}>
                            <span className="flex items-center gap-1.5">
                              {awayWinner && <Trophy size={14} className="text-amber-500" />}
                              {match.awayTeam?.name || 'TBD'}
                            </span>
                            <span className="font-mono font-bold text-base">{match.score?.away ?? match.result?.awayScore ?? 0}</span>
                          </div>
                        </div>

                        {match.result?.details && (
                          <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {match.result.details}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state if no matches in selected tab */}
            {activeTab === 'live' && liveMatches.length === 0 && (
              <div className="text-center py-12 bg-white/60 rounded-3xl border border-slate-200">
                <Flame className="mx-auto text-slate-300 mb-2" size={36} />
                <p className="font-bold text-slate-700">No Live Matches At The Moment</p>
                <p className="text-xs text-slate-400 mt-1">Live scores will appear automatically as matches start.</p>
              </div>
            )}

            {activeTab === 'upcoming' && upcomingMatches.length === 0 && (
              <div className="text-center py-12 bg-white/60 rounded-3xl border border-slate-200">
                <Clock className="mx-auto text-slate-300 mb-2" size={36} />
                <p className="font-bold text-slate-700">No Upcoming Matches</p>
                <p className="text-xs text-slate-400 mt-1">All scheduled matches for this tournament have completed.</p>
              </div>
            )}

            {activeTab === 'results' && completedMatches.length === 0 && (
              <div className="text-center py-12 bg-white/60 rounded-3xl border border-slate-200">
                <CheckCircle2 className="mx-auto text-slate-300 mb-2" size={36} />
                <p className="font-bold text-slate-700">No Match Results Yet</p>
                <p className="text-xs text-slate-400 mt-1">Results will be posted here as matches conclude.</p>
              </div>
            )}
          </div>
        )}

        {/* Tournament Venue Map (Bottom of Live Board) */}
        {currentTournament.venue?.coordinates && (
          <div className="mt-8 bg-white/80 rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <MapPin size={16} className="text-blue-500" /> Tournament Venue Location
            </h3>
            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-200">
              <MapContainer 
                center={[currentTournament.venue.coordinates.lat || 0, currentTournament.venue.coordinates.lng || 0]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={[currentTournament.venue.coordinates.lat || 0, currentTournament.venue.coordinates.lng || 0]}>
                  <Popup>
                    <strong>{currentTournament.venue.name}</strong><br/>
                    {currentTournament.venue.address}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LiveTournamentBoard;

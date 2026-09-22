import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, BarChart2, Users, Plus, Activity, CheckCircle2 } from 'lucide-react';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const CricketHub = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [popularTeams, setPopularTeams] = useState([]);

  useEffect(() => {
    const fetchCricketData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLiveMatches([
          {
            id: '1', matchTitle: 'Super Kings vs Royal Challengers',
            teams: { team1Name: 'Super Kings', team2Name: 'Royal Challengers' },
            innings: [{ teamName: 'Super Kings', totalRuns: 186, wickets: 4, overs: 18, balls: 3 }],
            venue: 'Central Stadium', matchType: 'T20'
          },
          {
            id: '2', matchTitle: 'Mumbai Indians vs Delhi Capitals',
            teams: { team1Name: 'Mumbai Indians', team2Name: 'Delhi Capitals' },
            innings: [
              { teamName: 'Mumbai Indians', totalRuns: 212, wickets: 6, overs: 20, balls: 0 },
              { teamName: 'Delhi Capitals', totalRuns: 95, wickets: 3, overs: 9, balls: 2 }
            ],
            venue: 'Metro Ground', matchType: 'T20'
          }
        ]);
        
        setUpcomingMatches([
          {
            id: '3', matchTitle: 'Kolkata Knight Riders vs Lucknow Giants',
            teams: { team1Name: 'Kolkata Knight Riders', team2Name: 'Lucknow Giants' },
            date: '2025-08-15T14:30:00', venue: 'Eden Gardens', matchType: 'T20'
          },
          {
            id: '4', matchTitle: 'Sunrisers vs Gujarat Titans',
            teams: { team1Name: 'Sunrisers', team2Name: 'Gujarat Titans' },
            date: '2025-08-16T18:00:00', venue: 'Hyderabad Stadium', matchType: 'T20'
          }
        ]);
        
        setRecentMatches([
          {
            id: '6', matchTitle: 'Super Kings vs Mumbai Indians',
            teams: { team1Name: 'Super Kings', team2Name: 'Mumbai Indians' },
            result: { winnerName: 'Super Kings', description: 'Super Kings won by 24 runs' },
            date: '2025-08-10', venue: 'Chennai Stadium', matchType: 'T20'
          },
          {
            id: '7', matchTitle: 'Delhi Capitals vs Kolkata Knight Riders',
            teams: { team1Name: 'Delhi Capitals', team2Name: 'Kolkata Knight Riders' },
            result: { winnerName: 'Kolkata Knight Riders', description: 'Kolkata Knight Riders won by 6 wickets' },
            date: '2025-08-09', venue: 'Delhi Stadium', matchType: 'T20'
          }
        ]);
        
        setPopularTeams([
          { id: '1', name: 'Super Kings', wins: 24, losses: 9, draws: 2 },
          { id: '2', name: 'Mumbai Indians', wins: 22, losses: 10, draws: 3 },
          { id: '3', name: 'Royal Challengers', wins: 18, losses: 12, draws: 5 }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching cricket data:', error);
        showToast('Failed to load cricket data', 'error');
        setIsLoading(false);
      }
    };

    fetchCricketData();
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Trophy className="text-blue-500" size={32} />
            Cricket Hub
          </h1>
          <p className="text-slate-500 font-medium">Live matches, scoring, and tournaments</p>
        </div>
        <Link 
          to="/cricket/create-match" 
          className="inline-flex items-center px-4 md:px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={20} className="mr-2" />
          Create Match
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Main Content (Live & Upcoming) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Live Matches */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <div className="flex justify-between items-center mb-4 md:mb-6 pb-4 border-b border-white/50">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                <span className="relative flex h-3 w-3 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                Live Matches
              </h2>
              <Link to="/cricket" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                View All
              </Link>
            </div>
            
            {liveMatches.length > 0 ? (
              <div className="space-y-4">
                {liveMatches.map(match => (
                  <Link key={match.id} to={`/cricket/${match.id}`} className="block">
                    <div className="p-4 md:p-6 rounded-2xl bg-white/60 border border-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{match.matchTitle}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {match.venue} • {match.matchType}
                          </p>
                        </div>
                        <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-600 rounded-full">
                          Live
                        </span>
                      </div>
                      
                      <div className="space-y-3 bg-white/50 rounded-xl p-4 border border-white">
                        {match.innings.map((inning, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{inning.teamName}</span>
                            <div className="text-right">
                              <span className="font-black text-xl text-slate-800 tracking-tight">
                                {inning.totalRuns}<span className="text-slate-400 text-lg">/{inning.wickets}</span>
                              </span>
                              <span className="text-xs font-bold text-slate-400 ml-2">
                                ({inning.overs}.{inning.balls} ov)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Link 
                          to={`/cricket/${match.id}/score`}
                          className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <Activity size={16} className="mr-2" /> Score Match
                        </Link>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 md:py-6 md:py-12">
                <Activity size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-bold text-slate-600">No live matches right now</p>
              </div>
            )}
          </div>
          
          {/* Upcoming Matches */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <div className="flex justify-between items-center mb-4 md:mb-6 pb-4 border-b border-white/50">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                <Calendar className="mr-3 text-indigo-500" size={24} />
                Upcoming Matches
              </h2>
            </div>
            
            {upcomingMatches.length > 0 ? (
              <div className="space-y-4">
                {upcomingMatches.map(match => (
                  <div key={match.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/60 border border-white shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Calendar className="text-indigo-500" size={20} />
                      </div>
                      <div>
                        <Link to={`/cricket/${match.id}`}>
                          <h3 className="font-extrabold text-slate-800 hover:text-indigo-600 transition-colors">{match.matchTitle}</h3>
                        </Link>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {match.venue} • {match.matchType}
                        </p>
                        <p className="text-sm font-bold text-indigo-500 mt-1">{formatDateTime(match.date)}</p>
                      </div>
                    </div>
                    <Link 
                      to={`/cricket/${match.id}/edit`}
                      className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm shrink-0 text-center"
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 md:py-6 md:py-12">
                <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-bold text-slate-600">No upcoming matches</p>
              </div>
            )}
          </div>

        </div>
        
        {/* Sidebar (Results & Teams) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Recent Results */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center mb-4 md:mb-6 pb-4 border-b border-white/50">
              <BarChart2 className="mr-3 text-emerald-500" size={24} />
              Recent Results
            </h2>
            
            {recentMatches.length > 0 ? (
              <div className="space-y-4">
                {recentMatches.map(match => (
                  <Link key={match.id} to={`/cricket/${match.id}`} className="block p-4 rounded-2xl bg-white/60 border border-white shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-1 line-clamp-1">{match.matchTitle}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {new Date(match.date).toLocaleDateString()} • {match.matchType}
                    </p>
                    <div className="bg-emerald-50 rounded-xl p-3 flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-emerald-700 leading-snug">{match.result.description}</p>
                    </div>
                  </Link>
                ))}
                <Link to="/cricket?filter=completed" className="block text-center pt-2 text-sm font-bold text-emerald-600 hover:text-emerald-800">
                  View All Results
                </Link>
              </div>
            ) : (
              <p className="text-center py-4 md:py-8 font-bold text-slate-500">No recent matches</p>
            )}
          </div>
          
          {/* Popular Teams */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center mb-4 md:mb-6 pb-4 border-b border-white/50">
              <Users className="mr-3 text-purple-500" size={24} />
              Top Teams
            </h2>
            
            {popularTeams.length > 0 ? (
              <div className="space-y-3">
                {popularTeams.map((team, index) => (
                  <Link key={team.id} to={`/teams/${team.id}`} className="flex items-center p-3 rounded-2xl bg-white/60 border border-white shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shrink-0 border border-purple-100 mr-3">
                      <span className="font-black text-purple-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 text-sm truncate">{team.name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 flex gap-2 mt-0.5">
                        <span className="text-emerald-600">{team.wins}W</span>
                        <span className="text-rose-600">{team.losses}L</span>
                        <span className="text-slate-400">{team.draws}D</span>
                      </p>
                    </div>
                  </Link>
                ))}
                <Link to="/teams" className="block text-center pt-4 text-sm font-bold text-purple-600 hover:text-purple-800">
                  View All Teams
                </Link>
              </div>
            ) : (
              <p className="text-center py-4 md:py-8 font-bold text-slate-500">No teams available</p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CricketHub;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Share2, 
  Download, 
  Printer, 
  Trophy, 
  Activity, 
  CircleDot, 
  ArrowLeft,
  Calendar,
  MapPin
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import matchService from '../../services/matchService';

const StatusBadge = ({ status }) => {
  const colors = {
    live: 'bg-red-50 text-red-600 border-red-200',
    completed: 'bg-green-50 text-green-600 border-green-200',
    scheduled: 'bg-blue-50 text-blue-600 border-blue-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    postponed: 'bg-amber-50 text-amber-600 border-amber-200'
  };
  
  return (
    <div className={`text-xs font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full inline-flex items-center border ${colors[status] || 'bg-slate-100'}`}>
      {status === 'live' && (
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
      )}
      {status}
    </div>
  );
};

// Keeping the simplified scorecard components for brevity but styled with glassmorphism
const GenericScorecard = ({ match }) => {
  return (
    <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
      <div className="mb-4 md:mb-8">
        <h3 className="text-xl font-extrabold text-slate-800 mb-4 tracking-tight">Match Result</h3>
        <div className="p-5 bg-white/60 rounded-2xl border border-white">
          <p className="text-slate-700 font-bold">{match.result?.summary || 'Match completed'}</p>
        </div>
      </div>
      
      <div className="bg-white/80 rounded-2xl border border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-4 md:px-6 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/50">Team</th>
                <th className="py-4 px-4 md:px-6 text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/50">Score</th>
                <th className="py-4 px-4 md:px-6 text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/50">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white/40 hover:bg-white/60 transition-colors">
                <td className="py-4 px-4 md:px-6 text-sm font-extrabold text-slate-800 border-b border-slate-200/50">
                  {match.teams.team1.name}
                </td>
                <td className="py-4 px-4 md:px-6 text-sm text-center font-bold text-slate-600 border-b border-slate-200/50">
                  {match.teams.team1.score}
                </td>
                <td className="py-4 px-4 md:px-6 text-sm text-center font-bold text-slate-600 border-b border-slate-200/50">
                  {match.teams.team1.score > match.teams.team2.score ? 'Winner' : ''}
                </td>
              </tr>
              <tr className="bg-white/40 hover:bg-white/60 transition-colors">
                <td className="py-4 px-4 md:px-6 text-sm font-extrabold text-slate-800 border-b border-slate-200/50">
                  {match.teams.team2.name}
                </td>
                <td className="py-4 px-4 md:px-6 text-sm text-center font-bold text-slate-600 border-b border-slate-200/50">
                  {match.teams.team2.score}
                </td>
                <td className="py-4 px-4 md:px-6 text-sm text-center font-bold text-slate-600 border-b border-slate-200/50">
                  {match.teams.team2.score > match.teams.team1.score ? 'Winner' : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MatchDetails = () => {
  const { matchId } = useParams();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  
  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await matchService.getMatch(matchId);
        
        let matchData = null;
        if (response.success && response.data) {
          matchData = response.data;
        } else if (response.data && response.data.data) {
          matchData = response.data.data;
        }

        if (!matchData) {
          throw new Error('Match not found');
        }

        // Format data to match component expectations if needed
        const formattedMatch = {
          id: matchData._id || matchData.id,
          sport: matchData.sport || 'cricket',
          status: matchData.status || 'scheduled',
          date: matchData.scheduledTime || matchData.date || matchData.createdAt || new Date().toISOString(),
          venue: matchData.venue || { name: 'Local Venue' },
          format: matchData.format || 'Standard',
          teams: {
            team1: {
              name: matchData.homeTeamName || matchData.homeTeam?.name || 'Home Team',
              score: matchData.homeTeamScore || 0,
              wickets: matchData.homeTeamWickets || 0
            },
            team2: {
              name: matchData.awayTeamName || matchData.awayTeam?.name || 'Away Team',
              score: matchData.awayTeamScore || 0,
              wickets: matchData.awayTeamWickets || 0
            }
          },
          result: matchData.result || { summary: matchData.status === 'completed' ? 'Match completed' : 'Match in progress' },
          scorecard: matchData.scorecard || null
        };

        setMatch(formattedMatch);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching match details:', error);
        setLoading(false);
      }
    };
    
    fetchMatchDetails();
  }, [matchId]);
  
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleDownloadScorecard = () => alert('Downloading scorecard...');
  const handlePrintScorecard = () => window.print();
  
  const handleShareMatch = () => {
    if (navigator.share) {
      navigator.share({
        title: `${match.teams.team1.name} vs ${match.teams.team2.name}`,
        text: `Check out this ${match.sport} match: ${match.teams.team1.name} vs ${match.teams.team2.name}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-4xl">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40 border border-white text-center">
          <Activity className="text-slate-300 mx-auto mb-4 md:mb-6" size={64} />
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Match Not Found</h2>
          <p className="text-slate-500 font-medium mb-4 md:mb-8">
            The match you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/matches"
            className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-sm"
          >
            <ArrowLeft className="mr-2" size={18} />
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-5xl">
      <Link
        to="/matches"
        className="inline-flex items-center text-slate-500 hover:text-blue-500 font-bold mb-4 md:mb-6 transition-colors group"
      >
        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
        Back to Matches
      </Link>
      
      {/* Match Header */}
      <div className="p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-white/40 border border-white mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 bg-white/60 rounded-full border border-white flex items-center shadow-sm">
              <CircleDot className="text-blue-500 mr-2" size={16} />
              <span className="text-sm font-bold text-slate-700 capitalize">{match.sport}</span>
            </div>
            <StatusBadge status={match.status} />
          </div>
          
          <div className="flex space-x-3">
            {match.status === 'completed' && (
              <>
                <button
                  onClick={handleDownloadScorecard}
                  className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-600 hover:bg-white hover:text-blue-500 transition-all shadow-sm"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={handlePrintScorecard}
                  className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-600 hover:bg-white hover:text-blue-500 transition-all shadow-sm"
                  title="Print"
                >
                  <Printer size={18} />
                </button>
              </>
            )}
            <button
              onClick={handleShareMatch}
              className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-600 hover:bg-white hover:text-blue-500 transition-all shadow-sm"
              title="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 md:gap-12 mb-4 md:mb-6 md:mb-10 py-4 md:py-6">
          <div className="text-center md:w-1/3">
            <div className="w-16 md:w-24 h-16 md:h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4">
              <span className="text-xl md:text-3xl font-black text-blue-600">{match.teams.team1.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">{match.teams.team1.name}</h2>
          </div>
          
          <div className="text-center shrink-0">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">VS</div>
            {(match.status === 'completed' || match.status === 'live') && (
              <div className="flex items-center justify-center gap-4">
                <span className="text-2xl md:text-4xl font-black text-slate-800">{match.teams.team1.score}</span>
                <span className="text-xl font-bold text-slate-400">-</span>
                <span className="text-2xl md:text-4xl font-black text-slate-800">{match.teams.team2.score}</span>
              </div>
            )}
          </div>
          
          <div className="text-center md:w-1/3">
            <div className="w-16 md:w-24 h-16 md:h-24 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4">
              <span className="text-xl md:text-3xl font-black text-emerald-600">{match.teams.team2.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">{match.teams.team2.name}</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 md:mb-8">
          <div className="p-4 bg-white/60 rounded-2xl border border-white flex items-center justify-center gap-3">
            <Calendar className="text-blue-500" size={18} />
            <span className="text-sm font-bold text-slate-700">{formatDate(match.date)}</span>
          </div>
          <div className="p-4 bg-white/60 rounded-2xl border border-white flex items-center justify-center gap-3">
            <MapPin className="text-blue-500" size={18} />
            <span className="text-sm font-bold text-slate-700">{match.venue?.name || 'Local Venue'}</span>
          </div>
          <div className="p-4 bg-white/60 rounded-2xl border border-white flex items-center justify-center gap-3">
            <Trophy className="text-blue-500" size={18} />
            <span className="text-sm font-bold text-slate-700">{match.format || 'Standard Format'}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="text-center">
          {match.status === 'live' ? (
            <Link
              to={`/matches/score/${match.sport}/${match.id}`}
              className="inline-flex items-center justify-center px-4 md:px-8 py-4 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-all shadow-[0_4px_14px_0_rgb(239,68,68,0.39)] hover:-translate-y-0.5"
            >
              Continue Scoring
            </Link>
          ) : match.status === 'scheduled' ? (
            <Link
              to={`/matches/score/${match.sport}/${match.id}`}
              className="inline-flex items-center justify-center px-4 md:px-8 py-4 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:-translate-y-0.5"
            >
              Start Match
            </Link>
          ) : null}
        </div>
      </div>
      
      {/* Scorecard */}
      {match.status === 'completed' && (
        <GenericScorecard match={match} />
      )}
      
    </div>
  );
};

export default MatchDetails;

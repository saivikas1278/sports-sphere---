import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Network, Trophy, Settings, RefreshCcw, ArrowLeft, Download, Loader2 } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import tournamentService from '../../services/tournamentService';
import { toast } from 'react-toastify';

const TournamentBracket = () => {
  const { id } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [bracketExists, setBracketExists] = useState(false);
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState({});
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);

  const fetchTournamentAndMatches = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch tournament details
      const tourneyRes = await tournamentService.getTournament(id);
      if (tourneyRes.data) setTournament(tourneyRes.data.data || tourneyRes.data);

      // Fetch matches
      const matchesRes = await tournamentService.getMatches(id);
      const fetchedMatches = matchesRes.data.data || matchesRes.data || [];
      
      if (fetchedMatches.length > 0) {
        setBracketExists(true);
        setMatches(fetchedMatches);
        
        // Group matches by round
        const groupedRounds = {};
        fetchedMatches.forEach(match => {
          const roundName = match.round || 'unknown';
          if (!groupedRounds[roundName]) {
            groupedRounds[roundName] = [];
          }
          groupedRounds[roundName].push(match);
        });
        setRounds(groupedRounds);
      }
    } catch (error) {
      console.error('Error fetching bracket:', error);
      toast.error('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournamentAndMatches();
  }, [fetchTournamentAndMatches]);

  const generateBracket = async () => {
    try {
      setIsGenerating(true);
      await tournamentService.startTournament(id);
      toast.success('Bracket generated successfully!');
      fetchTournamentAndMatches();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to generate bracket');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTeamName = (teamObj) => {
    if (!teamObj) return 'TBD';
    return typeof teamObj === 'object' ? teamObj.name : 'Unknown';
  };

  const MatchNode = ({ match }) => {
    const homeScore = match.result?.homeScore ?? match.score1 ?? null;
    const awayScore = match.result?.awayScore ?? match.score2 ?? null;
    
    return (
      <div className={`p-3 w-48 rounded-2xl border-2 ${match.status === 'ongoing' || match.status === 'live' ? 'bg-blue-50 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : match.status === 'completed' ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200'} transition-all`}>
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${match.status === 'ongoing' || match.status === 'live' ? 'bg-blue-500 text-white animate-pulse' : match.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
            {match.status.toUpperCase()}
          </span>
          {(match.status === 'ongoing' || match.status === 'live') && <span className="text-[10px] text-blue-500 font-bold">LIVE</span>}
        </div>
        <div className="space-y-1">
          <div className={`flex justify-between items-center text-sm ${homeScore !== null && awayScore !== null && homeScore > awayScore ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
            <span className="truncate pr-2">{getTeamName(match.homeTeam)}</span>
            <span>{homeScore !== null ? homeScore : '-'}</span>
          </div>
          <div className={`flex justify-between items-center text-sm ${homeScore !== null && awayScore !== null && awayScore > homeScore ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
            <span className="truncate pr-2">{getTeamName(match.awayTeam)}</span>
            <span>{awayScore !== null ? awayScore : '-'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Determine round order (simple heuristic: more matches = earlier round)
  const sortedRoundNames = Object.keys(rounds).sort((a, b) => rounds[b].length - rounds[a].length);

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/tournaments/${id}`} className="p-2 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                <Network className="text-blue-500" />
                Tournament Bracket
              </h1>
              <p className="text-slate-500 font-medium mt-1">{tournament?.name || 'View tournament progress'}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Download size={18} /> Export
            </button>
            <button 
              onClick={generateBracket}
              disabled={isGenerating || (bracketExists && tournament?.status !== 'draft')}
              className={`px-4 py-2 text-white rounded-xl font-bold transition-colors flex items-center gap-2 ${bracketExists && tournament?.status !== 'draft' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {isGenerating ? (
                <><Loader2 size={18} className="animate-spin" /> Generating...</>
              ) : bracketExists ? (
                'Regenerate'
              ) : (
                'Generate Bracket'
              )}
            </button>
          </div>
        </div>

        {bracketExists && sortedRoundNames.length > 0 ? (
          <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/60 overflow-x-auto">
            <div className="flex gap-16 min-w-max items-center">
              {sortedRoundNames.map((roundName, roundIndex) => {
                const roundMatches = rounds[roundName];
                const isFinal = roundIndex === sortedRoundNames.length - 1;
                
                return (
                  <div key={roundName} className={`flex flex-col ${isFinal ? 'gap-4 md:gap-8' : roundIndex === 0 ? 'gap-4 md:gap-8' : 'gap-12 md:gap-24'}`}>
                    <h3 className={`text-center font-bold mb-2 capitalize ${isFinal ? 'text-amber-500 flex items-center justify-center gap-2' : 'text-slate-400'}`}>
                      {isFinal && <Trophy size={16} />} 
                      {roundName.replace('-', ' ')}
                    </h3>
                    {roundMatches.map((match, matchIndex) => (
                      <div key={match._id} className="relative">
                        {/* Connecting lines for previous round */}
                        {!isFinal && (
                          <div className="absolute top-1/2 -right-8 w-8 h-px bg-slate-300"></div>
                        )}
                        
                        {/* Connecting lines from previous round (if not first round) */}
                        {roundIndex > 0 && !isFinal && (
                          <>
                            <div className={`absolute -left-8 w-8 h-px bg-slate-300 ${matchIndex % 2 === 0 ? 'top-[25%]' : 'top-[75%]'}`}></div>
                            <div className={`absolute -left-8 w-px bg-slate-300 h-16 md:h-24 ${matchIndex % 2 === 0 ? '-top-12' : 'top-1/2'}`}></div>
                          </>
                        )}
                        
                        {/* Lines for final */}
                        {isFinal && roundIndex > 0 && (
                          <>
                            <div className="absolute -left-8 top-1/2 w-8 h-px bg-slate-300"></div>
                            <div className="absolute -left-8 top-[-6rem] w-px h-48 bg-slate-300"></div>
                          </>
                        )}
                        
                        <MatchNode match={match} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 md:py-6 md:py-10 md:py-20 glass-panel rounded-2xl md:rounded-3xl border border-white/60">
            <Network size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Bracket Generated</h2>
            <p className="text-slate-500 mb-4 md:mb-6">
              {tournament?.status === 'draft' || tournament?.status === 'open' 
                ? 'When registration closes, the organizer can generate the bracket.'
                : 'No matches found for this tournament.'}
            </p>
            {(tournament?.organizer === undefined /* logic will be refined later */) && (
              <button 
                onClick={generateBracket}
                disabled={isGenerating}
                className="px-4 md:px-8 py-3 bg-blue-500 text-white rounded-full font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all hover:-translate-y-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Bracket Now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;

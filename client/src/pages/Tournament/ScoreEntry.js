import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Edit3, Check, X, ArrowLeft, Search, Loader2 } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import tournamentService from '../../services/tournamentService';
import { toast } from 'react-toastify';

const ScoreEntry = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  
  // Local state for editing form
  const [editForm, setEditForm] = useState({ score1: 0, score2: 0 });

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tournamentService.getMatches(id);
      const fetchedMatches = res.data?.data || res.data || [];
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleEditClick = (match) => {
    setEditingId(match._id);
    setEditForm({
      score1: match.result?.homeScore ?? 0,
      score2: match.result?.awayScore ?? 0,
    });
  };

  const handleScoreChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const saveScore = async (matchId) => {
    try {
      setSavingId(matchId);
      
      const homeScore = editForm.score1;
      const awayScore = editForm.score2;
      let winner = null;
      if (homeScore > awayScore) winner = 'home';
      else if (awayScore > homeScore) winner = 'away';

      await tournamentService.updateMatchResult(id, matchId, {
        homeScore,
        awayScore,
        winner
      });
      
      toast.success('Score updated successfully!');
      setEditingId(null);
      fetchMatches(); // Refresh matches to show updated data
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save score');
    } finally {
      setSavingId(null);
    }
  };
  
  const getTeamName = (teamObj) => {
    if (!teamObj) return 'TBD';
    return typeof teamObj === 'object' ? teamObj.name : 'Unknown';
  };

  const filteredMatches = matches.filter(m => {
    const t1 = getTeamName(m.homeTeam).toLowerCase();
    const t2 = getTeamName(m.awayTeam).toLowerCase();
    const term = searchTerm.toLowerCase();
    return t1.includes(term) || t2.includes(term);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/tournaments/${id}`} className="p-2 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                <Edit3 className="text-blue-500" />
                Score Entry
              </h1>
              <p className="text-slate-500 font-medium mt-1">Update match scores for this tournament.</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-500">
                  <th className="p-4">Status & Round</th>
                  <th className="p-4 text-right w-1/3">Home Team</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 w-1/3">Away Team</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No matches found.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map(match => {
                    const t1Name = getTeamName(match.homeTeam);
                    const t2Name = getTeamName(match.awayTeam);
                    const isEditing = editingId === match._id;
                    const hScore = match.result?.homeScore ?? 0;
                    const aScore = match.result?.awayScore ?? 0;

                    return (
                      <tr key={match._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center w-max gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                              ${match.status === 'live' || match.status === 'ongoing' ? 'bg-red-50 text-red-600 animate-pulse' : 
                                match.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 
                                'bg-emerald-50 text-emerald-600'}`}>
                              {(match.status === 'live' || match.status === 'ongoing') && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                              {match.status}
                            </span>
                            <span className="text-xs text-slate-500 capitalize font-medium">{match.round?.replace('-', ' ')}</span>
                          </div>
                        </td>
                        
                        <td className="p-4 text-right font-bold text-slate-700">{t1Name}</td>
                        
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                value={editForm.score1} 
                                onChange={(e) => handleScoreChange('score1', e.target.value)}
                                className="w-16 p-2 text-center text-lg font-black bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="font-bold text-slate-300">-</span>
                              <input 
                                type="number" 
                                value={editForm.score2} 
                                onChange={(e) => handleScoreChange('score2', e.target.value)}
                                className="w-16 p-2 text-center text-lg font-black bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-3 text-xl font-black">
                              <span className={hScore > aScore ? 'text-emerald-600' : 'text-slate-700'}>{hScore}</span>
                              <span className="text-slate-300 text-base">-</span>
                              <span className={aScore > hScore ? 'text-emerald-600' : 'text-slate-700'}>{aScore}</span>
                            </div>
                          )}
                        </td>
                        
                        <td className="p-4 font-bold text-slate-700">{t2Name}</td>
                        
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => saveScore(match._id)} 
                                disabled={savingId === match._id}
                                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                              >
                                {savingId === match._id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                              </button>
                              <button 
                                onClick={() => setEditingId(null)} 
                                disabled={savingId === match._id}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleEditClick(match)} 
                              className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                            >
                              <Edit3 size={16} /> Edit Score
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;

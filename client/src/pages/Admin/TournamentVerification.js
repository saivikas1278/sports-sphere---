import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Calendar, Users, Trophy, Loader2, ShieldCheck } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import tournamentService from '../../services/tournamentService';
import { showToast } from '../../utils/toast';

const TournamentVerification = () => {
  const [tournaments, setTournaments] = useState([]);
  const [filterMode, setFilterMode] = useState('pending'); // 'pending' | 'verified' | 'all'
  const [loading, setLoading] = useState(true);

  const fetchPendingTournaments = async () => {
    try {
      setLoading(true);
      const res = await tournamentService.getTournaments({ limit: 50 });
      const list = res.data?.data || res.data || [];
      setTournaments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      showToast('Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTournaments();
  }, []);

  const handleApprove = async (t) => {
    try {
      await tournamentService.updateTournament(t._id, { status: 'open', isVerified: true });
      showToast(`Tournament "${t.name}" verified and approved!`, 'success');
      setTournaments(prev => prev.map(item => item._id === t._id ? { ...item, isVerified: true, status: 'open' } : item));
    } catch (err) {
      showToast('Failed to verify tournament', 'error');
    }
  };

  const handleReject = async (t) => {
    try {
      await tournamentService.updateTournament(t._id, { status: 'cancelled' });
      showToast(`Tournament "${t.name}" rejected`, 'info');
      setTournaments(prev => prev.map(item => item._id === t._id ? { ...item, status: 'cancelled' } : item));
    } catch (err) {
      showToast('Failed to reject tournament', 'error');
    }
  };

  const pendingTournaments = tournaments.filter(t => !t.isVerified || t.status === 'review' || t.status === 'pending');
  const verifiedTournaments = tournaments.filter(t => t.isVerified);

  const displayedTournaments = tournaments.filter(t => {
    if (filterMode === 'pending') return !t.isVerified || t.status === 'review' || t.status === 'pending';
    if (filterMode === 'verified') return t.isVerified;
    return true;
  });

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-blue-500" /> Tournament Verification
            </h1>
            <p className="text-slate-500 font-medium mt-1">Review and approve tournaments to ensure legitimacy and verified status.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Review ({pendingTournaments.length})
            </button>
            <button
              onClick={() => setFilterMode('verified')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'verified' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified ({verifiedTournaments.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tournaments.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="animate-spin text-blue-500" size={36} />
          </div>
        ) : (
          <div className="grid gap-3 md:gap-6">
            {displayedTournaments.map((tournament) => {
              const organizerName = tournament.organizer 
                ? (typeof tournament.organizer === 'object' ? `${tournament.organizer.firstName || ''} ${tournament.organizer.lastName || ''}`.trim() : 'Organizer')
                : 'Unknown Organizer';
              const locationStr = tournament.venue?.name || tournament.venue?.city || 'Venue to be announced';
              const dateStr = tournament.dates?.tournamentStart 
                ? `${new Date(tournament.dates.tournamentStart).toLocaleDateString()} - ${new Date(tournament.dates.tournamentEnd || tournament.dates.tournamentStart).toLocaleDateString()}`
                : 'Dates TBA';

              return (
                <div key={tournament._id} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 border border-white/60 hover:shadow-lg transition-all">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-slate-800">{tournament.name}</h2>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider
                        ${tournament.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 
                          tournament.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tournament.status || 'review'}
                      </span>
                      {tournament.isVerified && (
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-extrabold rounded-full flex items-center gap-1">
                          <Check size={12} /> Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-3">
                      <span className="flex items-center gap-1"><Trophy size={16} className="text-amber-500" /> {tournament.sport}</span>
                      <span className="flex items-center gap-1"><Users size={16} /> By {organizerName}</span>
                      <span className="flex items-center gap-1"><MapPin size={16} /> {locationStr}</span>
                      <span className="flex items-center gap-1"><Calendar size={16} /> {dateStr}</span>
                    </div>

                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
                        Teams: {tournament.registeredTeams?.length || 0} / {tournament.maxTeams || 16}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
                        Fee: ${tournament.registrationFee || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:flex-col lg:flex-row">
                    {!tournament.isVerified ? (
                      <button 
                        onClick={() => handleApprove(tournament)}
                        className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <Check size={18} /> Verify
                      </button>
                    ) : (
                      <span className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl font-bold text-sm flex items-center gap-1.5">
                        <Check size={16} /> Approved
                      </span>
                    )}
                    <button 
                      onClick={() => handleReject(tournament)}
                      className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Reject
                    </button>
                  </div>

                </div>
              );
            })}

            {displayedTournaments.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-2xl md:rounded-3xl border border-white/60">
                <Check size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">
                  {filterMode === 'pending' ? 'All Caught Up!' : 'No Tournaments Found'}
                </h3>
                <p className="text-slate-500 mt-1">
                  {filterMode === 'pending'
                    ? 'There are no unverified tournaments pending review.'
                    : `No tournaments found in this section.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentVerification;

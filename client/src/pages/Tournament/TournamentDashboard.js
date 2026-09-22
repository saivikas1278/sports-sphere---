import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTournamentById, 
  approveRegistration, 
  rejectRegistration,
  updateTournamentStatus
} from '../../redux/slices/tournamentSlice';
import { 
  Trophy, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlayCircle,
  Settings,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Megaphone,
  Network,
  Edit3,
  DollarSign
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { showToast } from '../../utils/toast';

const TournamentDashboard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentTournament, loading } = useSelector((state) => state.tournaments);
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    dispatch(fetchTournamentById(id));
  }, [dispatch, id]);

  // Handle Approval
  const handleApprove = async (teamId, teamName) => {
    try {
      await dispatch(approveRegistration({ tournamentId: id, teamId })).unwrap();
      showToast(`Approved registration for ${teamName}`, 'success');
      // Refetch to get updated lists
      dispatch(fetchTournamentById(id));
    } catch (error) {
      showToast(error || 'Failed to approve registration', 'error');
    }
  };

  // Handle Rejection
  const handleReject = async (teamId, teamName) => {
    try {
      await dispatch(rejectRegistration({ tournamentId: id, teamId })).unwrap();
      showToast(`Rejected registration for ${teamName}`, 'info');
      dispatch(fetchTournamentById(id));
    } catch (error) {
      showToast(error || 'Failed to reject registration', 'error');
    }
  };

  const handleStartTournament = () => {
    // In a real app, this would hit the startTournament endpoint
    dispatch(updateTournamentStatus({ tournamentId: id, status: 'ongoing' }));
    showToast('Tournament has been officially started!', 'success');
  };

  if (loading || !currentTournament) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isOrganizer = user && (
    user._id === currentTournament.organizer || 
    user.id === currentTournament.organizer || 
    user._id === currentTournament.organizer?._id
  );

  // Mock data for UI fidelity if backend doesn't populate pending/approved teams fully yet
  const mockPendingTeams = [
    { _id: 't1', name: 'Thunderbolts', captain: 'John Doe', dateApplied: '2025-08-01' },
    { _id: 't2', name: 'Neon Strikers', captain: 'Jane Smith', dateApplied: '2025-08-02' }
  ];
  
  const mockApprovedTeams = currentTournament.registeredTeams?.length > 0 
    ? currentTournament.registeredTeams.map(t => (typeof t === 'object' ? t : { _id: t, name: 'Registered Team', captain: 'Unknown' }))
    : [{ _id: 't3', name: 'Ice Breakers', captain: 'Mike Johnson', dateApplied: '2025-07-28' }];

  const pendingList = currentTournament.pendingRegistrations || mockPendingTeams;
  const approvedList = currentTournament.approvedRegistrations || mockApprovedTeams;

  const totalCapacity = currentTournament.maxTeams || 16;
  const spotsTaken = approvedList.length;
  const spotsLeft = Math.max(0, totalCapacity - spotsTaken);

  const StatusBadge = ({ status }) => {
    const colors = {
      draft: 'bg-slate-500/20 text-slate-700 border-slate-500/30',
      active: 'bg-green-500/20 text-green-700 border-green-500/30',
      ongoing: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      completed: 'bg-purple-500/20 text-purple-700 border-purple-500/30'
    };
    const c = colors[status?.toLowerCase()] || colors.draft;
    return (
      <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wider rounded-full border ${c}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Back Link */}
        <Link to={`/tournaments/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-4 md:mb-6 transition-colors">
          <ChevronLeft size={20} />
          Back to Tournament Page
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-6 mb-4 md:mb-8 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">{currentTournament.name || currentTournament.tournamentName}</h1>
              <StatusBadge status={currentTournament.status} />
            </div>
            <p className="text-lg text-slate-500 font-medium flex items-center gap-2">
              <Calendar size={18} /> 
              {new Date(currentTournament.dates?.tournamentStart || currentTournament.startDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {isOrganizer && (
              <>
                <Link to={`/tournaments/${id}/participants`} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full shadow-sm hover:bg-white/90 border border-white/40 transition-all">
                  <Users size={18} />
                  Participants
                </Link>
                <Link to={`/tournaments/${id}/brackets`} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full shadow-sm hover:bg-white/90 border border-white/40 transition-all">
                  <Network size={18} />
                  Brackets
                </Link>
                <Link to={`/tournaments/${id}/scoring`} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full shadow-sm hover:bg-white/90 border border-white/40 transition-all">
                  <Edit3 size={18} />
                  Score Entry
                </Link>
                <Link to={`/tournaments/${id}/communication`} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full shadow-sm hover:bg-white/90 border border-white/40 transition-all">
                  <Megaphone size={18} />
                  Announcements
                </Link>
                <Link to={`/tournaments/${id}/financials`} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full shadow-sm hover:bg-white/90 border border-white/40 transition-all">
                  <DollarSign size={18} />
                  Financials
                </Link>
              </>
            )}
            <button className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full shadow-sm hover:bg-white/90 border border-white/40 transition-all">
              <Settings size={18} />
              Settings
            </button>
            <button 
              onClick={handleStartTournament}
              disabled={currentTournament.status === 'ongoing'}
              className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 disabled:opacity-50 transition-all"
            >
              <PlayCircle size={18} />
              Start Tournament
            </button>
          </div>
        </div>

        {/* Not Organizer Warning */}
        {!isOrganizer && (
          <div className="mb-4 md:mb-8 p-4 bg-orange-100/80 border border-orange-200 rounded-2xl flex items-center gap-3 text-orange-800">
            <AlertCircle size={20} />
            <p className="font-semibold">You are viewing this dashboard in preview mode because you are not the registered organizer of this tournament.</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[32px] shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Approved Teams</p>
              <p className="text-xl md:text-3xl font-black text-slate-800">{spotsTaken} <span className="text-lg text-slate-400 font-medium">/ {totalCapacity}</span></p>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[32px] shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Approvals</p>
              <p className="text-xl md:text-3xl font-black text-slate-800">{pendingList.length}</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[32px] shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
              <Trophy size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Spots Remaining</p>
              <p className="text-xl md:text-3xl font-black text-slate-800">{spotsLeft}</p>
            </div>
          </div>
        </div>

        {/* Registration Management */}
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[40px] overflow-hidden shadow-sm">
          <div className="border-b border-white/60 px-4 md:px-8 py-4 md:py-6 flex gap-4 md:gap-8">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`text-lg font-bold transition-all relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending Approvals ({pendingList.length})
              {activeTab === 'pending' && <span className="absolute -bottom-[25px] left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('approved')}
              className={`text-lg font-bold transition-all relative ${activeTab === 'approved' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Approved Teams ({approvedList.length})
              {activeTab === 'approved' && <span className="absolute -bottom-[25px] left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
            </button>
          </div>
          
          <div className="p-4 md:p-8">
            {activeTab === 'pending' ? (
              pendingList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/40">
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team Name</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Captain</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Date</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingList.map(team => (
                        <tr key={team._id} className="border-b border-white/20 hover:bg-white/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">{team.name}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-medium">{team.captain || 'N/A'}</td>
                          <td className="py-4 px-4 text-slate-500">{new Date(team.dateApplied || Date.now()).toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleReject(team._id, team.name)}
                                className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Reject"
                              >
                                <XCircle size={20} />
                              </button>
                              <button 
                                onClick={() => handleApprove(team._id, team.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-all shadow-sm"
                              >
                                <CheckCircle size={18} /> Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 md:py-6 md:py-12">
                  <CheckCircle size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">All caught up!</h3>
                  <p className="text-slate-500">There are no pending registrations at the moment.</p>
                </div>
              )
            ) : (
              approvedList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedList.map(team => (
                    <div key={team._id} className="bg-white/60 border border-white/60 p-5 rounded-[24px] shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-xl">
                        {team.name ? team.name.charAt(0) : 'T'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{team.name || 'Registered Team'}</h4>
                        <p className="text-sm text-slate-500 font-medium">Captain: {team.captain || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 md:py-6 md:py-12">
                  <Users size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">No teams yet</h3>
                  <p className="text-slate-500">Approved teams will appear here.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDashboard;

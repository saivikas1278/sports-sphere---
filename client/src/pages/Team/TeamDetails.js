import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, MapPin, Trophy, Activity, ArrowLeft, Loader2,
  CheckCircle2, Plus, LogOut, Settings, Check, X
} from 'lucide-react';
import teamService from '../../services/teamService';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const TeamDetails = () => {
  const { id } = useParams();
  const { user } = useSelector(state => state.auth);
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');
  
  // States for actions
  const [isJoining, setIsJoining] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);
  
  // Join Requests
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Invitations and Roles
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('player');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const fetchTeamDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeam(id);
      
      if (response.success && response.data) {
        const teamData = response.data;
        setTeam(teamData);
        
        // Determine user status relative to team
        if (user) {
          const isUserInTeam = teamData.players?.some(p => {
            const playerId = p.user?._id || p.user;
            return playerId === user.id;
          });
          
          const isUserCaptain = teamData.captain?._id === user.id || teamData.captain === user.id;
          
          setIsMember(isUserInTeam || isUserCaptain);
          setIsCaptain(isUserCaptain);
          
          if (isUserCaptain) {
            fetchJoinRequests();
          }
          
          // Note: Backend might need to return if user has a pending request.
          // For now, we mock hasRequested unless backend provides it.
        }
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      showToast('Failed to load team details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const fetchJoinRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await teamService.getJoinRequests(id);
      if (response.success) {
        setJoinRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleJoinRequest = async () => {
    try {
      setIsJoining(true);
      await teamService.sendJoinRequest(id, 'I would like to join your team!');
      showToast('Join request sent successfully', 'success');
      setHasRequested(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeaveTeam = async () => {
    if (window.confirm('Are you sure you want to leave this team?')) {
      try {
        await teamService.leaveTeam(id);
        showToast('You have left the team', 'info');
        fetchTeamDetails();
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to leave team', 'error');
      }
    }
  };

  const handleApproveRequest = async (userId) => {
    try {
      await teamService.acceptJoinRequest(id, userId);
      showToast('Request approved', 'success');
      fetchTeamDetails();
      fetchJoinRequests();
    } catch (error) {
      showToast('Failed to approve request', 'error');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await teamService.rejectJoinRequest(id, userId);
      showToast('Request rejected', 'success');
      fetchJoinRequests();
    } catch (error) {
      showToast('Failed to reject request', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setIsUpdatingRole(true);
      await teamService.updateMemberRole(id, userId, newRole);
      showToast('Role updated successfully', 'success');
      fetchTeamDetails();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleInvitePlayer = async (e) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;
    
    try {
      setIsSendingInvite(true);
      await teamService.invitePlayer(id, inviteUserId, inviteRole);
      showToast('Invitation sent successfully!', 'success');
      setInviteUserId('');
      fetchTeamDetails();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to send invitation', 'error');
    } finally {
      setIsSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Team Not Found</h2>
        <Link to="/teams" className="text-blue-500 font-bold hover:underline">Return to Teams</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      <Link to="/teams" className="inline-flex items-center text-slate-500 hover:text-blue-500 font-bold mb-4 md:mb-6 transition-colors group">
        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
        Back to Teams
      </Link>

      {/* Header Profile Card */}
      <div className="relative mb-4 md:mb-8 rounded-[40px] overflow-hidden glass-panel bg-white/40 border border-white/60">
        <div className="h-40 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 w-full relative">
          {team.banner && (
            <img src={team.banner} alt="Team Banner" className="w-full h-full object-cover mix-blend-overlay opacity-50" />
          )}
        </div>
        
        <div className="px-4 md:px-8 pb-4 md:pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-4 md:mt-8 md:mt-16 gap-3 md:gap-6 relative z-10">
            <div className="flex items-end gap-3 md:gap-6">
              <div className="w-32 h-32 rounded-2xl md:rounded-3xl bg-white shadow-xl flex items-center justify-center p-2 border-4 border-white/50 shrink-0 overflow-hidden">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Users size={48} className="text-slate-300" />
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center text-sm font-bold text-slate-600 bg-white/60 px-3 py-1 rounded-full border border-white/40">
                    <Trophy size={14} className="mr-1.5 text-blue-500" /> {team.sport}
                  </span>
                  <span className="flex items-center text-sm font-medium text-slate-500">
                    <MapPin size={14} className="mr-1.5" /> {team.location || team.homeVenue?.city || 'Location N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              {isCaptain ? (
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-slate-800 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:bg-slate-900 transition-all">
                  <Settings size={18} /> Manage Team
                </button>
              ) : isMember ? (
                <button 
                  onClick={handleLeaveTeam}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-red-50 text-red-600 font-bold rounded-full hover:bg-red-100 border border-red-200 transition-all"
                >
                  <LogOut size={18} /> Leave Team
                </button>
              ) : (
                <button 
                  onClick={handleJoinRequest}
                  disabled={isJoining || hasRequested}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 font-bold rounded-full transition-all shadow-sm ${
                    hasRequested 
                      ? 'bg-amber-100 text-amber-700 border border-amber-200 opacity-80' 
                      : 'bg-blue-500 text-white shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600'
                  }`}
                >
                  {isJoining ? (
                    <><Loader2 className="animate-spin" size={18} /> Requesting...</>
                  ) : hasRequested ? (
                    <><CheckCircle2 size={18} /> Request Sent</>
                  ) : (
                    <><Plus size={18} /> Request to Join</>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {team.description && (
            <div className="mt-4 md:mt-8 text-slate-600 font-medium leading-relaxed max-w-3xl">
              {team.description}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Left Column - Roster & Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tabs Navigation */}
          <div className="flex gap-3 md:gap-6 border-b border-slate-200/50">
            <button 
              onClick={() => setActiveTab('roster')}
              className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'roster' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Roster ({team.players?.length || 0})
              {activeTab === 'roster' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'stats' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Statistics
              {activeTab === 'stats' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
            </button>
            {isCaptain && (
              <button 
                onClick={() => setActiveTab('requests')}
                className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'requests' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Join Requests {joinRequests.length > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{joinRequests.length}</span>}
                {activeTab === 'requests' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white/60">
            
            {activeTab === 'roster' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Captain Card */}
                {team.captain && (
                  <div className="bg-white/60 p-4 rounded-2xl border border-blue-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -z-10" />
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold text-lg shadow-sm border border-white">
                      {(team.captain.firstName?.[0] || 'C')}{(team.captain.lastName?.[0] || '')}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{team.captain.firstName} {team.captain.lastName}</h4>
                      <div className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded mt-1">Captain</div>
                    </div>
                  </div>
                )}
                
                {/* Players */}
                {team.players?.filter(p => {
                  const pid = p.user?._id || p.user;
                  const cid = team.captain?._id || team.captain;
                  return pid !== cid;
                }).map((player, idx) => (
                  <div key={idx} className="bg-white/60 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0 font-bold border border-white">
                        {(player.user?.firstName?.[0] || 'P')}{(player.user?.lastName?.[0] || '')}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700">{player.user?.firstName} {player.user?.lastName}</h4>
                        <span className="text-xs font-medium text-slate-400 capitalize">{player.role || 'Player'}</span>
                      </div>
                    </div>
                    {isCaptain && (
                      <select 
                        className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 cursor-pointer"
                        value={player.role || 'player'}
                        onChange={(e) => handleRoleChange(player.user?._id || player.user, e.target.value)}
                        disabled={isUpdatingRole}
                      >
                        <option value="player">Player</option>
                        <option value="coach">Coach</option>
                        <option value="substitute">Substitute</option>
                      </select>
                    )}
                  </div>
                ))}
                
                {(!team.players || team.players.length === 0) && !team.captain && (
                  <div className="col-span-full py-4 md:py-6 md:py-12 text-center text-slate-500 font-medium">
                    No players in this roster yet.
                  </div>
                )}
              </div>
              
              {isCaptain && (
                <div className="mt-8 pt-8 border-t border-slate-200/50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Invite Player</h3>
                  <form onSubmit={handleInvitePlayer} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Enter User ID..." 
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder-slate-400"
                      value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      required
                    />
                    <select
                      className="px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 cursor-pointer"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="player">Player</option>
                      <option value="coach">Coach</option>
                      <option value="substitute">Substitute</option>
                    </select>
                    <button 
                      type="submit" 
                      disabled={isSendingInvite || !inviteUserId.trim()}
                      className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingInvite ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                      Send Invite
                    </button>
                  </form>
                  </div>
                )}
              </>
            )}

            {activeTab === 'stats' && (
              <div className="text-center py-4 md:py-6 md:py-12">
                <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Team Statistics Coming Soon</h3>
                <p className="text-slate-500 font-medium">Match history and performance metrics will appear here.</p>
              </div>
            )}

            {activeTab === 'requests' && isCaptain && (
              <div className="space-y-4">
                {loadingRequests ? (
                  <div className="flex justify-center py-4 md:py-8"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : joinRequests.length > 0 ? (
                  joinRequests.map(req => (
                    <div key={req._id} className="bg-white/60 p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800">{req.user?.firstName} {req.user?.lastName}</h4>
                        <p className="text-sm font-medium text-slate-500 mt-1">"{req.message || 'I want to join!'}"</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => handleRejectRequest(req.user?._id || req.user)}
                          className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <X size={20} />
                        </button>
                        <button 
                          onClick={() => handleApproveRequest(req.user?._id || req.user)}
                          className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 md:py-6 md:py-12">
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Pending Requests</h3>
                    <p className="text-slate-500 font-medium">When users request to join, they will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar Stats */}
        <div className="space-y-6">
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Team Summary</h2>
            <div className="space-y-4">
              <div className="bg-white/50 p-4 rounded-2xl border border-white">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Type</span>
                <span className="font-bold text-slate-700">{team.type || 'Competitive'}</span>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-white">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Skill Level</span>
                <span className="font-bold text-slate-700">{team.skillLevel || 'Intermediate'}</span>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-white">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Established</span>
                <span className="font-bold text-slate-700">
                  {new Date(team.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long'})}
                </span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TeamDetails;

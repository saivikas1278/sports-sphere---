import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTournamentById, registerForTournament } from '../../redux/slices/tournamentSlice';
import { loadUser } from '../../redux/slices/authSlice';
import { 
  Trophy, Calendar, MapPin, Users, UserPlus, Clock, Info, Medal, 
  X, Search, Trash2, CheckCircle2, Loader2, ArrowLeft, Settings
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { showToast } from '../../utils/toast';
import userService from '../../services/userService';
import teamService from '../../services/teamService';

// Helper function to safely render eligibility object
const renderEligibility = (eligibility) => {
  if (!eligibility) return 'Open to all eligible teams';
  if (typeof eligibility === 'string') return eligibility;
  
  const skillLevel = eligibility.skillLevel || 'All skill levels';
  const genderRestriction = eligibility.genderRestriction === 'none' ? 
    'Open to all genders' : 
    eligibility.genderRestriction || 'Mixed';
  
  return `${skillLevel}, ${genderRestriction}`;
};

const TournamentDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentTournament, loading } = useSelector((state) => state.tournaments);
  const { user } = useSelector((state) => state.auth);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [teamData, setTeamData] = useState({
    name: '',
    shortName: '',
    description: ''
  });
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const [userTeam, setUserTeam] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchTournamentById(id));
    }
  }, [dispatch, id]);

  // Check if user is already registered for this tournament
  const checkUserRegistration = useCallback(async () => {
    if (!user || !currentTournament) return;

    try {
      setUserRegistered(false);
      setUserTeam(null);

      if (currentTournament.registeredTeams && currentTournament.registeredTeams.length > 0) {
        for (const teamId of currentTournament.registeredTeams) {
          try {
            const teamIdString = String(teamId);
            if (!teamIdString || !teamIdString.match(/^[0-9a-fA-F]{24}$/)) {
              continue;
            }
            
            const teamResponse = await teamService.getTeam(teamIdString);
            if (teamResponse.success && teamResponse.data) {
              const team = teamResponse.data;
              
              const isUserInTeam = team.players?.some(player => {
                const playerId = player.user?._id || player.user;
                return playerId === user.id;
              });
              
              const isUserCaptain = team.captain?._id === user.id || team.captain === user.id;
              
              if (isUserInTeam || isUserCaptain) {
                setUserRegistered(true);
                setUserTeam(team);
                return;
              }
            }
          } catch (error) {
            console.error(`Error checking team ${teamId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
    }
  }, [user, currentTournament]);

  useEffect(() => {
    if (user && currentTournament) {
      setUserRegistered(false);
      setUserTeam(null);
      checkUserRegistration();
    }
  }, [user, currentTournament, checkUserRegistration]);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      
      if (!teamData.name.trim()) {
        showToast('Please enter a team name', 'error');
        setIsRegistering(false);
        return;
      }
      
      const players = [
        { user: user.id, role: 'captain', joinedAt: new Date() },
        ...selectedPlayers.map(player => ({ user: player.user, role: 'player', joinedAt: new Date() }))
      ];
      
      const result = await dispatch(registerForTournament({ 
        tournamentId: id, 
        teamData: {
          name: teamData.name.trim(),
          shortName: teamData.shortName.trim() || teamData.name.trim().substring(0, 10),
          description: teamData.description.trim(),
          players: players
        }
      }));
      
      if (registerForTournament.fulfilled.match(result)) {
        showToast('Registration successful! You have joined the tournament.', 'success');
        setShowRegistrationForm(false);
        setTeamData({ name: '', shortName: '', description: '' });
        setSelectedPlayers([]);
        setUserSearchQuery('');
        setAvailableUsers([]);
        dispatch(fetchTournamentById(id));
        dispatch(loadUser());
        setTimeout(() => {
          checkUserRegistration();
        }, 1000);
      } else {
        const errorMessage = result.payload || result.error?.message || 'Failed to register for tournament';
        showToast(errorMessage, 'error');
      }
      setIsRegistering(false);
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Failed to register for tournament', 'error');
      setIsRegistering(false);
    }
  };

  const handleTeamDataChange = (e) => {
    const { name, value } = e.target;
    setTeamData(prev => ({ ...prev, [name]: value }));
  };

  const fetchUsers = async (query = '') => {
    try {
      setLoadingUsers(true);
      const response = query 
        ? await userService.searchUsers(query)
        : await userService.getUsers({ limit: 20 });
      
      if (response.success && response.data) {
        const filteredUsers = response.data.filter(u => 
          u._id !== user.id && !selectedPlayers.some(player => player._id === u._id)
        );
        setAvailableUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);
    if (query.length > 0) {
      await fetchUsers(query);
    } else {
      await fetchUsers();
    }
  };

  const addPlayerToTeam = (selectedUser) => {
    if (selectedPlayers.length >= 15) {
      showToast('Maximum team size is 15 players', 'warning');
      return;
    }
    
    const newPlayer = {
      _id: selectedUser._id,
      user: selectedUser._id,
      name: `${selectedUser.firstName} ${selectedUser.lastName}`,
      role: 'player'
    };
    
    setSelectedPlayers(prev => [...prev, newPlayer]);
    setAvailableUsers(prev => prev.filter(u => u._id !== selectedUser._id));
  };

  const removePlayerFromTeam = (playerId) => {
    const playerToRemove = selectedPlayers.find(p => p._id === playerId);
    setSelectedPlayers(prev => prev.filter(p => p._id !== playerId));
    
    if (playerToRemove && availableUsers.length > 0) {
      fetchUsers(userSearchQuery);
    }
  };

  useEffect(() => {
    if (showRegistrationForm) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRegistrationForm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentTournament && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent px-4">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40 text-center max-w-lg">
          <Trophy className="text-slate-300 mx-auto mb-4 md:mb-6" size={64} />
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Tournament Not Found</h3>
          <p className="text-slate-500 font-medium mb-4 md:mb-8">The tournament you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/tournaments"
            className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]"
          >
            <ArrowLeft className="mr-2" size={18} />
            Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer = user && currentTournament && (
    user._id === currentTournament.organizer || 
    user.id === currentTournament.organizer || 
    user._id === currentTournament.organizer?._id
  );

  return (
    <TournamentDetailsContent 
      tournament={currentTournament} 
      handleRegister={handleRegister} 
      isRegistering={isRegistering}
      formatDate={formatDate}
      showRegistrationForm={showRegistrationForm}
      setShowRegistrationForm={setShowRegistrationForm}
      teamData={teamData}
      handleTeamDataChange={handleTeamDataChange}
      selectedPlayers={selectedPlayers}
      availableUsers={availableUsers}
      userSearchQuery={userSearchQuery}
      loadingUsers={loadingUsers}
      handleUserSearch={handleUserSearch}
      addPlayerToTeam={addPlayerToTeam}
      removePlayerFromTeam={removePlayerFromTeam}
      userRegistered={userRegistered}
      userTeam={userTeam}
      isOrganizer={isOrganizer}
    />
  );
};

const TournamentDetailsContent = ({ 
  tournament, handleRegister, isRegistering, formatDate, showRegistrationForm,
  setShowRegistrationForm, teamData, handleTeamDataChange, selectedPlayers,
  availableUsers, userSearchQuery, loadingUsers, handleUserSearch, addPlayerToTeam,
  removePlayerFromTeam, userRegistered, userTeam, isOrganizer
}) => {
  const isActive = tournament.status === 'open' || tournament.status === 'ongoing';
  const registeredTeamsCount = tournament.registeredTeams ? tournament.registeredTeams.length : 0;
  
  const getNestedValue = (obj, path, defaultValue = 'TBD') => {
    return path.split('.').reduce((current, key) => current && current[key], obj) || defaultValue;
  };
  
  const venueName = getNestedValue(tournament, 'venue.name', 'Venue TBD');
  const venueAddress = getNestedValue(tournament, 'venue.address', 'Address TBD');
  const venueCity = getNestedValue(tournament, 'venue.city', '');
  const venueState = getNestedValue(tournament, 'venue.state', '');
  const fullVenueAddress = `${venueAddress}${venueCity ? `, ${venueCity}` : ''}${venueState ? `, ${venueState}` : ''}`;
  
  const tournamentStartDate = getNestedValue(tournament, 'dates.tournamentStart');
  const tournamentEndDate = getNestedValue(tournament, 'dates.tournamentEnd');
  const registrationStartDate = getNestedValue(tournament, 'dates.registrationStart');
  const registrationEndDate = getNestedValue(tournament, 'dates.registrationEnd');
  
  const organizerName = tournament.organizer 
    ? `${tournament.organizer.firstName || ''} ${tournament.organizer.lastName || ''}`.trim() || 'Organizer TBD'
    : 'Organizer TBD';
  const organizerEmail = getNestedValue(tournament, 'organizer.email', 'Contact TBD');
  
  const minTeamSize = getNestedValue(tournament, 'settings.minPlayersPerTeam', 'TBD');
  const maxTeamSize = getNestedValue(tournament, 'settings.maxPlayersPerTeam', 'TBD');
  
  const prizeTotal = getNestedValue(tournament, 'prizePool.total', 0);
  const prizeDistribution = tournament.prizePool?.distribution || [];
  
  let prizesText = 'Prize details TBD';
  if (prizeTotal > 0) {
    if (prizeDistribution.length > 0) {
      prizesText = prizeDistribution
        .map(prize => `${prize.position === 1 ? '1st' : prize.position === 2 ? '2nd' : prize.position === 3 ? '3rd' : `${prize.position}th`} Place: $${prize.amount}`)
        .join(', ');
    } else {
      prizesText = `Total Prize Pool: $${prizeTotal}`;
    }
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      <Link to="/tournaments" className="inline-flex items-center text-slate-500 hover:text-blue-500 font-bold mb-4 md:mb-6 transition-colors group">
        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
        Back to Tournaments
      </Link>

      {/* Tournament Header */}
      <div className="p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-gradient-to-br from-white/60 to-blue-50/40 border border-white/60 mb-4 md:mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-3 md:gap-6">
          <div>
            <h1 className="text-xl md:text-3xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">{tournament.name}</h1>
            <div className="flex flex-wrap gap-3 mb-4 md:mb-6">
              <div className="flex items-center px-4 py-2 bg-white/60 rounded-full border border-white">
                <Trophy className="mr-2 text-blue-500" size={16} />
                <span className="text-sm font-bold text-slate-700">{tournament.sport} - {tournament.format}</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-white/60 rounded-full border border-white">
                <Calendar className="mr-2 text-blue-500" size={16} />
                <span className="text-sm font-bold text-slate-700">{formatDate(tournamentStartDate)} - {formatDate(tournamentEndDate)}</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-white/60 rounded-full border border-white">
                <MapPin className="mr-2 text-blue-500" size={16} />
                <span className="text-sm font-bold text-slate-700">{venueName}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                isActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {tournament.status || 'TBD'}
              </span>
              <span className="text-sm font-medium text-slate-500">{registeredTeamsCount} Teams Registered</span>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center lg:items-start pt-2">
            {isOrganizer ? (
              <Link
                to={`/tournaments/${tournament._id || tournament.id}/dashboard`}
                className="inline-flex items-center justify-center px-4 md:px-8 py-4 bg-slate-800 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:bg-slate-900 hover:-translate-y-0.5 transition-all"
              >
                <Settings className="mr-2" size={20} />
                Manage Tournament
              </Link>
            ) : (
              isActive && (
                userRegistered ? (
                  <div className="flex flex-col items-center sm:items-end">
                    <div className="inline-flex items-center px-4 md:px-6 py-3 bg-green-50 text-green-600 font-bold rounded-full border border-green-200">
                      <CheckCircle2 className="mr-2" size={18} />
                      Registered
                    </div>
                    {userTeam && (
                      <span className="mt-2 text-sm font-medium text-slate-500">
                        Playing as <strong className="text-green-600">{userTeam.name}</strong>
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRegistrationForm(true)}
                    disabled={isRegistering}
                    className="inline-flex items-center justify-center px-4 md:px-8 py-4 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2" size={20} />
                        Register Now
                      </>
                    )}
                  </button>
                )
              )
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-4 md:mb-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About */}
          <div className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/40 border border-white/60">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight flex items-center">
              <Info className="mr-3 text-blue-500" size={24} />
              About This Tournament
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-4 md:mb-6 whitespace-pre-line">
              {tournament.description || 'Join us for an exciting tournament experience! This tournament brings together teams to compete in a fair and challenging environment.'}
            </p>
            
            {tournament.rules && (
              <div className="mt-4 md:mt-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Tournament Rules</h3>
                <div className="bg-white/60 rounded-2xl p-4 md:p-6 border border-white">
                  <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                    {tournament.rules}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-white/40 flex items-start border border-white">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mr-4 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Registration Window</h3>
                <p className="text-sm font-medium text-slate-500">
                  {formatDate(registrationStartDate)} - {formatDate(registrationEndDate)}
                </p>
              </div>
            </div>
            
            <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-white/40 flex items-start border border-white">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mr-4 shrink-0">
                <Info size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Reporting Time</h3>
                <p className="text-sm font-medium text-slate-500">{tournament.reportingTime || '1 hour before match'}</p>
              </div>
            </div>
            
            <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-white/40 flex items-start border border-white">
              <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mr-4 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Team Size</h3>
                <p className="text-sm font-medium text-slate-500">Min: {minTeamSize} / Max: {maxTeamSize}</p>
              </div>
            </div>
            
            <div className="p-4 md:p-6 rounded-[24px] glass-panel bg-white/40 flex items-start border border-white">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mr-4 shrink-0">
                <Medal size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Prizes</h3>
                <p className="text-sm font-medium text-slate-500 line-clamp-2">{prizesText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Organizer Info</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</h3>
                <p className="text-slate-700 font-medium">{organizerName}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</h3>
                <p className="text-slate-700 font-medium break-all">{organizerEmail}</p>
                {tournament.organizer?.phone && (
                  <p className="text-slate-700 font-medium mt-1">{tournament.organizer.phone}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Registration Info</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Entry Fee</h3>
                <p className="text-slate-700 font-black text-xl">${tournament.registrationFee || 'Free'}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment</h3>
                <p className="text-slate-700 font-medium text-sm leading-relaxed">{tournament.paymentDetails || 'Payment details provided upon registration'}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Eligibility</h3>
                <p className="text-slate-700 font-medium text-sm leading-relaxed">
                  {renderEligibility(tournament.eligibility)}
                  {tournament.visibility === 'private' && ' (Private)'}
                </p>
              </div>
              {tournament.settings?.requireApproval && (
                <div className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-md border border-amber-200">
                  Requires Approval
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Venue Location</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</h3>
                <p className="text-slate-700 font-medium">{venueName}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</h3>
                <p className="text-slate-700 font-medium text-sm leading-relaxed">{fullVenueAddress}</p>
              </div>
              {tournament.venue?.mapLink && (
                <div className="pt-2">
                  <a 
                    href={tournament.venue.mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-bold text-blue-500 hover:text-blue-700 group"
                  >
                    <MapPin className="mr-1" size={16} />
                    <span className="underline decoration-blue-200 underline-offset-4 group-hover:decoration-blue-500 transition-colors">View on Map</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Modal Overlay */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white relative animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 md:px-8 py-4 md:py-6 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-extrabold text-slate-800">Register Team</h3>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="p-4 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-10">
                {/* Team Information */}
                <div className="space-y-6">
                  <h4 className="text-xl font-extrabold text-slate-800 mb-2 border-b border-slate-200/50 pb-4">Team Info</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={teamData.name}
                      onChange={handleTeamDataChange}
                      placeholder="Enter team name"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Short Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="shortName"
                      value={teamData.shortName}
                      onChange={handleTeamDataChange}
                      placeholder="e.g. CSK"
                      maxLength="10"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      name="description"
                      value={teamData.description}
                      onChange={handleTeamDataChange}
                      placeholder="Brief description"
                      rows="3"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 resize-none"
                    />
                  </div>

                  <div className="bg-blue-50/80 rounded-2xl p-5 border border-blue-100 flex items-start">
                    <UserPlus className="text-blue-500 mr-3 shrink-0" size={20} />
                    <div>
                      <h5 className="font-bold text-blue-900 mb-1">Team Captain</h5>
                      <p className="text-sm font-medium text-blue-700">You will be automatically assigned as the team captain.</p>
                    </div>
                  </div>
                </div>

                {/* Player Selection */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
                    <h4 className="text-xl font-extrabold text-slate-800">Add Roster</h4>
                    <span className="text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                      {selectedPlayers.length + 1}/15 players
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                    />
                  </div>

                  {/* Selected Players */}
                  {selectedPlayers.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Selected ({selectedPlayers.length})</h5>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedPlayers.map((player) => (
                          <div key={player._id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-sm font-bold text-slate-700">{player.name}</span>
                            <button
                              type="button"
                              onClick={() => removePlayerFromTeam(player._id)}
                              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Users */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex-1 flex flex-col max-h-[220px]">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 shrink-0">Available</h5>
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center h-12 md:h-20">
                          <Loader2 className="animate-spin text-blue-500" size={24} />
                        </div>
                      ) : availableUsers.length > 0 ? (
                        <div className="space-y-2">
                          {availableUsers.map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border border-white shadow-sm shrink-0">
                                  <span className="text-sm font-bold text-blue-600">
                                    {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <p className="text-sm font-bold text-slate-700 truncate">
                                    {user.firstName} {user.lastName}
                                  </p>
                                  <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addPlayerToTeam(user)}
                                className="shrink-0 text-sm font-bold bg-white text-blue-500 border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 md:py-6">
                          <p className="text-sm font-medium text-slate-500">
                            {userSearchQuery ? 'No users found matching query' : 'Type above to search'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-4 md:mt-8 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegistrationForm(false)}
                  className="flex-1 px-4 md:px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-full hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering || !teamData.name.trim()}
                  className="flex-1 px-4 md:px-6 py-4 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center"
                >
                  {isRegistering ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Registering...</>
                  ) : (
                    `Complete Registration`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Users, Plus, UserPlus, Search, X, PlayCircle, Shield
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { showToast } from '../../utils/toast';
import matchService from '../../services/matchService';

const TeamSelection = () => {
  const { sportId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [team1, setTeam1] = useState({ name: '', players: [] });
  const [team2, setTeam2] = useState({ name: '', players: [] });
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  
  const sportConfigs = {
    cricket: { minPlayers: 11, maxPlayers: 15, title: 'Cricket Match' },
    badminton: { minPlayers: 1, maxPlayers: 2, title: 'Badminton Match' },
    kabaddi: { minPlayers: 7, maxPlayers: 10, title: 'Kabaddi Match' },
    volleyball: { minPlayers: 6, maxPlayers: 12, title: 'Volleyball Match' },
    basketball: { minPlayers: 5, maxPlayers: 12, title: 'Basketball Match' },
  };
  
  const currentConfig = sportConfigs[sportId] || { minPlayers: 5, maxPlayers: 10, title: 'Sports Match' };
  
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const { default: userService } = await import('../../services/userService');
        const response = await userService.getUsers();
        
        const users = response.data?.data || [];
        
        const formattedPlayers = users.map(user => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          sport: user.sports && user.sports.length > 0 ? user.sports[0].name.toLowerCase() : 'all',
          position: user.sports && user.sports.length > 0 ? user.sports[0].position : 'Player',
          rating: 4.0
        }));
        
        const filteredPlayers = formattedPlayers.filter(player => 
          player.sport === sportId || player.sport === 'all'
        );
        
        setAvailablePlayers(filteredPlayers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching players:', error);
        showToast('Failed to load players', 'error');
        setLoading(false);
      }
    };
    
    fetchPlayers();
  }, [sportId]);
  
  const handlePlayerSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredPlayers = availablePlayers.filter(player => {
    const isInTeam1 = team1.players.some(p => p.id === player.id);
    const isInTeam2 = team2.players.some(p => p.id === player.id);
    
    if (isInTeam1 || isInTeam2) return false;
    
    return player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  const handleAddPlayer = (player) => {
    if (selectedTeam === 1) {
      if (team1.players.length >= currentConfig.maxPlayers) {
        showToast(`Team 1 already has maximum ${currentConfig.maxPlayers} players`, 'warning');
        return;
      }
      setTeam1({ ...team1, players: [...team1.players, player] });
    } else {
      if (team2.players.length >= currentConfig.maxPlayers) {
        showToast(`Team 2 already has maximum ${currentConfig.maxPlayers} players`, 'warning');
        return;
      }
      setTeam2({ ...team2, players: [...team2.players, player] });
    }
    setShowPlayerModal(false);
  };
  
  const handleRemovePlayer = (teamNum, playerId) => {
    if (teamNum === 1) {
      setTeam1({ ...team1, players: team1.players.filter(p => p.id !== playerId) });
    } else {
      setTeam2({ ...team2, players: team2.players.filter(p => p.id !== playerId) });
    }
  };
  
  const handleStartMatch = async () => {
    if (!team1.name || !team2.name) {
      showToast('Please enter names for both teams', 'error');
      return;
    }
    if (team1.players.length < currentConfig.minPlayers) {
      showToast(`Team 1 needs at least ${currentConfig.minPlayers} players`, 'error');
      return;
    }
    if (team2.players.length < currentConfig.minPlayers) {
      showToast(`Team 2 needs at least ${currentConfig.minPlayers} players`, 'error');
      return;
    }
    
    try {
      const matchData = {
        sport: sportId,
        homeTeam: team1.id || null, // Ensure backend handles null if not real teams
        awayTeam: team2.id || null,
        homeTeamName: team1.name, // Pass custom name in case id is null
        awayTeamName: team2.name,
        homeTeamPlayers: team1.players.map(p => p.id),
        awayTeamPlayers: team2.players.map(p => p.id),
        status: 'live',
        scheduledTime: new Date().toISOString(),
        venue: { name: 'Local Venue', city: 'Local City' }
      };
      
      // We pass the full team data as custom data if backend supports it
      const response = await matchService.createMatch(matchData);
      
      const matchId = response.data?._id || response.data?.id;
      if (!matchId) {
        throw new Error('Match ID not returned from server');
      }

      showToast('Match created successfully!', 'success');
      
      if (sportId === 'cricket') {
        navigate(`/matches/score/cricket/${matchId}`);
      } else {
        navigate(`/matches/score/${sportId}/${matchId}`);
      }
    } catch (error) {
      console.error('Error creating match:', error);
      showToast(error.response?.data?.message || 'Failed to create match', 'error');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      <div className="mb-4 md:mb-8 p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-gradient-to-br from-white/60 to-blue-50/40 border border-white/60 text-center shadow-sm">
        <Shield className="text-blue-500 mx-auto mb-4" size={48} />
        <h1 className="text-xl md:text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-2">{currentConfig.title} Setup</h1>
        <p className="text-slate-600 font-medium text-lg">Build your rosters for the upcoming match</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-6 md:mb-10">
        {/* Team 1 */}
        <div className={`p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border-2 transition-all ${selectedTeam === 1 ? 'border-blue-400 shadow-md' : 'border-white'}`}>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-lg">1</div>
              <h2 className="text-2xl font-extrabold text-slate-800">Home Team</h2>
            </div>
            <button
              onClick={() => { setSelectedTeam(1); setShowPlayerModal(true); }}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-sm hover:-translate-y-0.5"
            >
              <UserPlus className="mr-2" size={16} />
              Add
            </button>
          </div>
          
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Team Name</label>
            <input
              type="text"
              value={team1.name}
              onChange={(e) => setTeam1({ ...team1, name: e.target.value })}
              placeholder="e.g. Blue Falcons"
              className="w-full px-5 py-3 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 shadow-sm"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">Roster</h3>
              <span className="text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                {team1.players.length} / {currentConfig.maxPlayers}
              </span>
            </div>
            
            {team1.players.length === 0 ? (
              <div className="text-center py-4 md:py-8 bg-white/40 rounded-2xl border border-white border-dashed">
                <Users className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-slate-500 font-medium text-sm">Roster is empty</p>
                <button
                  onClick={() => { setSelectedTeam(1); setShowPlayerModal(true); }}
                  className="mt-3 text-sm font-bold text-blue-500 hover:text-blue-700"
                >
                  Browse Players
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {team1.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            {player.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{player.name}</p>
                        <p className="text-xs font-medium text-slate-500">{player.position}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(1, player.id)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Team 2 */}
        <div className={`p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border-2 transition-all ${selectedTeam === 2 ? 'border-indigo-400 shadow-md' : 'border-white'}`}>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-lg">2</div>
              <h2 className="text-2xl font-extrabold text-slate-800">Away Team</h2>
            </div>
            <button
              onClick={() => { setSelectedTeam(2); setShowPlayerModal(true); }}
              className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white font-bold rounded-full hover:bg-indigo-600 transition-all shadow-sm hover:-translate-y-0.5"
            >
              <UserPlus className="mr-2" size={16} />
              Add
            </button>
          </div>
          
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Team Name</label>
            <input
              type="text"
              value={team2.name}
              onChange={(e) => setTeam2({ ...team2, name: e.target.value })}
              placeholder="e.g. Red Dragons"
              className="w-full px-5 py-3 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-700 shadow-sm"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">Roster</h3>
              <span className="text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                {team2.players.length} / {currentConfig.maxPlayers}
              </span>
            </div>
            
            {team2.players.length === 0 ? (
              <div className="text-center py-4 md:py-8 bg-white/40 rounded-2xl border border-white border-dashed">
                <Users className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-slate-500 font-medium text-sm">Roster is empty</p>
                <button
                  onClick={() => { setSelectedTeam(2); setShowPlayerModal(true); }}
                  className="mt-3 text-sm font-bold text-indigo-500 hover:text-indigo-700"
                >
                  Browse Players
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {team2.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            {player.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{player.name}</p>
                        <p className="text-xs font-medium text-slate-500">{player.position}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(2, player.id)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Start Match Button */}
      <div className="flex justify-center mb-4 md:mb-6 md:mb-12">
        <button
          onClick={handleStartMatch}
          className="px-5 md:px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-lg rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] hover:-translate-y-1 transition-all flex items-center"
        >
          <PlayCircle className="mr-3" size={24} />
          Start Match Let's Go!
        </button>
      </div>
      
      {/* Player Modal Overlay */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-6 md:p-8 border-b border-slate-200/50 bg-white/50">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-2xl font-extrabold text-slate-800">
                  Select for {selectedTeam === 1 ? team1.name || 'Home Team' : team2.name || 'Away Team'}
                </h3>
                <button 
                  onClick={() => setShowPlayerModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-slate-400" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or role..."
                  value={searchTerm}
                  onChange={handlePlayerSearch}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 shadow-sm"
                />
              </div>
            </div>
            
            <div className="p-4 md:p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar bg-slate-50/50">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-4 md:py-8 md:py-16">
                  <Search className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-bold text-lg mb-2">No players found</p>
                  <p className="text-slate-400 text-sm">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlayers.map((player) => (
                    <div key={player.id} className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4 truncate">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                          {player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 font-bold">
                              {player.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{player.name}</p>
                          <p className="text-xs font-medium text-slate-500 truncate">{player.position}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddPlayer(player)}
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all shadow-sm ${selectedTeam === 1 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelection;

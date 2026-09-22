import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Search, 
  Plus,
  MapPin,
  Calendar,
  Star,
  Trophy,
  ListFilter
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MyTeams from '../../components/Team/MyTeams';
import CategoryFilterScroll from '../../components/UI/CategoryFilterScroll';
import teamService from '../../services/teamService';
import { showToast } from '../../utils/toast';

const SPORTS = [
  { id: 'all', label: 'All Sports' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'soccer', label: 'Soccer' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'badminton', label: 'Badminton' },
  { id: 'volleyball', label: 'Volleyball' }
];

const LOCATIONS = ['All Locations', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune'];

const TeamsPage = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (selectedSport !== 'all') params.sport = selectedSport;
      if (selectedLocation !== 'All Locations') params.location = selectedLocation;
      
      const response = await teamService.getTeams(params);
      
      if (response.data && response.data.data) {
        setTeams(response.data.data);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      showToast('Failed to load teams', 'error');
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSport, selectedLocation]);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchTeams();
    }
  }, [activeTab, fetchTeams]);

  const handleJoinTeam = async (teamId) => {
    try {
      await teamService.joinTeam(teamId);
      showToast('Join request sent successfully!', 'success');
      fetchTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      showToast('Failed to send join request', 'error');
    }
  };

  const filteredTeams = teams.filter(team => {
    const locationStr = team.homeVenue?.city || team.location || '';
    return team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locationStr.toLowerCase().includes(searchTerm.toLowerCase())
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        className={`${index < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} transition-all`}
      />
    ));
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 mb-4 md:mb-8 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Teams Hub</h1>
            <p className="text-lg text-slate-500 font-medium">Find teams to join or manage your existing squads.</p>
          </div>
          <Link
            to="/teams/create"
            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Create Team
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 md:px-6 py-3 rounded-full font-bold text-sm transition-all ${
              activeTab === 'browse'
                ? 'bg-blue-500 text-white shadow-md'
                : 'glass-panel text-slate-600 hover:bg-white/80'
            }`}
          >
            Browse Teams
          </button>
          <button
            onClick={() => setActiveTab('myteams')}
            className={`px-4 md:px-6 py-3 rounded-full font-bold text-sm transition-all ${
              activeTab === 'myteams'
                ? 'bg-blue-500 text-white shadow-md'
                : 'glass-panel text-slate-600 hover:bg-white/80'
            }`}
          >
            My Teams
          </button>
        </div>

        {/* Browse Teams Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Filters */}
            <div className="mb-4 md:mb-8 space-y-4">
              <CategoryFilterScroll 
                categories={SPORTS} 
                activeCategory={selectedSport} 
                onSelectCategory={setSelectedSport} 
              />
              
              <div className="flex flex-col md:flex-row gap-4 px-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, sport, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                  />
                </div>
                
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="appearance-none w-full md:w-56 pl-10 pr-10 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all cursor-pointer"
                  >
                    {LOCATIONS.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <ListFilter size={18} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-4 md:py-6 md:py-10 md:py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-4 md:py-6 md:py-10 md:py-20 bg-white/30 rounded-[40px] border border-dashed border-slate-300">
                <Users size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No teams found</h3>
                <p className="text-slate-500 font-medium mb-4 md:mb-6">
                  Try adjusting your search criteria or create your own team.
                </p>
                <Link
                  to="/teams/create"
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all"
                >
                  <Plus size={18} />
                  Create Your Team
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {filteredTeams.map(team => (
                  <div key={team.id} className="p-4 md:p-6 rounded-[32px] glass-panel flex flex-col gap-5 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,255,0.08)] transition-all">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-white">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <Users size={24} className="text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 truncate">{team.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <span className="bg-white/60 px-2 py-0.5 rounded-full">{team.sport}</span>
                          <span className="flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full">
                            <MapPin size={10} className="text-blue-500" />
                            <span className="truncate max-w-[80px]">{team.homeVenue?.city || team.location || 'Unknown'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/50 p-3 rounded-2xl flex flex-col items-center justify-center border border-white">
                        <div className="flex gap-0.5 mb-1">
                          {renderStars(team.rating || 4.5)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</span>
                      </div>
                      <div className="bg-white/50 p-3 rounded-2xl flex flex-col items-center justify-center border border-white">
                        <span className="font-extrabold text-slate-700">
                          {team.stats?.matchesWon || team.wins || 0}W - {team.stats?.matchesLost || team.losses || 0}L
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2.5 text-sm font-medium text-slate-600 bg-white/30 p-4 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-blue-500 shrink-0" />
                        <span>{team.players?.length || team.members || 0}/{team.tournament?.settings?.maxPlayersPerTeam || team.maxMembers || 15} Members</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar size={16} className="text-blue-500 shrink-0" />
                        <span>Est. {formatDate(team.founded || team.createdAt || new Date())}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Trophy size={16} className="text-blue-500 shrink-0" />
                        <span className="truncate">Captain: {team.captain?.firstName ? `${team.captain.firstName} ${team.captain.lastName}` : (team.captain || 'Unknown')}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 line-clamp-2 px-1">
                      {team.description || 'A passionate sports team looking for new challenges.'}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <Link
                        to={`/teams/${team._id || team.id}`}
                        className="flex-1 py-3 bg-white text-slate-700 font-bold text-sm text-center rounded-xl border border-white hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleJoinTeam(team._id || team.id)}
                        className="flex-1 py-3 bg-blue-500 text-white font-bold text-sm rounded-xl shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-[1.02] transition-all"
                      >
                        Request Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Teams Tab */}
        {activeTab === 'myteams' && (
          <div className="p-4 md:p-8 rounded-[40px] glass-panel bg-white/40 min-h-[50vh]">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 md:mb-6 tracking-tight">Your Squads</h2>
            <MyTeams />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;

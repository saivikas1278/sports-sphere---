import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaTrophy, 
  FaUsers, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaPlus,
  FaFilter,
  FaSearch,
  FaStar,
  FaGamepad,
  FaEye
} from 'react-icons/fa';
import tournamentService from '../../services/tournamentService';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import AnimatedCard from '../../components/UI/AnimatedCard';
import GradientButton from '../../components/UI/GradientButton';

const TournamentList = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentService.getTournaments();
      console.log('[TournamentList] API Response:', response);
      
      // Handle the backend response structure: { success: true, data: [...] }
      const tournamentsData = response.success && response.data ? response.data : response.tournaments || response || [];
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments
    .filter(tournament => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
      const matchesSport = sportFilter === 'all' || tournament.sport === sportFilter;
      
      return matchesSearch && matchesStatus && matchesSport;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'startDate':
          return new Date(a.dates?.tournamentStart) - new Date(b.dates?.tournamentStart);
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'open': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSports = () => {
    const sports = [...new Set(tournaments.map(t => t.sport))];
    return sports.filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Tournaments</h1>
            <p className="text-gray-600">Discover and join exciting tournaments</p>
          </div>
          
          {isAuthenticated && (
            <GradientButton 
              onClick={() => navigate('/tournaments/create')}
              className="mt-4 md:mt-0"
            >
              <FaPlus className="mr-2" />
              Create Tournament
            </GradientButton>
          )}
        </div>

        {/* Filters and Search */}
        <AnimatedCard className="p-4 md:p-6 mb-4 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open for Registration</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>

            {/* Sport Filter */}
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sports</option>
              {getSports().map(sport => (
                <option key={sport} value={sport}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="startDate">Start Date</option>
            </select>
          </div>
        </AnimatedCard>

        {/* Tournament Grid */}
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredTournaments.map((tournament) => (
              <AnimatedCard key={tournament._id} className="overflow-hidden">
                {/* Tournament Banner */}
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                  {tournament.banner ? (
                    <img
                      src={tournament.banner}
                      alt={tournament.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FaTrophy className="text-6xl text-white opacity-20" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Featured Badge */}
                  {tournament.featured && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <FaStar className="mr-1" />
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Tournament Info */}
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tournament.name}</h3>
                    {tournament.logo && (
                      <img
                        src={tournament.logo}
                        alt={`${tournament.name} logo`}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tournament.description}
                  </p>

                  {/* Tournament Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaGamepad className="mr-2 text-blue-500" />
                      <span className="capitalize">{tournament.sport}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-2 text-green-500" />
                      <span>{tournament.registeredTeams?.length || 0}/{tournament.maxTeams} Teams</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendarAlt className="mr-2 text-purple-500" />
                      <span>
                        {tournament.dates?.tournamentStart ? 
                          new Date(tournament.dates.tournamentStart).toLocaleDateString() :
                          'Date TBD'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      <span>{tournament.venue?.city || 'Location TBD'}</span>
                    </div>
                  </div>

                  {/* Prize Pool */}
                  {tournament.prizePool?.total > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg mb-4">
                      <div className="flex items-center">
                        <FaTrophy className="text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">
                          Prize Pool: ${tournament.prizePool.total}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <GradientButton
                      size="sm"
                      onClick={() => navigate(`/tournaments/${tournament._id}`)}
                      className="flex-1"
                    >
                      <FaEye className="mr-2" />
                      View Details
                    </GradientButton>
                    
                    {tournament.status === 'open' && isAuthenticated && (
                      <GradientButton
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/tournaments/${tournament._id}/register`)}
                      >
                        Register
                      </GradientButton>
                    )}
                  </div>

                  {/* Organizer Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <img
                        src={tournament.organizer?.avatar || '/default-avatar.png'}
                        alt={`${tournament.organizer?.firstName} ${tournament.organizer?.lastName}`}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span className="text-xs text-gray-500">
                        Organized by {tournament.organizer?.firstName} {tournament.organizer?.lastName}
                      </span>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <AnimatedCard className="p-4 md:p-6 md:p-12 text-center">
            <FaTrophy className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tournaments Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || sportFilter !== 'all' 
                ? 'Try adjusting your filters to see more tournaments.'
                : 'Be the first to create a tournament!'
              }
            </p>
            {isAuthenticated && (
              <GradientButton onClick={() => navigate('/tournaments/create')}>
                <FaPlus className="mr-2" />
                Create Tournament
              </GradientButton>
            )}
          </AnimatedCard>
        )}

        {/* Quick Stats */}
        {tournaments.length > 0 && (
          <AnimatedCard className="mt-4 md:mt-6 md:mt-12 p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">Tournament Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tournaments.length}
                </div>
                <div className="text-sm text-gray-600">Total Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tournaments.filter(t => t.status === 'open').length}
                </div>
                <div className="text-sm text-gray-600">Open for Registration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {tournaments.filter(t => t.status === 'ongoing').length}
                </div>
                <div className="text-sm text-gray-600">Currently Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {getSports().length}
                </div>
                <div className="text-sm text-gray-600">Different Sports</div>
              </div>
            </div>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
};

export default TournamentList;

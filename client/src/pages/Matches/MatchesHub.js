import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus,
  CalendarDays,
  ListFilter
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StandardMatchCard from '../../components/UI/StandardMatchCard';
import CategoryFilterScroll from '../../components/UI/CategoryFilterScroll';
import matchService from '../../services/matchService';

const SPORTS = [
  { id: '', label: 'All Sports' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'volleyball', label: 'Volleyball' },
  { id: 'badminton', label: 'Badminton' }
];

const MatchesHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSport, setActiveSport] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await matchService.getMatches();
        let matchesData = [];
        if (response.success && response.data) {
          matchesData = response.data;
        } else if (response.data && response.data.data) {
          matchesData = response.data.data;
        }

        // Default sorting
        matchesData.sort((a, b) => {
          const statusPriority = { live: 0, scheduled: 1, completed: 2 };
          if (statusPriority[a.status] !== statusPriority[b.status]) {
            return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
          }
          return new Date(b.date || b.scheduledTime || b.createdAt) - new Date(a.date || a.scheduledTime || a.createdAt);
        });

        setMatches(matchesData);
        setFilteredMatches(matchesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, []);
  
  useEffect(() => {
    let result = [...matches];
    if (activeStatus) result = result.filter(match => match.status === activeStatus);
    if (activeSport) result = result.filter(match => match.sport === activeSport);
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(match => {
        const team1Name = match.teams?.team1?.name || match.homeTeam?.name || '';
        const team2Name = match.teams?.team2?.name || match.awayTeam?.name || '';
        const venueName = match.venue?.name || match.venue || '';
        return team1Name.toLowerCase().includes(search) ||
               team2Name.toLowerCase().includes(search) ||
               venueName.toLowerCase().includes(search);
      });
    }
    setFilteredMatches(result);
  }, [matches, activeStatus, activeSport, searchTerm]);

  const handleMatchClick = (match) => {
    const matchId = match.id || match._id;
    if (match.status === 'live') {
      navigate(`/matches/score/${match.sport}/${matchId}`);
    } else {
      navigate(`/matches/${matchId}`);
    }
  };

  const getSportImage = (sport) => {
    const images = {
      cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
      football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
      basketball: 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&q=80',
      badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
      volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80'
    };
    return images[sport?.toLowerCase()] || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 mb-4 md:mb-8 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Matches Hub</h1>
            <p className="text-lg text-slate-500 font-medium">Follow live scores, schedule new games, and view results.</p>
          </div>
          <Link
            to="/matches/create"
            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Create Match
          </Link>
        </div>
        
        {/* Filters */}
        <div className="mb-4 md:mb-8 space-y-4">
          <CategoryFilterScroll 
            categories={SPORTS} 
            activeCategory={activeSport} 
            onSelectCategory={setActiveSport} 
          />
          
          <div className="flex flex-col md:flex-row gap-4 px-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by team or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
              />
            </div>
            
            <div className="relative">
              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                className="appearance-none w-full md:w-48 pl-10 pr-10 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="live">Live Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <ListFilter size={18} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Match List */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-4 md:py-6 md:py-10 md:py-20 bg-white/30 rounded-[40px] border border-dashed border-slate-300">
            <CalendarDays size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No matches found</h3>
            <p className="text-slate-500 font-medium mb-4 md:mb-6">
              {searchTerm || activeStatus || activeSport ? 
                'Try adjusting your filters or search.' : 
                'Create your first match to get started.'}
            </p>
            <Link
              to="/matches/create"
              className="inline-flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all"
            >
              <Plus size={18} />
              Create Match
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredMatches.map(match => {
              const matchDate = match.date || match.scheduledTime || match.createdAt;
              const formattedDate = matchDate ? new Date(matchDate).toLocaleDateString(undefined, { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'TBD';
              
              let actionText = 'Match Details';
              if (match.status === 'live') actionText = 'Go to Scoring';
              if (match.status === 'completed') actionText = 'View Scorecard';

              const team1Name = match.teams?.team1?.name || match.homeTeam?.name || 'TBD';
              const team2Name = match.teams?.team2?.name || match.awayTeam?.name || 'TBD';
              const venueName = match.venue?.name || match.venue || 'Local Venue';

              return (
                <div key={match.id || match._id} className="relative">
                  <StandardMatchCard 
                    image={getSportImage(match.sport)}
                    sport={match.sport?.toUpperCase()}
                    title={`${team1Name} vs ${team2Name}`}
                    location={venueName}
                    time={formattedDate}
                    onBook={() => handleMatchClick(match)}
                  />
                  {/* Status Badge Override */}
                  <div className={`absolute top-7 right-7 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-sm ${
                    match.status === 'live' ? 'bg-red-500/90 text-white border-red-400' :
                    match.status === 'scheduled' ? 'bg-blue-500/90 text-white border-blue-400' :
                    'bg-slate-700/90 text-white border-slate-600'
                  }`}>
                    {match.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesHub;

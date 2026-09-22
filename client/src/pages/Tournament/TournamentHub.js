import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Trophy,
  Search, 
  Plus,
  Filter,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { fetchTournaments } from '../../redux/slices/tournamentSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StandardMatchCard from '../../components/UI/StandardMatchCard';
import CategoryFilterScroll from '../../components/UI/CategoryFilterScroll';
import MapDiscovery from './MapDiscovery';
import { showToast } from '../../utils/toast';

const SPORTS = [
  { id: '', label: 'All Sports' },
  { id: 'Basketball', label: 'Basketball' },
  { id: 'Soccer', label: 'Soccer' },
  { id: 'Volleyball', label: 'Volleyball' },
  { id: 'Tennis', label: 'Tennis' },
  { id: 'Cricket', label: 'Cricket' }
];

const TournamentHub = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tournaments, loading } = useSelector((state) => state.tournaments);
  
  // Basic Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSport, setActiveSport] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'active', 'completed'
  
  // Advanced Filters (PRD Requirements)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [feeFilter, setFeeFilter] = useState(1000); // default max fee
  const [prizeFilter, setPrizeFilter] = useState(0); // default min prize

  const locationObj = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(locationObj.search);
    const locParam = params.get('location');
    const sportParam = params.get('sport');

    if (locParam) {
      setLocationFilter(locParam);
      setShowAdvancedFilters(true);
    }
    if (sportParam) {
      setActiveSport(sportParam);
    }
    
    dispatch(fetchTournaments());
  }, [dispatch, locationObj.search]);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filteredTournaments = tournaments ? tournaments.filter(tournament => {
    const name = tournament.name || tournament.tournamentName || '';
    const location = tournament.location || tournament.venue?.city || tournament.venueName || '';
    const organizer = tournament.organizerName || '';
    
    // 1. Keyword Search
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        organizer.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Sport Filter
    const matchesSport = activeSport === '' || tournament.sport?.toLowerCase() === activeSport.toLowerCase();
    
    // 3. Location Filter (PRD)
    const matchesLocation = locationFilter === '' || location.toLowerCase().includes(locationFilter.toLowerCase());

    // 4. Date Filter (PRD) - Starts on or after selected date
    let matchesDate = true;
    if (dateFilter) {
       const tourneyStart = new Date(tournament.dates?.tournamentStart || tournament.startDate);
       const filterDate = new Date(dateFilter);
       matchesDate = tourneyStart >= filterDate;
    }

    // 5. Entry Fee Filter (PRD) - Less than or equal to max fee
    const fee = tournament.registrationFee || 0;
    const matchesFee = fee <= feeFilter;

    // 6. Prize Pool Filter (PRD) - Greater than or equal to min prize
    const prize = tournament.prizePool?.total || tournament.prizePool || 0;
    const matchesPrize = prize >= prizeFilter;

    // 7. Status Filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        matchesStatus = tournament.status === 'open' || tournament.registrationStatus === 'open' || tournament.registrationOpen;
      } else if (statusFilter === 'active') {
        matchesStatus = tournament.status === 'ongoing';
      } else if (statusFilter === 'completed') {
        matchesStatus = tournament.status === 'completed';
      }
    }
    
    return matchesSearch && matchesSport && matchesLocation && matchesDate && matchesFee && matchesPrize && matchesStatus;
  }) : [];

  const getSportImage = (sport) => {
    const images = {
      cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
      soccer: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
      football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
      basketball: 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&q=80',
      tennis: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
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
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Tournament Hub</h1>
            <p className="text-lg text-slate-500 font-medium">Browse, discover, and join tournaments.</p>
          </div>
          <Link
            to="/tournaments/create"
            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Organize Tournament
          </Link>
        </div>
        
        {/* Filters Section */}
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
                placeholder="Search by tournament name, location, or organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
              />
            </div>
            
            <div className="flex gap-2 bg-white/60 p-1 rounded-full border border-white/40 shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
              >
                List View
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
              >
                <MapPin size={16} /> Map
              </button>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-full font-bold transition-all shadow-sm ${
                showAdvancedFilters ? 'bg-blue-500 text-white shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]' : 'bg-white/60 text-slate-700 hover:bg-white/90 border border-white/40'
              }`}
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-white/50 backdrop-blur-xl border border-white/50 p-4 md:p-6 rounded-[32px] shadow-sm mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
              
              {/* Location Filter */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} /> Location
                </label>
                <input
                  type="text"
                  placeholder="City, state, or venue..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-white/60 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder-slate-400"
                />
              </div>

              {/* Date Filter */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} /> Starts After
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-white/60 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                />
              </div>

              {/* Entry Fee Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} /> Max Entry Fee
                  </label>
                  <span className="text-sm font-bold text-blue-600">${feeFilter}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={feeFilter}
                  onChange={(e) => setFeeFilter(Number(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3"
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Free</span>
                  <span>$1000+</span>
                </div>
              </div>

              {/* Prize Pool Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy size={14} /> Min Prize Pool
                  </label>
                  <span className="text-sm font-bold text-yellow-600">${prizeFilter}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={prizeFilter}
                  onChange={(e) => setPrizeFilter(Number(e.target.value))}
                  className="w-full accent-yellow-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3"
                />
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Any</span>
                  <span>$10k+</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Tournament Display Area */}
        {viewMode === 'map' ? (
          <div className="w-full animate-in fade-in duration-500">
            <MapDiscovery />
          </div>
        ) : (
          <>
            {/* Status Tabs */}
            <div className="flex gap-6 border-b-2 border-slate-200/50 mb-6 px-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Tournaments' },
                { id: 'open', label: 'Open for Registration' },
                { id: 'active', label: 'Active / Ongoing' },
                { id: 'completed', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`pb-3 text-sm font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${statusFilter === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredTournaments.length === 0 ? (
              <div className="text-center py-4 md:py-6 md:py-10 md:py-20 bg-white/30 rounded-[40px] border border-dashed border-slate-300 animate-in fade-in">
                <Trophy size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No tournaments found</h3>
                <p className="text-slate-500 font-medium mb-4 md:mb-6">
                  Try adjusting your search criteria or create your own tournament.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setDateFilter('');
                    setFeeFilter(1000);
                    setPrizeFilter(0);
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {filteredTournaments.map(tournament => {
              const isActive = tournament.status === 'open' || tournament.registrationOpen;
              const title = tournament.name || tournament.tournamentName;
              const startDate = tournament.dates?.tournamentStart || tournament.startDate;
              const endDate = tournament.dates?.tournamentEnd || tournament.endDate;
              const prize = tournament.prizePool?.total || tournament.prizePool || 0;
              const fee = tournament.registrationFee || 0;
              
              return (
                <div key={tournament._id || tournament.id} className="relative">
                  <StandardMatchCard 
                    image={getSportImage(tournament.sport)}
                    sport={tournament.sport?.toUpperCase()}
                    title={title}
                    location={tournament.location || tournament.venue?.city || tournament.venueName || 'Local Venue'}
                    time={`${formatDate(startDate)} - ${formatDate(endDate)}`}
                    actionText={isActive ? 'Register Here' : 'View Details'}
                    onBook={() => {
                      navigate(`/tournaments/${tournament._id || tournament.id}`);
                    }}
                  />
                  {/* Status Badge */}
                  <div className={`absolute top-7 right-7 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-sm ${
                    isActive ? 'bg-green-500/90 text-white border-green-400' :
                    'bg-slate-700/90 text-white border-slate-600'
                  }`}>
                    {isActive ? 'Registration Open' : tournament.status || 'Closed'}
                  </div>
                  {/* Prize Badge if has prize */}
                  {prize > 0 && (
                    <div className="absolute top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-yellow-400/90 border border-yellow-300 text-yellow-900 shadow-sm hidden sm:flex items-center gap-1">
                      <Trophy size={12} /> ${prize}
                    </div>
                  )}
                  {/* Fee info in the card (Optional UI enhancement) */}
                  <div className="absolute bottom-24 right-8 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-white shadow-sm text-xs font-bold text-slate-700">
                    {fee > 0 ? `$${fee} Entry` : 'Free Entry'}
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentHub;

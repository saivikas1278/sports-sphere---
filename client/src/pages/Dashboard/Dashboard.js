import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Activity, 
  Bell, 
  Calendar, 
  ChevronRight, 
  Award, 
  Shield, 
  MapPin, 
  Mail, 
  Phone, 
  Edit3, 
  Plus, 
  Flame, 
  ArrowUpRight, 
  CheckCircle2, 
  Dumbbell, 
  BarChart3, 
  LayoutDashboard, 
  UserCheck, 
  MessageSquare,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import dashboardService from '../../services/dashboardService';
import tournamentService from '../../services/tournamentService';
import teamService from '../../services/teamService';
import authService from '../../services/authService';
import { loadUser } from '../../redux/slices/authSlice';
import TeamInvitations from '../../components/Teams/TeamInvitations';

const Dashboard = ({ defaultTab = 'overview' }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Tab State: sync with URL query param ?tab=
  const activeTab = searchParams.get('tab') || defaultTab;
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    matches: 0,
    fitnessStreak: 0,
    completedWorkouts: 0
  });
  const [myTournaments, setMyTournaments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phoneNumber: '',
    city: '',
    state: '',
    primarySport: 'cricket',
    jerseyNumber: '',
    position: ''
  });

  // Sync profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        phoneNumber: user.phoneNumber || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        primarySport: user.sports?.[0]?.name || 'cricket',
        jerseyNumber: user.sports?.[0]?.position || '',
        position: user.sports?.[0]?.experience || 'intermediate'
      });
    }
  }, [user]);

  // Load live data
  useEffect(() => {
    let isMounted = true;
    const fetchAllDashboardData = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // 1. Fetch dashboard stats & activities
        const [statsRes, actRes] = await Promise.allSettled([
          dashboardService.getDashboardStats(),
          dashboardService.getRecentActivities()
        ]);

        if (isMounted && statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(prev => ({
            ...prev,
            ...statsRes.value.data
          }));
        }

        if (isMounted && actRes.status === 'fulfilled' && actRes.value?.success) {
          setRecentActivities(actRes.value.data || []);
        }

        // 2. Fetch live tournaments
        try {
          const tourneyRes = await tournamentService.getMyTournaments();
          if (isMounted && tourneyRes?.data) {
            const list = Array.isArray(tourneyRes.data) ? tourneyRes.data : tourneyRes.data.data || [];
            setMyTournaments(list);
            setStats(prev => ({ ...prev, tournaments: list.length }));
          }
        } catch (e) {
          console.warn('Could not fetch user tournaments:', e.message);
        }

        // 3. Fetch live teams
        try {
          const teamRes = await teamService.getMyTeams();
          if (isMounted && teamRes?.data) {
            const tList = Array.isArray(teamRes.data) ? teamRes.data : teamRes.data.data || [];
            setMyTeams(tList);
            setStats(prev => ({ ...prev, teams: tList.length }));
          }
        } catch (e) {
          console.warn('Could not fetch user teams:', e.message);
        }

        // 4. Fetch notifications
        try {
          const notifRes = await dashboardService.getNotifications();
          if (isMounted && notifRes?.success) {
            setNotifications(notifRes.data || []);
          }
        } catch (e) {
          // silently handle
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllDashboardData();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        bio: profileForm.bio,
        phoneNumber: profileForm.phoneNumber,
        location: {
          city: profileForm.city,
          state: profileForm.state
        },
        sports: [
          {
            name: profileForm.primarySport,
            position: profileForm.jerseyNumber,
            experience: profileForm.position
          }
        ]
      };

      await authService.updateProfile(payload);
      await dispatch(loadUser()).unwrap();
      showToast('Athlete profile updated successfully!', 'success');
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[80vh] flex items-center justify-center relative z-10">
        <div className="max-w-md w-full text-center p-8 rounded-[40px] glass-panel bg-white/60 shadow-xl border border-white">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
            <Trophy size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Access Required</h2>
          <p className="text-slate-500 mb-8 font-medium">Please sign in to access your Athlete & Organizer Command Center.</p>
          <Link to="/login" className="block w-full py-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] transition-all hover:scale-[1.02]">
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.role === 'organizer';
  const roleTitle = isOrganizer ? 'Tournament Director' : user?.role === 'admin' ? 'Administrator' : 'Athlete';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'Athlete';
  const userInitials = (user?.firstName?.[0] || 'A') + (user?.lastName?.[0] || 'S');

  // Performance telemetry data matching soft theme
  const performanceData = [
    { month: 'May', workouts: 8, points: 65 },
    { month: 'Jun', workouts: 14, points: 110 },
    { month: 'Jul', workouts: 19, points: 145 },
    { month: 'Aug', workouts: 15, points: 130 },
    { month: 'Sep', workouts: 22, points: 190 },
    { month: 'Oct', workouts: 27, points: 240 }
  ];

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl relative z-10">
      
      {/* 1. HERO ATHLETE / ORGANIZER PASSPORT CARD (Consistent Soft Glassmorphism) */}
      <div className="p-6 md:p-8 rounded-[40px] glass-panel bg-white/60 border border-white shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Identity details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-extrabold text-2xl md:text-3xl text-blue-600">
                    {userInitials.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Online" />
            </div>

            {/* Name, Role & Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{fullName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isOrganizer 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                    : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                }`}>
                  {roleTitle}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs md:text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {user?.email}
                </span>
                {user?.location?.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-500" /> {user.location.city}, {user.location.state || 'IN'}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" /> Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
                </span>
              </div>

              <p className="mt-2 text-xs md:text-sm text-slate-600 font-medium max-w-xl line-clamp-2">
                {user?.bio || 'Passionate sports enthusiast competing on SportSphere and building championship squads.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-white/80 font-bold text-xs md:text-sm shadow-sm transition-all hover:text-blue-600 flex items-center justify-center gap-2"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>

            {isOrganizer ? (
              <Link
                to="/tournaments/create"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs md:text-sm shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                <span>New Tournament</span>
              </Link>
            ) : (
              <Link
                to="/dashboard/registrations"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs md:text-sm shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] transition-all flex items-center justify-center gap-1.5"
              >
                <Trophy size={16} />
                <span>My Tournaments</span>
              </Link>
            )}
          </div>
        </div>

        {/* Clean Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-slate-200/60">
          <div className="p-3.5 rounded-2xl bg-white/70 border border-white">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>{isOrganizer ? 'Tourneys Created' : 'Tournaments'}</span>
              <Trophy size={15} className="text-blue-500" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-800">{myTournaments.length || stats.tournaments || 0}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 border border-white">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Active Squads</span>
              <Users size={15} className="text-blue-500" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-800">{myTeams.length || stats.teams || 0}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 border border-white">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Win Ratio</span>
              <Award size={15} className="text-emerald-500" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
              {user?.stats?.matchesPlayed > 0 ? Math.round(((user.stats.matchesWon || 0) / user.stats.matchesPlayed) * 100) : 75}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 border border-white">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Training Streak</span>
              <Flame size={15} className="text-orange-500" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-orange-500">{user?.stats?.fitnessStreak || 6} Days</div>
          </div>
        </div>
      </div>

      {/* 2. CLEAN SEGMENTED PILL TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 max-w-xl mb-8 overflow-x-auto scrollbar-none shadow-sm">
        {[
          { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
          { id: 'profile', label: 'Profile & Bio', icon: UserCheck },
          { id: 'analytics', label: 'Analytics & Career', icon: BarChart3 },
          { id: 'teams', label: 'Squads & Teams', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. TAB VIEWS */}
      
      {/* TAB 1: COMMAND CENTER (OVERVIEW) */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isOrganizer ? (
                <>
                  <Link
                    to="/tournaments/create"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Trophy size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Create Tournament</h3>
                      <p className="text-xs text-slate-500 font-medium">Launch knockout or league</p>
                    </div>
                  </Link>

                  <Link
                    to="/tournaments"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Users size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Registrations</h3>
                      <p className="text-xs text-slate-500 font-medium">Review and approve teams</p>
                    </div>
                  </Link>

                  <Link
                    to="/matches"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Activity size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Live Scoring</h3>
                      <p className="text-xs text-slate-500 font-medium">Multi-sport consoles</p>
                    </div>
                  </Link>

                  <Link
                    to="/matches/create"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Schedule Fixture</h3>
                      <p className="text-xs text-slate-500 font-medium">Create standalone matches</p>
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard/registrations"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">My Registrations</h3>
                      <p className="text-xs text-slate-500 font-medium">Track approved team entries</p>
                    </div>
                  </Link>

                  <Link
                    to="/teams/create"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Shield size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Create Squad</h3>
                      <p className="text-xs text-slate-500 font-medium">Form team and invite players</p>
                    </div>
                  </Link>

                  <Link
                    to="/tournaments"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Trophy size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Join Tournament</h3>
                      <p className="text-xs text-slate-500 font-medium">Browse active sports events</p>
                    </div>
                  </Link>

                  <Link
                    to="/fitness/browse-workouts"
                    className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Dumbbell size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">Start Workout</h3>
                      <p className="text-xs text-slate-500 font-medium">Drills and conditioning</p>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Active Events & Squads Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tournaments List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <Trophy size={18} className="text-blue-500" />
                  <span>{isOrganizer ? 'Managed Tournaments' : 'Enrolled Tournaments'}</span>
                </h2>
                <Link to="/tournaments" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              {myTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myTournaments.slice(0, 4).map(tourney => (
                    <div
                      key={tourney._id || tourney.id}
                      className="p-5 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white/90 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/40">
                            {tourney.sport || 'Sports'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                            {tourney.status || 'Active'}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-1">{tourney.name}</h3>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3">
                          {tourney.description || 'Championship tournament hosted on SportSphere.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-400">
                          Teams: {tourney.teams?.length || 0} / {tourney.maxTeams || 16}
                        </span>
                        <Link
                          to={isOrganizer ? `/tournaments/${tourney._id || tourney.id}/dashboard` : `/tournaments/${tourney._id || tourney.id}`}
                          className="px-3.5 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <span>{isOrganizer ? 'Dashboard' : 'View Event'}</span>
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-[32px] glass-panel bg-white/40 border border-dashed border-slate-300 text-center">
                  <Trophy size={36} className="text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-700">No active tournament registrations</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Discover exciting open tournaments and compete for victory.</p>
                  <Link to="/tournaments" className="px-5 py-2 rounded-full bg-blue-500 text-white font-bold text-xs shadow-sm">
                    Explore Tournaments
                  </Link>
                </div>
              )}

              {/* Recent Activity Feed */}
              {recentActivities.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <span>Recent Activity</span>
                  </h3>
                  <div className="space-y-2">
                    {recentActivities.slice(0, 3).map((act, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white/60 border border-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                            <Trophy size={15} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{act.title}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{act.description}</div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {act.status || 'Done'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Sidebar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <Bell size={18} className="text-blue-500" />
                  <span>Alerts</span>
                </h2>
                <span className="text-xs font-semibold text-slate-400">Live</span>
              </div>

              <div className="p-4 rounded-[32px] glass-panel bg-white/60 border border-white space-y-2.5">
                {notifications.length > 0 ? (
                  notifications.slice(0, 4).map((notif, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/80 border border-white flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-snug">{notif.text || notif.message}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{notif.time || 'Just now'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <CheckCircle2 size={30} className="text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-700">All Caught Up</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No unread notifications.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: PROFILE & BIO */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-[40px] glass-panel bg-white/60 border border-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Athlete Identity</h2>
                  <p className="text-xs text-slate-500 font-medium">Public profile attributes visible across tournaments and squads</p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] transition-all"
                >
                  <Edit3 size={14} />
                  <span>Edit Details</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/70 border border-white">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Full Name</span>
                  <span className="text-sm font-extrabold text-slate-800">{fullName}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Email</span>
                  <span className="text-sm font-extrabold text-slate-800">{user?.email}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Phone Number</span>
                  <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Phone size={14} className="text-blue-500" />
                    {user?.phoneNumber || 'Not provided'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Location</span>
                  <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-500" />
                    {user?.location?.city ? `${user.location.city}, ${user.location.state || 'IN'}` : 'Global Athlete'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Primary Sport</span>
                  <span className="text-sm font-extrabold text-slate-800 capitalize">
                    {user?.sports?.[0]?.name || 'Cricket'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-white">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Jersey & Position</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    #{user?.sports?.[0]?.position || '10'} ({user?.sports?.[0]?.experience || 'Intermediate'})
                  </span>
                </div>
              </div>

              {/* Biography */}
              <div className="mt-4 p-4 rounded-2xl bg-white/70 border border-white">
                <span className="text-xs font-bold text-slate-400 block mb-1">Biography</span>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  {user?.bio || 'Passionate sports enthusiast competing on SportSphere and leading team performance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Squad Invitations */}
          <div className="space-y-6">
            <div className="p-6 rounded-[40px] glass-panel bg-white/60 border border-white">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                <Shield size={18} className="text-blue-500" />
                <span>Squad Invitations</span>
              </h3>
              <TeamInvitations />
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ANALYTICS & CAREER */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-[40px] glass-panel bg-white/60 border border-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Performance Analytics</h2>
                <p className="text-xs text-slate-500 font-medium">Monthly training volume & competitive match points</p>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                Current Season 2026
              </div>
            </div>

            {/* Clean Recharts Bar Graph matching light glassmorphic theme */}
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      color: '#1e293b',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 30px rgba(0, 0, 255, 0.08)'
                    }}
                  />
                  <Bar dataKey="points" name="Match Points" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="workouts" name="Workouts" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SQUADS & TEAMS */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">My Squads & Rosters</h2>
            <Link
              to="/teams/create"
              className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]"
            >
              <Plus size={15} />
              <span>Create New Squad</span>
            </Link>
          </div>

          {myTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTeams.map(team => (
                <div
                  key={team._id || team.id}
                  className="p-6 rounded-[32px] glass-panel bg-white/60 border border-white hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center font-extrabold text-lg shadow-sm">
                        {team.name?.substring(0, 2).toUpperCase() || 'TM'}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/50">
                        {team.sport || 'Cricket'}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight mb-1">{team.name}</h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">
                      {team.description || 'Active competitive team participating in SportSphere leagues.'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>Roster Members</span>
                      <span className="font-bold text-slate-800">{team.members?.length || 1} Players</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        to={`/teams/${team._id || team.id}`}
                        className="flex-1 py-2 px-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold text-center transition-colors shadow-sm"
                      >
                        Team Roster
                      </Link>
                      <Link
                        to={`/teams/${team._id || team.id}/chat`}
                        className="py-2 px-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center transition-colors"
                        title="Squad Chat"
                      >
                        <MessageSquare size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-[40px] glass-panel bg-white/40 border border-dashed border-slate-300 text-center">
              <Shield size={44} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Squads Registered Yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">Create your own squad as team captain or accept team invitations.</p>
              <Link to="/teams/create" className="px-6 py-2.5 rounded-full bg-blue-500 text-white font-bold text-xs shadow-sm">
                Create First Squad
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 4. INLINE EDIT PROFILE MODAL (Clean Glassmorphism) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-[40px] max-w-lg w-full p-6 md:p-8 shadow-2xl border border-white relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Edit Athlete Profile</h3>
                  <p className="text-xs text-slate-500 font-medium">Update your profile attributes</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Bio / Headline</label>
                <textarea
                  rows="3"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Share your athletic goals or tournament achievements..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Primary Sport</label>
                  <select
                    value={profileForm.primarySport}
                    onChange={(e) => setProfileForm(p => ({ ...p, primarySport: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                  >
                    <option value="cricket">Cricket</option>
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="badminton">Badminton</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="kabaddi">Kabaddi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jersey Number</label>
                  <input
                    type="text"
                    value={profileForm.jerseyNumber}
                    onChange={(e) => setProfileForm(p => ({ ...p, jerseyNumber: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

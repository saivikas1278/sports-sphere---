import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Edit2, 
  Camera, 
  Trophy, 
  LineChart, 
  Dumbbell, 
  Calendar, 
  MapPin,
  Phone,
  Mail,
  Cake,
  Shield,
  Save,
  X,
  Eye,
  EyeOff,
  Gamepad2,
  Medal,
  Flame,
  User,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { loadUser, uploadAvatar } from '../../redux/slices/authSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import profileService from '../../services/profileService';
import { showToast } from '../../utils/toast';
import TeamInvitations from '../../components/Teams/TeamInvitations';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading: isLoading, isAuthenticated } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [showStats, setShowStats] = useState(true);

  // Use actual user data instead of mock data
  const [profileData, setProfileData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      location: '',
      bio: '',
      profilePicture: null,
      joinDate: ''
    },
    stats: {
      tournamentsJoined: 0,
      matchesPlayed: 0,
      winRate: 0,
      totalScore: 0,
      fitnessStreak: 0,
      workoutsCompleted: 0
    },
    recentActivity: [],
    achievements: []
  });

  // ALL HOOKS MUST BE CALLED FIRST - before any early returns

  // Fetch user profile data on component mount
  useEffect(() => {
    if (!user && isAuthenticated) {
      console.log('[ProfilePage] Loading user profile...');
      dispatch(loadUser());
    }
  }, [dispatch, user, isAuthenticated]);

  // Update profile data when user data changes
  useEffect(() => {
    if (user) {
      console.log('[ProfilePage] Updating profile data with user:', user);
      setProfileData(prev => ({
        ...prev,
        personalInfo: {
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          location: user.location ? `${user.location.city || ''}, ${user.location.state || ''}`.replace(/^,\s*|,\s*$/g, '') : '',
          bio: user.bio || 'No bio available',
          profilePicture: user.avatar || null,
          joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : ''
        },
        stats: {
          tournamentsJoined: user.stats?.tournamentsParticipated || 0,
          matchesPlayed: user.stats?.matchesPlayed || 0,
          winRate: user.stats?.matchesPlayed > 0 ? Math.round((user.stats?.matchesWon || 0) / user.stats.matchesPlayed * 100) : 0,
          totalScore: user.stats?.totalScore || 0,
          fitnessStreak: user.stats?.fitnessStreak || 0,
          workoutsCompleted: user.stats?.workoutsCompleted || 0
        },
        recentActivity: [
          // Since we don't have real activity data yet, show a placeholder
          { id: 1, type: 'profile', title: 'Profile updated', date: new Date().toISOString().split('T')[0], status: 'completed' }
        ],
        achievements: [
          { id: 1, title: 'New Member', description: 'Welcome to SportSphere!', icon: '🎉', earned: true },
          { id: 2, title: 'Profile Complete', description: 'Complete your profile information', icon: '👤', earned: !!user.bio },
          { id: 3, title: 'Team Player', description: 'Join your first team', icon: '👥', earned: false },
          { id: 4, title: 'Tournament Participant', description: 'Join your first tournament', icon: '🏆', earned: false },
          { id: 5, title: 'Fitness Enthusiast', description: 'Complete 10 workouts', icon: '💪', earned: false },
          { id: 6, title: 'Social Butterfly', description: 'Connect with 10 athletes', icon: '🦋', earned: false }
        ]
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isEditing) {
      setEditedProfile(profileData.personalInfo);
    }
  }, [isEditing, profileData.personalInfo]);

  // NOW we can have early returns AFTER all hooks are called

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-4 md:mb-6">Please log in to view your profile</h2>
          <Link to="/login" className="px-4 md:px-8 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setEditedProfile({});
    }
  };

  const handleSave = async () => {
    try {
      const response = await profileService.updateProfile(editedProfile);
      if (response.success) {
        setProfileData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, ...editedProfile }
        }));
        showToast('Profile updated successfully', 'success');
        dispatch(loadUser()); // Refresh user in Redux
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    }
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'tournament': return <Trophy className="text-yellow-500" size={20} />;
      case 'workout': return <Dumbbell className="text-blue-500" size={20} />;
      case 'match': return <Gamepad2 className="text-green-500" size={20} />;
      case 'fitness': return <Flame className="text-red-500" size={20} />;
      case 'profile': return <User className="text-purple-500" size={20} />;
      default: return <Calendar className="text-slate-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'won': return 'text-green-600 bg-green-50 border-green-100';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'lost': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      {/* Profile Header */}
      <div className="p-5 md:p-8 md:p-12 rounded-[32px] md:rounded-[40px] glass-panel bg-white/40 mb-4 md:mb-8 border border-white/60">
        <div className="flex flex-row md:flex-row items-center md:items-start gap-4 md:gap-8">
          
        {/* Profile Picture */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 md:border-8 border-white/80 shadow-lg relative bg-white">
            <img
              src={profileData.personalInfo.profilePicture || `https://ui-avatars.com/api/?name=${profileData.personalInfo.fullName}&background=6366f1&color=fff&size=200`}
              alt={profileData.personalInfo.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <label 
            htmlFor="profile-avatar-upload"
            className="absolute bottom-0 right-0 md:bottom-2 md:right-2 w-8 h-8 md:w-10 md:h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 shadow-md transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 md:w-5 md:h-5" />
            <input 
              id="profile-avatar-upload"
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  dispatch(uploadAvatar(e.target.files[0])).then(() => {
                    dispatch(loadUser());
                  });
                }
              }}
            />
          </label>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-left pt-1 md:pt-2 overflow-hidden">
          {!isEditing ? (
            <>
              <h1 className="text-xl md:text-3xl md:text-4xl font-extrabold text-slate-800 mb-1 md:mb-3 tracking-tight truncate">{profileData.personalInfo.fullName}</h1>
              <p className="text-slate-600 font-medium mb-3 md:mb-5 text-sm md:text-lg max-w-2xl line-clamp-2 md:line-clamp-none">{profileData.personalInfo.bio}</p>
              <div className="hidden sm:flex flex-wrap justify-start gap-3">
                <div className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/60 rounded-full border border-white">
                  <MapPin className="mr-1.5 md:mr-2 text-blue-500 w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-bold text-slate-700">{profileData.personalInfo.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/60 rounded-full border border-white">
                  <Calendar className="mr-1.5 md:mr-2 text-blue-500 w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-bold text-slate-700">Joined {profileData.personalInfo.joinDate ? new Date(profileData.personalInfo.joinDate).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <input
                type="text"
                value={editedProfile.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full text-2xl font-extrabold bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                placeholder="Full Name"
              />
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 resize-none font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                rows={3}
                placeholder="Bio"
              />
              <input
                type="text"
                value={editedProfile.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                placeholder="Location"
              />
            </div>
          )}
        </div>
        </div>
        
        {/* Mobile Info (Shown only on very small screens) */}
        {!isEditing && (
          <div className="flex sm:hidden flex-wrap justify-start gap-2 mt-4">
            <div className="flex items-center px-3 py-1.5 bg-white/60 rounded-full border border-white">
              <MapPin className="mr-1.5 text-blue-500 w-3 h-3" />
              <span className="text-xs font-bold text-slate-700">{profileData.personalInfo.location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center px-3 py-1.5 bg-white/60 rounded-full border border-white">
              <Calendar className="mr-1.5 text-blue-500 w-3 h-3" />
              <span className="text-xs font-bold text-slate-700">Joined {profileData.personalInfo.joinDate ? new Date(profileData.personalInfo.joinDate).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-row flex-wrap sm:flex-nowrap gap-2 md:gap-3 pt-4 md:pt-0 shrink-0 md:ml-auto md:self-start mt-2 md:mt-0">
          {!isEditing ? (
            <button
              onClick={handleEditToggle}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 bg-white text-slate-700 text-sm md:text-base font-bold rounded-full border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Edit2 className="mr-2 text-blue-500 w-4 h-4 md:w-5 md:h-5" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 bg-blue-500 text-white text-sm md:text-base font-bold rounded-full shadow-sm hover:shadow-md hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
              >
                <Save className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                Save
              </button>
              <button
                onClick={handleEditToggle}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 bg-slate-100 text-slate-600 text-sm md:text-base font-bold rounded-full shadow-sm hover:bg-slate-200 transition-all"
              >
                <X className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 bg-white/60 text-slate-700 text-sm md:text-base font-bold rounded-full border border-white/60 shadow-sm hover:shadow-md hover:bg-white transition-all"
          >
            {showStats ? <EyeOff className="mr-2 text-indigo-500 w-4 h-4 md:w-5 md:h-5" /> : <Eye className="mr-2 text-indigo-500 w-4 h-4 md:w-5 md:h-5" />}
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Left Column - Stats & Quick Actions */}
        <div className="space-y-8">
          
          {/* Team Invitations */}
          <TeamInvitations />

          {/* Stats */}
          <div className={`transition-all duration-500 overflow-hidden ${showStats ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
              <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Your Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 md:p-6 bg-white/60 rounded-2xl hover:-translate-y-1 hover:shadow-sm transition-all border border-white">
                  <Trophy className="text-blue-500 mx-auto mb-3" size={32} />
                  <div className="text-xl md:text-3xl font-black text-slate-800 mb-1">{profileData.stats.tournamentsJoined}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tournaments</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-white/60 rounded-2xl hover:-translate-y-1 hover:shadow-sm transition-all border border-white">
                  <Gamepad2 className="text-green-500 mx-auto mb-3" size={32} />
                  <div className="text-xl md:text-3xl font-black text-slate-800 mb-1">{profileData.stats.matchesPlayed}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matches</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-white/60 rounded-2xl hover:-translate-y-1 hover:shadow-sm transition-all border border-white">
                  <LineChart className="text-amber-500 mx-auto mb-3" size={32} />
                  <div className="text-xl md:text-3xl font-black text-slate-800 mb-1">{profileData.stats.winRate}%</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Win Rate</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-white/60 rounded-2xl hover:-translate-y-1 hover:shadow-sm transition-all border border-white">
                  <Dumbbell className="text-purple-500 mx-auto mb-3" size={32} />
                  <div className="text-xl md:text-3xl font-black text-slate-800 mb-1">{profileData.stats.fitnessStreak} 🔥</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Day Streak</div>
                </div>
              </div>

              {/* Player Analytics Charts */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Win/Loss Pie Chart */}
                <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm flex flex-col items-center">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                    <PieChartIcon className="mr-2 text-blue-500" size={16} /> Win/Loss Ratio
                  </h4>
                  <div className="w-full h-48">
                    {profileData.stats.matchesPlayed > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Wins', value: Math.round((profileData.stats.winRate / 100) * profileData.stats.matchesPlayed), color: '#3b82f6' },
                              { name: 'Losses & Draws', value: Math.round(((100 - profileData.stats.winRate) / 100) * profileData.stats.matchesPlayed), color: '#cbd5e1' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {
                              [
                                { name: 'Wins', value: Math.round((profileData.stats.winRate / 100) * profileData.stats.matchesPlayed), color: '#3b82f6' },
                                { name: 'Losses & Draws', value: Math.round(((100 - profileData.stats.winRate) / 100) * profileData.stats.matchesPlayed), color: '#cbd5e1' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))
                            }
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">No match data yet</div>
                    )}
                  </div>
                </div>

                {/* Activity Bar Chart */}
                <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm flex flex-col items-center">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                    <BarChartIcon className="mr-2 text-indigo-500" size={16} /> Activity History
                  </h4>
                  <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Tournaments', count: profileData.stats.tournamentsJoined },
                          { name: 'Matches', count: profileData.stats.matchesPlayed },
                          { name: 'Workouts', count: profileData.stats.workoutsCompleted }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis hide />
                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Contact Information</h2>
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-white/60 rounded-2xl border border-white">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                    <Mail className="text-blue-500" size={18} />
                  </div>
                  <span className="text-slate-700 font-bold truncate">{profileData.personalInfo.email}</span>
                </div>
                <div className="flex items-center p-4 bg-white/60 rounded-2xl border border-white">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                    <Phone className="text-green-500" size={18} />
                  </div>
                  <span className="text-slate-700 font-bold">{profileData.personalInfo.phone || 'Not specified'}</span>
                </div>
                <div className="flex items-center p-4 bg-white/60 rounded-2xl border border-white">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                    <Cake className="text-purple-500" size={18} />
                  </div>
                  <span className="text-slate-700 font-bold">{profileData.personalInfo.dateOfBirth ? new Date(profileData.personalInfo.dateOfBirth).toLocaleDateString() : 'Not specified'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="email"
                  value={editedProfile.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={editedProfile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                  placeholder="Phone"
                />
                <input
                  type="date"
                  value={editedProfile.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all text-slate-500"
                />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 tracking-tight">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/tournaments" 
                className="flex items-center px-5 py-4 bg-white/60 hover:bg-white rounded-2xl border border-white hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Trophy size={18} />
                </div>
                <span className="font-bold text-slate-700">Join Tournament</span>
              </Link>
              <Link 
                to="/fitness/workout-builder" 
                className="flex items-center px-5 py-4 bg-white/60 hover:bg-white rounded-2xl border border-white hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <Dumbbell size={18} />
                </div>
                <span className="font-bold text-slate-700">Start Workout</span>
              </Link>
              <Link 
                to="/fitness/progress" 
                className="flex items-center px-5 py-4 bg-white/60 hover:bg-white rounded-2xl border border-white hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <LineChart size={18} />
                </div>
                <span className="font-bold text-slate-700">View Progress</span>
              </Link>
              <Link 
                to="/settings" 
                className="flex items-center px-5 py-4 bg-white/60 hover:bg-white rounded-2xl border border-white hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mr-4 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                  <Shield size={18} />
                </div>
                <span className="font-bold text-slate-700">Settings</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column - Activity & Achievements */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Achievements */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 md:mb-8 tracking-tight">Achievements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileData.achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all hover:-translate-y-1 hover:shadow-md flex flex-col items-start ${
                    achievement.earned 
                      ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' 
                      : 'border-white bg-white/60 opacity-70 grayscale-[50%]'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl md:text-4xl mr-4 drop-shadow-sm">{achievement.icon}</span>
                    <h3 className={`font-extrabold text-lg leading-tight ${
                      achievement.earned ? 'text-amber-900' : 'text-slate-700'
                    }`}>
                      {achievement.title}
                    </h3>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed mb-4 ${
                    achievement.earned ? 'text-amber-700' : 'text-slate-500'
                  }`}>
                    {achievement.description}
                  </p>
                  {achievement.earned ? (
                    <div className="mt-auto">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-200 text-amber-800 uppercase tracking-wider">
                        <Medal className="mr-1.5" size={14} />
                        Earned
                      </span>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-400 uppercase tracking-wider border border-slate-200">
                        Locked
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <div className="flex justify-between items-center mb-4 md:mb-8">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Recent Activity</h2>
              <Link to="/dashboard" className="text-blue-500 hover:text-blue-700 text-sm font-bold bg-white/60 px-4 py-2 rounded-full border border-white hover:shadow-sm transition-all">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {profileData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-5 bg-white/60 rounded-2xl border border-white hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mr-5 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg mb-1">{activity.title}</h3>
                      <p className="text-sm font-medium text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              ))}
              
              {profileData.recentActivity.length === 0 && (
                <div className="text-center py-4 md:py-6 md:py-10 bg-white/30 rounded-2xl md:rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-500 font-medium">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default ProfilePage;

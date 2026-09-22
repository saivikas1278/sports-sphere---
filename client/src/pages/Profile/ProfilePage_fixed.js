import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaEdit, 
  FaCamera, 
  FaTrophy, 
  FaChartLine, 
  FaDumbbell, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaShieldAlt,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaGamepad,
  FaMedal,
  FaFire,
  FaUser
} from 'react-icons/fa';
import { loadUser } from '../../redux/slices/authSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import GlareHover from '../../components/UI/GlareHover';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
          <Link to="/login" className="bg-blue-600 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
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

  const handleSave = () => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: editedProfile
    }));
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
      case 'tournament': return <FaTrophy className="text-yellow-500" />;
      case 'workout': return <FaDumbbell className="text-blue-500" />;
      case 'match': return <FaGamepad className="text-green-500" />;
      case 'fitness': return <FaFire className="text-red-500" />;
      case 'profile': return <FaUser className="text-purple-500" />;
      default: return <FaCalendarAlt className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'won': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'lost': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-4 md:mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200">
                <img
                  src={profileData.personalInfo.profilePicture || `https://ui-avatars.com/api/?name=${profileData.personalInfo.fullName}&background=6366f1&color=fff&size=200`}
                  alt={profileData.personalInfo.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                <FaCamera size={16} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {!isEditing ? (
                <>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">{profileData.personalInfo.fullName}</h1>
                  <p className="text-gray-600 mb-4">{profileData.personalInfo.bio}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-2" />
                      {profileData.personalInfo.location || 'Location not specified'}
                    </div>
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Joined {profileData.personalInfo.joinDate ? new Date(profileData.personalInfo.joinDate).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editedProfile.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full text-2xl font-bold bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Full Name"
                  />
                  <textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 resize-none"
                    rows={3}
                    placeholder="Bio"
                  />
                  <input
                    type="text"
                    value={editedProfile.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Location"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaSave className="mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FaTimes className="mr-2" />
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {showStats ? <FaEyeSlash className="mr-2" /> : <FaEye className="mr-2" />}
                {showStats ? 'Hide' : 'Show'} Stats
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Stats & Quick Actions */}
          <div className="space-y-8">
            {/* Stats */}
            {showStats && (
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FaTrophy className="text-2xl text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{profileData.stats.tournamentsJoined}</div>
                    <div className="text-sm text-gray-600">Tournaments</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <FaGamepad className="text-2xl text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{profileData.stats.matchesPlayed}</div>
                    <div className="text-sm text-gray-600">Matches</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <FaChartLine className="text-2xl text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{profileData.stats.winRate}%</div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <FaDumbbell className="text-2xl text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{profileData.stats.workoutsCompleted}</div>
                    <div className="text-sm text-gray-600">Workouts</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link 
                  to="/tournaments" 
                  className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FaTrophy className="inline mr-3 text-blue-600" />
                  Join Tournament
                </Link>
                <Link 
                  to="/fitness/workout-builder" 
                  className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <FaDumbbell className="inline mr-3 text-green-600" />
                  Start Workout
                </Link>
                <Link 
                  to="/fitness/progress" 
                  className="block w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <FaChartLine className="inline mr-3 text-purple-600" />
                  View Progress
                </Link>
                <Link 
                  to="/settings" 
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaShieldAlt className="inline mr-3 text-gray-600" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FaEnvelope className="text-gray-400 mr-3" />
                    <span className="text-gray-700">{profileData.personalInfo.email}</span>
                  </div>
                  <div className="flex items-center">
                    <FaPhone className="text-gray-400 mr-3" />
                    <span className="text-gray-700">{profileData.personalInfo.phone || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaBirthdayCake className="text-gray-400 mr-3" />
                    <span className="text-gray-700">{profileData.personalInfo.dateOfBirth ? new Date(profileData.personalInfo.dateOfBirth).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={editedProfile.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Email"
                  />
                  <input
                    type="tel"
                    value={editedProfile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Phone"
                  />
                  <input
                    type="date"
                    value={editedProfile.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Activity & Achievements */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {profileData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="mr-4">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{activity.title}</h3>
                        <p className="text-sm text-gray-600">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.achievements.map((achievement) => (
                  <GlareHover
                    key={achievement.id}
                    glareColor="#FFD700"
                    glareOpacity={0.3}
                    glareAngle={-45}
                    glareSize={200}
                    transitionDuration={600}
                  >
                    <div className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.earned 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}>
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{achievement.icon}</span>
                        <h3 className={`font-semibold ${
                          achievement.earned ? 'text-yellow-800' : 'text-gray-600'
                        }`}>
                          {achievement.title}
                        </h3>
                      </div>
                      <p className={`text-sm ${
                        achievement.earned ? 'text-yellow-700' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>
                      {achievement.earned && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                            <FaMedal className="mr-1" />
                            Earned
                          </span>
                        </div>
                      )}
                    </div>
                  </GlareHover>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

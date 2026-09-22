import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Video, 
  Activity, 
  Bell, 
  RefreshCcw,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import dashboardService from '../../services/dashboardService';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    watchedVideos: 0,
    completedWorkouts: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const refreshDashboard = async () => {
    if (!isAuthenticated || !user) return;
    try {
      setIsLoading(true);
      const statsResponse = await dashboardService.getDashboardStats();
      if (statsResponse.success) setStats(statsResponse.data);
      const activitiesResponse = await dashboardService.getRecentActivities();
      if (activitiesResponse.success) setRecentActivities(activitiesResponse.data);
      showToast('Dashboard refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh dashboard', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const statsResponse = await dashboardService.getDashboardStats();
        if (statsResponse.success) setStats(statsResponse.data);

        const activitiesResponse = await dashboardService.getRecentActivities();
        if (activitiesResponse.success) setRecentActivities(activitiesResponse.data);

        try {
          const notificationsResponse = await dashboardService.getNotifications();
          if (notificationsResponse.success) setNotifications(notificationsResponse.data);
        } catch (error) {
          console.log('Notifications not available yet');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [isAuthenticated, user]);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8 md:py-16 relative z-10 min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div className="w-12 md:w-20 h-12 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-blue-500 shadow-sm">
            <Trophy size={32} />
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Access Required</h2>
          <p className="text-slate-500 mb-4 md:mb-8 font-medium">Please sign in to access your personalized dashboard and track your sports journey.</p>
          <div className="space-y-4">
            <Link to="/login" className="block w-full py-4 rounded-full bg-blue-500 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all hover:scale-[1.02]">
              Sign In to Continue
            </Link>
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      
      {/* Welcome Section */}
      <div className="p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-gradient-to-r from-blue-500/10 to-blue-300/10 mb-4 md:mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl md:text-5xl font-extrabold text-slate-800 mb-2 tracking-tight">
            Welcome back, <span className="text-blue-600">{user?.firstName || user?.name || 'Athlete'}</span>!
          </h1>
          <p className="text-lg text-slate-500 font-medium">Track your sports journey and stay connected.</p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={isLoading}
          className="p-3 bg-white/70 backdrop-blur-md rounded-full hover:bg-white transition-colors shadow-sm disabled:opacity-50 text-slate-600"
          title="Refresh Dashboard"
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6 md:mb-10">
        {[
          { value: stats.tournaments, label: 'Tournaments', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50', link: '/tournaments' },
          { value: stats.teams, label: 'Teams', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', link: '/teams' },
          { value: stats.watchedVideos, label: 'Posts', icon: Video, color: 'text-purple-500', bg: 'bg-purple-50', link: '/posts' },
          { value: stats.completedWorkouts, label: 'Workouts', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/fitness' }
        ].map((stat, index) => (
          <Link key={index} to={stat.link} className="p-4 md:p-6 rounded-[32px] glass-panel flex flex-col hover:-translate-y-1 transition-transform hover:shadow-[0_12px_40px_rgb(0,0,255,0.08)] group">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={24} />
            </div>
            <h3 className="font-extrabold text-xl md:text-3xl text-slate-800 mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <h2 className="text-2xl font-bold mb-4 md:mb-6 text-slate-800 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { to: "/tournaments", icon: Trophy, label: "Tournaments" },
                { to: "/dashboard/registrations", icon: Activity, label: "My Registrations" },
                { to: "/teams", icon: Users, label: "Create Team" },
                { to: "/matches", icon: Calendar, label: "Join Match" },
                { to: "/fitness", icon: Activity, label: "Workout" }
              ].map((action, index) => (
                <Link key={index} to={action.to} className="p-5 rounded-2xl md:rounded-3xl glass-pill flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 hover:bg-white/90 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-110">
                    <action.icon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <h2 className="text-2xl font-bold mb-4 md:mb-6 text-slate-800 tracking-tight">Recent Activity</h2>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                        {activity.icon === 'FaTrophy' ? <Trophy size={20} /> : <Activity size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{activity.title}</h3>
                        <p className="text-sm text-slate-500">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                        activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        activity.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {activity.status}
                      </span>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 md:py-6 md:py-10 bg-white/30 rounded-2xl md:rounded-3xl">
                <p className="text-slate-500 mb-4 md:mb-6 font-medium">No recent activities found.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/tournaments" className="px-4 md:px-6 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors">
                    Join Tournament
                  </Link>
                  <Link to="/fitness" className="px-4 md:px-6 py-2 rounded-full bg-white text-slate-700 border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                    Start Workout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Bell size={20} className="text-blue-500" />
                Notifications
                {notifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {notifications.length}
                  </span>
                )}
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 transition-colors">
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-slate-800 mb-1">{notification.text}</p>
                    <p className="text-xs text-slate-400">{notification.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 md:py-6 md:py-10 bg-white/30 rounded-2xl md:rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">You're all caught up!</p>
              </div>
            )}
          </div>
          
          {/* Player Analytics Overview */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/60">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Registration Trends</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Win Rate</span>
                <span className="text-sm font-bold text-emerald-600">68%</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-slate-500">Matches Played</span>
                <span className="text-sm font-bold text-blue-600">42 This Year</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <Link to="/dashboard/registrations" className="block w-full py-3 mt-4 md:mt-6 text-center text-sm font-bold text-blue-600 bg-white/70 rounded-xl hover:bg-white transition-colors">
              View Full History
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;

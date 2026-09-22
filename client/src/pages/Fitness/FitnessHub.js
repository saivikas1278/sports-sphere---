import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Plus, 
  Apple, 
  Timer, 
  Play, 
  CalendarCheck,
  ChevronRight,
  Flame,
  Activity
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const FitnessHub = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [recommendedWorkouts, setRecommendedWorkouts] = useState([]);

  useEffect(() => {
    const fetchFitnessData = async () => {
      setIsLoading(true);
      try {
        const { default: fitnessService } = await import('../../services/fitnessService');
        const featuredResponse = await fitnessService.getFeaturedContent();
        const featuredData = featuredResponse.data?.data || [];
        
        if (featuredData.length > 0) {
          const formattedFeatured = featuredData.map(workout => ({
            id: workout._id,
            name: workout.title,
            duration: workout.duration || 30,
            difficulty: workout.difficulty || 'Intermediate',
            category: workout.category || 'Fitness',
            thumbnail: workout.thumbnailUrl || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
            calories: workout.caloriesBurned?.average || 300,
            exercises: workout.exercises?.length || 5,
            description: workout.description || ''
          }));
          
          setRecommendedWorkouts(formattedFeatured);
          if (formattedFeatured.length > 0) {
            setTodayWorkout(formattedFeatured[0]);
          }
        } else {
          setRecommendedWorkouts([]);
          setTodayWorkout(null);
        }

        setRecentWorkouts([
          {
            id: '1',
            name: 'Morning HIIT',
            date: 'Today',
            type: 'Cardio',
            duration: 25,
            calories: 320,
            completed: true,
            thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'
          },
          {
            id: '2',
            name: 'Upper Body Strength',
            date: 'Yesterday',
            type: 'Strength',
            duration: 45,
            calories: 280,
            completed: true,
            thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80'
          }
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching fitness data:', error);
        showToast('Failed to load fitness data', 'error');
        setIsLoading(false);
      }
    };

    fetchFitnessData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 mb-4 md:mb-8 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Fitness Hub</h1>
            <p className="text-lg text-slate-500 font-medium">Track your fitness journey, monitor progress, and achieve your goals.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/fitness/workout-builder" 
              className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 transition-all"
            >
              <Plus size={18} /> Create Workout
            </Link>
            <Link 
              to="/fitness/browse-workouts" 
              className="flex items-center gap-2 px-4 md:px-6 py-3 glass-panel text-slate-700 font-bold rounded-full hover:bg-white/80 hover:scale-105 transition-all"
            >
              <Dumbbell size={18} /> Browse All
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
              <h2 className="text-2xl font-bold mb-4 md:mb-6 text-slate-800 tracking-tight">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { to: "/fitness/browse-workouts", icon: Dumbbell, label: "Browse", color: "text-blue-500", bg: "bg-blue-50" },
                  { to: "/fitness/nutrition", icon: Apple, label: "Nutrition", color: "text-green-500", bg: "bg-green-50" },
                  { to: "/fitness/nutrition-guide", icon: Activity, label: "Guide", color: "text-orange-500", bg: "bg-orange-50" },
                  { to: "/fitness/timer", icon: Timer, label: "Timer", color: "text-red-500", bg: "bg-red-50" }
                ].map((action, index) => (
                  <Link key={index} to={action.to} className="p-5 rounded-2xl md:rounded-3xl glass-pill flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 hover:bg-white/90 transition-all group">
                    <div className={`w-12 h-12 rounded-full ${action.bg} ${action.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <action.icon size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Today's Recommended Workout */}
            {todayWorkout && (
              <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -z-10" />
                <h2 className="text-2xl font-bold mb-4 md:mb-6 text-slate-800 tracking-tight flex items-center gap-2">
                  <Flame className="text-orange-500" /> Today's Focus
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 md:gap-6 items-center">
                  <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden shrink-0 shadow-md">
                    <img src={todayWorkout.thumbnail} alt={todayWorkout.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider rounded-full">Recommended</span>
                        <span className="text-xs font-semibold text-slate-500">{todayWorkout.category} • {todayWorkout.difficulty}</span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-slate-800">{todayWorkout.name}</h3>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{todayWorkout.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 p-3 rounded-2xl border border-white">
                        <p className="text-2xl font-black text-slate-700">{todayWorkout.duration}<span className="text-sm font-medium text-slate-500 ml-1">min</span></p>
                      </div>
                      <div className="bg-white/60 p-3 rounded-2xl border border-white">
                        <p className="text-2xl font-black text-slate-700">{todayWorkout.exercises}<span className="text-sm font-medium text-slate-500 ml-1">moves</span></p>
                      </div>
                    </div>
                    
                    <button onClick={() => window.location.href = `/fitness/workout/${todayWorkout.id}`} className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                      <Play fill="currentColor" size={16} /> Start Workout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recommended List */}
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Recommended for You</h2>
                <Link to="/fitness/browse-workouts" className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {recommendedWorkouts.slice(1, 4).map(workout => (
                  <div key={workout.id} className="p-3 rounded-2xl md:rounded-3xl glass-panel bg-white/60 hover:-translate-y-1 hover:shadow-lg transition-all group">
                    <div className="w-full h-32 rounded-2xl overflow-hidden mb-3">
                      <img src={workout.thumbnail} alt={workout.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="px-1">
                      <h3 className="font-bold text-slate-800 truncate mb-1">{workout.name}</h3>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{workout.category} • {workout.difficulty}</p>
                      <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-3">
                        <span className="flex items-center gap-1"><Timer size={12}/> {workout.duration}m</span>
                        <span className="flex items-center gap-1"><Flame size={12}/> {workout.calories}c</span>
                      </div>
                      <Link to={`/fitness/workout/${workout.id}`} className="block w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-center text-sm rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                        Start
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Daily Motivation */}
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-gradient-to-br from-blue-500/10 to-purple-500/10 relative overflow-hidden border border-white/60">
              <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Daily Motivation</h3>
              <blockquote className="text-xl font-medium text-slate-700 italic leading-snug mb-4 relative z-10">
                "The groundwork for all happiness is good health."
              </blockquote>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest relative z-10">— Leigh Hunt</p>
              <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
                <Dumbbell size={120} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Recent Activity</h3>
                <Link to="/fitness/history" className="text-sm font-bold text-blue-600 flex items-center hover:text-blue-800">
                  History
                </Link>
              </div>
              <div className="space-y-4">
                {recentWorkouts.map(workout => (
                  <div key={workout.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors border border-white/60">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={workout.thumbnail} alt={workout.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                        {workout.name}
                        {workout.completed && <CalendarCheck size={14} className="text-green-500 shrink-0" />}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 truncate">{workout.date} • {workout.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-slate-700">{workout.duration}m</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{workout.calories} cal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessHub;

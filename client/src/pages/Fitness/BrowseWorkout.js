import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Dumbbell, 
  Clock, 
  Flame, 
  PlayCircle,
  Activity,
  Zap,
  Target
} from 'lucide-react';

const BrowseWorkout = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [videoErrors, setVideoErrors] = useState({});
  const videoRefs = useRef({});

  useEffect(() => {
    const currentRefs = videoRefs.current;
    Object.keys(currentRefs).forEach(workoutId => {
      const video = currentRefs[workoutId];
      if (video) {
        if (hoveredVideo === parseInt(workoutId)) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });

    return () => {
      Object.values(currentRefs).forEach(video => {
        if (video) video.pause();
      });
    };
  }, [hoveredVideo]);

  const sports = [
    { id: 'all', name: 'All Sports', icon: <Activity size={20} /> },
    { id: 'cricket', name: 'Cricket', icon: <Target size={20} /> },
    { id: 'badminton', name: 'Badminton', icon: <Zap size={20} /> },
    { id: 'football', name: 'Football', icon: <Target size={20} /> },
    { id: 'volleyball', name: 'Volleyball', icon: <Target size={20} /> },
    { id: 'kabaddi', name: 'Kabaddi', icon: <Target size={20} /> }
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels', color: 'bg-slate-200 text-slate-700' },
    { id: 'beginner', name: 'Beginner', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'intermediate', name: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'advanced', name: 'Advanced', color: 'bg-rose-100 text-rose-700 border-rose-200' }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: <Dumbbell size={16} /> },
    { id: 'strength', name: 'Strength', icon: <Dumbbell size={16} /> },
    { id: 'cardio', name: 'Cardio', icon: <Flame size={16} /> },
    { id: 'flexibility', name: 'Flexibility', icon: <Activity size={16} /> },
    { id: 'hiit', name: 'HIIT', icon: <Zap size={16} /> },
    { id: 'sports-specific', name: 'Sports Specific', icon: <Target size={16} /> }
  ];

  // Dummy data keeping structure intact
  const allWorkouts = [
    {
      id: 1, name: "Cricket Basics - Upper Body", sport: "cricket", difficulty: "beginner", category: "strength", duration: 30, calories: 180, exercises: 8, description: "Focus on building basic upper body strength for batting and bowling.", videoUrl: "/images/workout-videos/video1.mp4", tags: ["Upper Body", "Strength", "Beginner"]
    },
    {
      id: 3, name: "Cricket Power Training", sport: "cricket", difficulty: "intermediate", category: "strength", duration: 45, calories: 270, exercises: 10, description: "Advanced strength training focusing on power and explosive movements.", videoUrl: "/images/workout-videos/video3.mp4", tags: ["Power", "Strength", "Intermediate"]
    },
    {
      id: 6, name: "Badminton Fundamentals", sport: "badminton", difficulty: "beginner", category: "strength", duration: 30, calories: 180, exercises: 7, description: "Basic strength training focusing on badminton-specific muscle groups.", videoUrl: "/images/workout-videos/video6.mp4", tags: ["Fundamentals", "Strength", "Beginner"]
    },
    {
      id: 9, name: "Football Basics - Lower Body", sport: "football", difficulty: "beginner", category: "strength", duration: 35, calories: 210, exercises: 8, description: "Basic lower body strength training for football players.", videoUrl: "/images/workout-videos/video9.mp4", tags: ["Lower Body", "Strength", "Beginner"]
    }
  ];

  const getFilteredWorkouts = () => {
    return allWorkouts.filter(workout => {
      const sportMatch = selectedSport === 'all' || workout.sport === selectedSport;
      const difficultyMatch = selectedDifficulty === 'all' || workout.difficulty === selectedDifficulty;
      const categoryMatch = selectedCategory === 'all' || workout.category === selectedCategory;
      return sportMatch && difficultyMatch && categoryMatch;
    });
  };

  const filteredWorkouts = getFilteredWorkouts();

  const handleWorkoutSelect = (workout) => {
    navigate(`/fitness/workout/${workout.id}`, { state: { workout } });
  };

  const getDifficultyStyles = (difficulty) => {
    return difficulties.find(d => d.id === difficulty)?.color || 'bg-slate-200 text-slate-700';
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-7xl">
      {/* Header */}
      <div className="flex items-center mb-4 md:mb-8">
        <button 
          onClick={() => navigate('/fitness')}
          className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-white transition-colors shadow-sm mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Browse Workouts</h1>
          <p className="text-slate-500 font-medium">Find the perfect training session for your goals</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:w-80 flex-shrink-0 space-y-6">
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Sports</h3>
            <div className="space-y-2">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all font-bold ${
                    selectedSport === sport.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/60 text-slate-600 hover:bg-white hover:text-blue-500 border border-white shadow-sm'
                  }`}
                >
                  <span className={`mr-3 ${selectedSport === sport.id ? 'text-white' : 'text-slate-400'}`}>
                    {sport.icon}
                  </span>
                  {sport.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Difficulty</h3>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all font-bold ${
                    selectedDifficulty === difficulty.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/60 text-slate-600 hover:bg-white hover:text-blue-500 border border-white shadow-sm'
                  }`}
                >
                  {difficulty.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-2xl transition-all font-bold ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/60 text-slate-600 hover:bg-white hover:text-blue-500 border border-white shadow-sm'
                  }`}
                >
                  <span className={`mr-3 ${selectedCategory === category.id ? 'text-white' : 'text-slate-400'}`}>
                    {category.icon}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4 md:mb-6 px-2">
            <h2 className="text-xl font-extrabold text-slate-800">Results</h2>
            <div className="px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-sm rounded-full">
              {filteredWorkouts.length} found
            </div>
          </div>
          
          {filteredWorkouts.length === 0 ? (
            <div className="p-4 md:p-6 md:p-16 rounded-[40px] glass-panel bg-white/40 border border-white text-center flex flex-col items-center justify-center">
              <div className="w-16 md:w-24 h-16 md:h-24 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Dumbbell size={48} />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">No workouts found</h3>
              <p className="text-slate-500 font-medium">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-6">
              {filteredWorkouts.map((workout) => (
                <div 
                  key={workout.id} 
                  className="rounded-[32px] glass-panel bg-white/60 border border-white shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group flex flex-col h-full"
                >
                  {/* Video Thumbnail */}
                  <div 
                    className="h-56 relative overflow-hidden bg-slate-900/5"
                    onMouseEnter={() => setHoveredVideo(workout.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    {workout.videoUrl && !videoErrors[workout.id] ? (
                      <>
                        <video
                          ref={(el) => { if (el) videoRefs.current[workout.id] = el; }}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          preload="metadata"
                          poster="/images/workout-placeholder.jpg"
                          muted
                          loop
                          onError={() => setVideoErrors(prev => ({ ...prev, [workout.id]: true }))}
                        >
                          <source src={workout.videoUrl} type="video/mp4" />
                        </video>
                        <div className={`absolute inset-0 bg-blue-900/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${hoveredVideo === workout.id ? 'opacity-100' : 'opacity-0'}`}>
                          <PlayCircle className="text-white drop-shadow-md" size={64} strokeWidth={1.5} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                        <Dumbbell size={48} className="mb-2" />
                        <span className="font-bold text-sm">Preview Unavailable</span>
                      </div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${getDifficultyStyles(workout.difficulty)}`}>
                        {workout.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-4 md:p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-extrabold text-slate-800 mb-2 line-clamp-1">{workout.name}</h3>
                    <p className="text-slate-500 text-sm font-medium mb-4 md:mb-6 line-clamp-2 flex-1">{workout.description}</p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4 md:mb-6">
                      <div className="bg-white/80 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <Clock className="text-blue-500 mb-1" size={20} />
                        <span className="font-extrabold text-slate-700">{workout.duration}m</span>
                      </div>
                      <div className="bg-white/80 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <Flame className="text-orange-500 mb-1" size={20} />
                        <span className="font-extrabold text-slate-700">{workout.calories}</span>
                      </div>
                      <div className="bg-white/80 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <Dumbbell className="text-indigo-500 mb-1" size={20} />
                        <span className="font-extrabold text-slate-700">{workout.exercises}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleWorkoutSelect(workout)}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center group-hover:from-blue-600 group-hover:to-indigo-600"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseWorkout;

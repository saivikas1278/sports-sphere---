import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Dumbbell, 
  Clock, 
  Flame, 
  Play, 
  Pause, 
  Square, 
  CheckCircle2,
  Activity
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const WorkoutDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [workout, setWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      setLoading(true);
      if (location.state?.workout) {
        const workoutData = location.state.workout;
        if (!Array.isArray(workoutData.exercises)) workoutData.exercises = [];
        setWorkout(workoutData);
        setLoading(false);
      } else if (id) {
        try {
          const { default: fitnessService } = await import('../../services/fitnessService');
          const response = await fitnessService.getFitnessContentById(id);
          const workoutData = response.data?.data;
          
          if (workoutData) {
            setWorkout({
              id: workoutData._id,
              name: workoutData.title,
              sport: workoutData.category || "fitness",
              difficulty: workoutData.difficulty || "intermediate",
              category: workoutData.category || "strength",
              duration: workoutData.duration || 45,
              calories: workoutData.caloriesBurned?.average || 300,
              description: workoutData.description || "",
              tags: workoutData.tags || [],
              exercises: workoutData.exercises || []
            });
          } else {
            showToast("Workout not found", "error");
            navigate('/fitness/browse-workouts');
          }
        } catch (error) {
          console.error("Failed to load workout", error);
          showToast("Failed to load workout details", "error");
          navigate('/fitness/browse-workouts');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchWorkout();
  }, [id, location.state, navigate]);

  const startWorkout = () => {
    if (exercises.length === 0) {
      showToast('No exercises available for this workout', 'error');
      return;
    }
    setIsWorkoutActive(true);
    setCurrentExerciseIndex(0);
    showToast('Workout started!', 'success');
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
    showToast(isPaused ? 'Workout resumed' : 'Workout paused', 'info');
  };

  const stopWorkout = () => {
    setIsWorkoutActive(false);
    setCurrentExerciseIndex(0);
    setIsPaused(false);
    showToast('Workout stopped', 'info');
  };

  const nextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setIsWorkoutActive(false);
      showToast('Workout completed! Great job!', 'success');
    }
  };

  const completeExercise = () => {
    nextExercise();
  };

  if (loading || !workout) {
    return (
      <div className="flex justify-center items-center h-screen bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  const currentExercise = exercises[currentExerciseIndex];

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      <div className="mb-4 md:mb-8 flex items-center">
        <button 
          onClick={() => navigate('/fitness/browse-workouts')}
          className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-white transition-colors shadow-sm mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{workout.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview Card */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-8">
              <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
                workout.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                workout.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-rose-100 text-rose-700 border-rose-200'
              }`}>
                {workout.difficulty}
              </span>
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-800 mb-4">Workout Overview</h2>
            <p className="text-slate-600 font-medium mb-4 md:mb-8 max-w-lg">{workout.description}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-4 md:mb-6">
              <div className="bg-white/60 rounded-2xl p-4 border border-white flex flex-col items-center justify-center">
                <Clock className="text-blue-500 mb-2" size={24} />
                <span className="text-2xl font-black text-slate-800">{workout.duration}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Mins</span>
              </div>
              <div className="bg-white/60 rounded-2xl p-4 border border-white flex flex-col items-center justify-center">
                <Flame className="text-orange-500 mb-2" size={24} />
                <span className="text-2xl font-black text-slate-800">{workout.calories}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Cals</span>
              </div>
              <div className="bg-white/60 rounded-2xl p-4 border border-white flex flex-col items-center justify-center">
                <Dumbbell className="text-indigo-500 mb-2" size={24} />
                <span className="text-2xl font-black text-slate-800">{exercises.length}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Moves</span>
              </div>
            </div>
            
            {workout.tags && workout.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {workout.tags.map((tag, index) => (
                  <span key={index} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Workout Display */}
          {isWorkoutActive && currentExercise && exercises.length > 0 && (
            <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border-2 border-blue-200 shadow-lg shadow-blue-500/10">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center">
                  <Activity className="text-blue-500 mr-3" size={24} />
                  {currentExercise.name}
                </h2>
                <span className="text-sm font-bold text-slate-400">
                  {currentExerciseIndex + 1} of {exercises.length}
                </span>
              </div>
              
              <p className="text-slate-600 font-medium mb-4 md:mb-6">{currentExercise.description}</p>
              
              {currentExercise.videoUrl ? (
                <div className="rounded-2xl overflow-hidden mb-4 md:mb-8 border border-white shadow-sm bg-slate-900/5 aspect-video relative">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    loop
                    preload="metadata"
                  >
                    <source src={currentExercise.videoUrl} type="video/mp4" />
                  </video>
                </div>
              ) : (
                <div className="rounded-2xl border border-white shadow-sm bg-slate-100 aspect-video flex flex-col items-center justify-center text-slate-400 mb-4 md:mb-8">
                  <Dumbbell size={48} className="mb-4 text-slate-300" />
                  <span className="font-bold">No video available</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4 md:mb-8">
                <div className="bg-white rounded-2xl p-4 md:p-6 text-center border border-slate-100 shadow-sm">
                  <span className="block text-2xl md:text-4xl font-black text-blue-500 mb-1">{currentExercise.sets || '-'}</span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sets</span>
                </div>
                <div className="bg-white rounded-2xl p-4 md:p-6 text-center border border-slate-100 shadow-sm">
                  <span className="block text-2xl md:text-4xl font-black text-emerald-500 mb-1">
                    {currentExercise.reps || currentExercise.duration || '-'}
                  </span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    {currentExercise.reps ? 'Reps' : 'Secs'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={completeExercise}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition-all shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:-translate-y-1 flex items-center justify-center text-lg"
              >
                <CheckCircle2 className="mr-2" size={24} />
                Done! Next Exercise
              </button>
            </div>
          )}

          {/* Exercise List */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6">Workout Plan</h3>
            
            {exercises.length === 0 ? (
              <div className="text-center py-4 md:py-6 md:py-12">
                <Dumbbell size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-medium text-slate-500">No exercises found for this workout.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => {
                  const isActive = isWorkoutActive && index === currentExerciseIndex;
                  const isCompleted = isWorkoutActive && index < currentExerciseIndex;
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isActive 
                          ? 'bg-blue-50/50 border-blue-200 shadow-md' 
                          : isCompleted
                            ? 'bg-emerald-50/50 border-emerald-100'
                            : 'bg-white/60 border-white hover:border-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            isActive ? 'bg-blue-500 text-white' : 
                            isCompleted ? 'bg-emerald-500 text-white' : 
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                          </div>
                          <div>
                            <h4 className={`font-bold ${isActive ? 'text-blue-900' : isCompleted ? 'text-emerald-900' : 'text-slate-800'}`}>
                              {exercise.name}
                            </h4>
                            {exercise.description && (
                              <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">{exercise.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className={`font-extrabold ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                            {exercise.sets && exercise.reps 
                              ? `${exercise.sets} × ${exercise.reps}` 
                              : exercise.duration ? `${exercise.duration}s` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Main Action Button */}
          {exercises.length > 0 && (
            <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/60 border border-white text-center">
              {!isWorkoutActive ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto mb-4">
                    <Play size={24} className="ml-1" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 mb-2">Ready to sweat?</h3>
                  <p className="text-sm font-medium text-slate-500 mb-4 md:mb-6">Hit start to begin your guided session.</p>
                  <button
                    onClick={startWorkout}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-lg"
                  >
                    Start Workout
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-extrabold text-slate-800 mb-4 md:mb-6">Workout Active</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={pauseWorkout}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center"
                    >
                      {isPaused ? <Play className="mr-2" size={18} /> : <Pause className="mr-2" size={18} />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stopWorkout}
                      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center"
                    >
                      <Square className="mr-2" size={16} />
                      Stop
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Progress (Shows when active) */}
          {isWorkoutActive && exercises.length > 0 && (
            <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
              <h3 className="text-lg font-extrabold text-slate-800 mb-4">Session Progress</h3>
              
              <div className="flex justify-between items-end mb-2">
                <span className="text-xl md:text-3xl font-black text-blue-500">
                  {Math.round(((currentExerciseIndex) / exercises.length) * 100)}%
                </span>
                <span className="text-sm font-bold text-slate-400 mb-1">
                  {currentExerciseIndex} of {exercises.length}
                </span>
              </div>
              
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentExerciseIndex / exercises.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">More Tools</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/fitness/workout-builder')}
                className="w-full py-3 bg-white/60 text-slate-700 font-bold rounded-2xl border border-white shadow-sm hover:bg-white hover:text-blue-600 transition-colors"
              >
                Create Custom Workout
              </button>
              <button
                onClick={() => navigate('/fitness/timer')}
                className="w-full py-3 bg-white/60 text-slate-700 font-bold rounded-2xl border border-white shadow-sm hover:bg-white hover:text-blue-600 transition-colors"
              >
                Open Smart Timer
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetails;

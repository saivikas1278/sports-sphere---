import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  ArrowLeft, 
  Plus, 
  Clock, 
  Flame, 
  X, 
  Activity,
  Layers
} from 'lucide-react';
import { showToast } from '../../utils/toast';

const WorkoutBuilder = () => {
  const navigate = useNavigate();
  const [workoutData, setWorkoutData] = useState({
    name: '',
    description: '',
    category: 'Strength Training',
    difficulty: 'Beginner',
    estimatedDuration: 30,
    exercises: []
  });

  const [exerciseDatabase] = useState([
    { id: 1, name: 'Push-ups', category: 'Upper Body', equipment: 'Bodyweight', primaryMuscle: 'Chest' },
    { id: 2, name: 'Pull-ups', category: 'Upper Body', equipment: 'Pull-up Bar', primaryMuscle: 'Back' },
    { id: 3, name: 'Bench Press', category: 'Upper Body', equipment: 'Barbell', primaryMuscle: 'Chest' },
    { id: 4, name: 'Shoulder Press', category: 'Upper Body', equipment: 'Dumbbells', primaryMuscle: 'Shoulders' },
    { id: 5, name: 'Bicep Curls', category: 'Upper Body', equipment: 'Dumbbells', primaryMuscle: 'Biceps' },
    { id: 6, name: 'Squats', category: 'Lower Body', equipment: 'Bodyweight', primaryMuscle: 'Quadriceps' },
    { id: 7, name: 'Deadlifts', category: 'Lower Body', equipment: 'Barbell', primaryMuscle: 'Hamstrings' },
    { id: 8, name: 'Lunges', category: 'Lower Body', equipment: 'Bodyweight', primaryMuscle: 'Quadriceps' },
    { id: 9, name: 'Calf Raises', category: 'Lower Body', equipment: 'Bodyweight', primaryMuscle: 'Calves' },
    { id: 10, name: 'Plank', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Core' },
    { id: 11, name: 'Crunches', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Abs' },
    { id: 12, name: 'Russian Twists', category: 'Core', equipment: 'Bodyweight', primaryMuscle: 'Obliques' },
    { id: 13, name: 'Jumping Jacks', category: 'Cardio', equipment: 'Bodyweight', primaryMuscle: 'Full Body' },
    { id: 14, name: 'Burpees', category: 'Cardio', equipment: 'Bodyweight', primaryMuscle: 'Full Body' },
    { id: 15, name: 'Mountain Climbers', category: 'Cardio', equipment: 'Bodyweight', primaryMuscle: 'Core' }
  ]);

  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState('All');
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const categories = ['All', 'Upper Body', 'Lower Body', 'Core', 'Cardio'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWorkoutData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 30,
      restTime: 60,
      notes: ''
    };
    
    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    
    setShowExerciseModal(false);
    showToast('Exercise added to workout', 'success');
  };

  const removeExercise = (index) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index, field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const calculateEstimatedCalories = () => {
    const baseCaloriesPerMinute = {
      'Strength Training': 6,
      'Cardio': 10,
      'HIIT': 12,
      'Flexibility': 3,
      'Sports': 8
    };
    return Math.round(workoutData.estimatedDuration * (baseCaloriesPerMinute[workoutData.category] || 6));
  };

  const handleSaveWorkout = async () => {
    if (!workoutData.name.trim()) {
      showToast('Please enter a workout name', 'error');
      return;
    }
    if (workoutData.exercises.length === 0) {
      showToast('Please add at least one exercise', 'error');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Workout saved successfully!', 'success');
      navigate('/fitness');
    } catch (error) {
      showToast('Failed to save workout', 'error');
    }
  };

  const filteredExercises = selectedExerciseCategory === 'All' 
    ? exerciseDatabase 
    : exerciseDatabase.filter(ex => ex.category === selectedExerciseCategory);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-4 md:mb-8 flex items-center">
        <button 
          onClick={() => navigate('/fitness')}
          className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-white transition-colors shadow-sm mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Dumbbell className="text-blue-500" size={32} />
            Workout Builder
          </h1>
          <p className="text-slate-500 font-medium">Create your custom training plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
              <Layers className="text-blue-500" size={20} />
              Details
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Workout Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={workoutData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Upper Body Killer"
                    className="w-full px-5 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={workoutData.category}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 shadow-sm appearance-none"
                  >
                    <option value="Strength Training">Strength Training</option>
                    <option value="Cardio">Cardio</option>
                    <option value="HIIT">HIIT</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty Level</label>
                  <div className="flex bg-white/60 p-1 rounded-2xl border border-white">
                    {['Beginner', 'Intermediate', 'Advanced'].map(diff => (
                      <button
                        key={diff}
                        onClick={() => handleInputChange({ target: { name: 'difficulty', value: diff } })}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                          workoutData.difficulty === diff 
                            ? 'bg-blue-500 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Est. Duration (mins)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="estimatedDuration"
                      value={workoutData.estimatedDuration}
                      onChange={handleInputChange}
                      min="10"
                      max="180"
                      className="w-full px-5 py-3 pr-12 bg-white/80 backdrop-blur-md border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 shadow-sm"
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={workoutData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Describe your workout..."
                  className="w-full px-5 py-4 bg-white/80 backdrop-blur-md border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 shadow-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Activity className="text-indigo-500" size={20} />
                Exercises
              </h2>
              <button
                onClick={() => setShowExerciseModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-full hover:bg-indigo-100 transition-colors"
              >
                <Plus className="mr-1" size={16} /> Add Exercise
              </button>
            </div>

            {workoutData.exercises.length === 0 ? (
              <div className="text-center py-4 md:py-6 md:py-12 rounded-2xl border border-white border-dashed bg-white/20">
                <Dumbbell size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-bold text-slate-600 mb-1">No exercises added yet.</p>
                <p className="text-sm font-medium text-slate-400">Click "Add Exercise" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workoutData.exercises.map((exercise, index) => (
                  <div key={index} className="rounded-2xl glass-panel bg-white/60 border border-white p-5 shadow-sm group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800">{exercise.name}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{exercise.primaryMuscle} • {exercise.equipment}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeExercise(index)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/40 p-4 rounded-2xl border border-white/50">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1">Sets</label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1">Reps/Secs</label>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={exercise.weight}
                          onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value))}
                          min="0"
                          step="0.5"
                          className="w-full px-3 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 ml-1">Rest (s)</label>
                        <input
                          type="number"
                          value={exercise.restTime}
                          onChange={(e) => updateExercise(index, 'restTime', parseInt(e.target.value))}
                          min="0"
                          className="w-full px-3 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-100 rounded-xl focus:outline-none focus:border-blue-300"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        type="text"
                        value={exercise.notes}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        placeholder="Add notes (optional)..."
                        className="w-full px-4 py-2 text-sm font-medium text-slate-600 bg-white/40 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div>
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white sticky top-8">
            <h3 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6">Summary</h3>
            
            <div className="space-y-4 mb-4 md:mb-8">
              <div className="flex justify-between items-center p-4 bg-white/60 rounded-2xl border border-white">
                <span className="text-slate-500 font-bold">Duration</span>
                <span className="font-extrabold text-slate-800 flex items-center">
                  <Clock className="mr-1.5 text-blue-500" size={16} />
                  {workoutData.estimatedDuration}m
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white/60 rounded-2xl border border-white">
                <span className="text-slate-500 font-bold">Exercises</span>
                <span className="font-extrabold text-slate-800 flex items-center">
                  <Activity className="mr-1.5 text-indigo-500" size={16} />
                  {workoutData.exercises.length}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white/60 rounded-2xl border border-white">
                <span className="text-slate-500 font-bold">Est. Calories</span>
                <span className="font-extrabold text-slate-800 flex items-center">
                  <Flame className="mr-1.5 text-orange-500" size={16} />
                  {calculateEstimatedCalories()}
                </span>
              </div>
            </div>

            <button
              onClick={handleSaveWorkout}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-lg"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-6 md:p-8 border-b border-slate-200/50 bg-white/50">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-2xl font-extrabold text-slate-800">Add Exercise</h3>
                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedExerciseCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      selectedExerciseCategory === category
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="p-4 md:p-6 md:p-8 overflow-y-auto flex-grow custom-scrollbar bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{exercise.name}</h4>
                      <Plus className="text-slate-300 group-hover:text-blue-500" size={18} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-3">{exercise.primaryMuscle}</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                        {exercise.category}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                        {exercise.equipment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutBuilder;

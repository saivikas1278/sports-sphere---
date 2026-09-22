import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Apple, 
  Plus, 
  Search, 
  X,
  Droplets,
  Flame,
  Wheat,
  Beef
} from 'lucide-react';

const NutritionTracker = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyIntake, setDailyIntake] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0
  });
  const [goals] = useState({
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73,
    water: 8
  });
  const [meals, setMeals] = useState([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [waterIntake, setWaterIntake] = useState(0);

  const foodDatabase = [
    { id: 1, name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { id: 2, name: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
    { id: 3, name: 'Broccoli (1 cup)', calories: 25, protein: 3, carbs: 5, fat: 0.3 },
    { id: 4, name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { id: 5, name: 'Greek Yogurt (1 cup)', calories: 130, protein: 23, carbs: 9, fat: 0.4 },
    { id: 6, name: 'Almonds (28g)', calories: 161, protein: 6, carbs: 6, fat: 14 },
    { id: 7, name: 'Oats (1 cup)', calories: 154, protein: 5.3, carbs: 28, fat: 3 },
    { id: 8, name: 'Eggs (2 large)', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { id: 9, name: 'Sweet Potato (1 medium)', calories: 112, protein: 2, carbs: 26, fat: 0.1 },
    { id: 10, name: 'Salmon (100g)', calories: 208, protein: 25, carbs: 0, fat: 12 }
  ];

  useEffect(() => {
    const totals = meals.reduce((acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fat += meal.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    setDailyIntake({ ...totals, water: waterIntake });
  }, [meals, waterIntake]);

  const addFoodToMeal = (food, quantity = 1) => {
    const mealEntry = {
      id: Date.now(),
      ...food,
      calories: food.calories * quantity,
      protein: food.protein * quantity,
      carbs: food.carbs * quantity,
      fat: food.fat * quantity,
      quantity,
      meal: selectedMeal,
      date: selectedDate
    };

    setMeals([...meals, mealEntry]);
    setShowAddFood(false);
    setSearchQuery('');
  };

  const removeFoodFromMeal = (mealId) => {
    setMeals(meals.filter(meal => meal.id !== mealId));
  };

  const addWater = (glasses) => {
    setWaterIntake(prev => Math.min(prev + glasses, 12));
  };

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMealsByType = (mealType) => {
    return meals.filter(meal => meal.meal === mealType);
  };

  const getMealCalories = (mealType) => {
    return getMealsByType(mealType).reduce((total, meal) => total + meal.calories, 0);
  };

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
    { id: 'lunch', name: 'Lunch', icon: '☀️' },
    { id: 'dinner', name: 'Dinner', icon: '🌙' },
    { id: 'snacks', name: 'Snacks', icon: '🍎' }
  ];

  const MacroCard = ({ title, current, goal, colorClass, bgClass, icon: Icon }) => {
    const percentage = getProgressPercentage(current, goal);
    return (
      <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden group">
        <div className={`absolute -right-4 -top-4 w-16 md:w-24 h-16 md:h-24 ${bgClass}/20 rounded-full blur-2xl group-hover:${bgClass}/30 transition-all`}></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">{title}</h3>
            {Icon && <Icon className={colorClass} size={18} />}
          </div>
          
          <div className="flex items-end justify-between mb-3 mt-auto">
            <span className={`text-2xl md:text-4xl font-black ${colorClass}`}>{Math.round(current)}</span>
            <span className="text-sm font-bold text-slate-400 mb-1">/ {goal}</span>
          </div>
          
          <div className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner w-full">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${bgClass.replace('/20', '')}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-7xl animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/fitness')}
            className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-white transition-colors shadow-sm mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <Apple className="text-emerald-500" size={32} />
              Nutrition Tracker
            </h1>
            <p className="text-slate-500 font-medium">Log your meals and macros</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-slate-600 shadow-sm"
          />
          <button
            onClick={() => { setSelectedMeal('breakfast'); setShowAddFood(true); }}
            className="px-4 md:px-6 py-3 bg-emerald-500 text-white font-extrabold rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center shrink-0"
          >
            <Plus size={20} className="mr-1" />
            <span className="hidden md:inline">Add Food</span>
          </button>
        </div>
      </div>

      {/* Macros Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4 md:mb-8">
        <div className="col-span-2 lg:col-span-1">
          <MacroCard 
            title="Calories" 
            current={dailyIntake.calories} 
            goal={goals.calories} 
            colorClass="text-emerald-500"
            bgClass="bg-emerald-500"
            icon={Flame}
          />
        </div>
        <MacroCard 
          title="Protein" 
          current={dailyIntake.protein} 
          goal={goals.protein} 
          colorClass="text-rose-500"
          bgClass="bg-rose-500"
          icon={Beef}
        />
        <MacroCard 
          title="Carbs" 
          current={dailyIntake.carbs} 
          goal={goals.carbs} 
          colorClass="text-amber-500"
          bgClass="bg-amber-500"
          icon={Wheat}
        />
        <MacroCard 
          title="Fat" 
          current={dailyIntake.fat} 
          goal={goals.fat} 
          colorClass="text-purple-500"
          bgClass="bg-purple-500"
        />
        <div className="col-span-2 lg:col-span-1 p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white relative overflow-hidden group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-cyan-600 uppercase tracking-widest">Water</h3>
            <Droplets className="text-cyan-500" size={18} />
          </div>
          
          <div className="flex items-end justify-between mb-4">
            <span className="text-2xl md:text-4xl font-black text-cyan-500">{waterIntake}</span>
            <span className="text-sm font-bold text-slate-400 mb-1">/ {goals.water} gls</span>
          </div>
          
          <div className="flex space-x-2 mt-auto">
            <button
              onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}
              className="flex-1 py-2 bg-white/60 hover:bg-white text-slate-500 font-bold rounded-xl border border-white shadow-sm transition-colors text-lg"
            >
              -
            </button>
            <button
              onClick={() => addWater(1)}
              className="flex-1 py-2 bg-cyan-100 hover:bg-cyan-200 text-cyan-600 font-bold rounded-xl border border-cyan-200 shadow-sm transition-colors text-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {mealTypes.map(mealType => (
          <div key={mealType.id} className="p-4 md:p-6 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
            <div className="flex items-center justify-between mb-4 md:mb-6 pb-4 border-b border-white/50">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                <span className="mr-3 text-2xl">{mealType.icon}</span>
                {mealType.name}
              </h2>
              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-black text-slate-800 leading-none mb-1">
                  {Math.round(getMealCalories(mealType.id))}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">cals</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-4 md:mb-6 min-h-[100px]">
              {getMealsByType(mealType.id).map(meal => (
                <div key={meal.id} className="flex items-center justify-between p-4 bg-white/60 border border-white rounded-2xl shadow-sm group">
                  <div>
                    <p className="font-extrabold text-slate-800">{meal.name}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex gap-3">
                      <span className="text-emerald-600">{Math.round(meal.calories)} cal</span>
                      <span className="text-rose-600">{Math.round(meal.protein)}g P</span>
                      <span className="text-amber-600">{Math.round(meal.carbs)}g C</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeFoodFromMeal(meal.id)}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {getMealsByType(mealType.id).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                  <Apple size={32} className="mb-2 opacity-50" />
                  <p className="font-medium text-sm">No foods logged</p>
                </div>
              )}
            </div>

            <button
              onClick={() => { setSelectedMeal(mealType.id); setShowAddFood(true); }}
              className="w-full py-3 bg-white/80 hover:bg-white text-emerald-600 font-extrabold rounded-2xl border border-emerald-100 shadow-sm transition-all flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" /> Add to {mealType.name}
            </button>
          </div>
        ))}
      </div>

      {/* Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-6 md:p-8 border-b border-slate-200/50 bg-white/50">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800">
                  Add to {mealTypes.find(m => m.id === selectedMeal)?.name}
                </h2>
                <button
                  onClick={() => setShowAddFood(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search database..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold text-slate-700 shadow-sm"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-grow custom-scrollbar bg-slate-50/50">
              <div className="space-y-3">
                {filteredFoods.map(food => (
                  <div key={food.id} className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-slate-800">{food.name}</p>
                      <div className="flex gap-3 mt-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="text-emerald-600">{food.calories} cal</span>
                        <span>{food.protein}g P</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addFoodToMeal(food)}
                      className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
                
                {filteredFoods.length === 0 && (
                  <div className="text-center py-4 md:py-6 md:py-12 text-slate-400">
                    <Search size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No matching foods found.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTracker;

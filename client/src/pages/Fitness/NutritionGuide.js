import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Target, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { GiCricketBat, GiVolleyballBall, GiSoccerKick, GiRunningNinja } from 'react-icons/gi';
import { MdSportsTennis } from 'react-icons/md';

const NutritionGuide = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState('cricket');
  const [selectedSeason, setSelectedSeason] = useState('offseason');

  const cricketNutrition = {
    offseason: [
      {
        category: "Lean Protein",
        icon: <Zap className="text-rose-500" size={24} />,
        color: "rose",
        foods: [
          { name: "Chicken Breast", image: "/images/nutrition/chickenbreast.jpg", description: "High in protein, low in fat, supports muscle repair and growth during training." },
          { name: "Fish", image: "/images/nutrition/fish.jpg", description: "Rich in protein and omega-3 fatty acids, reduces inflammation and supports recovery." },
          { name: "Eggs", image: "/images/nutrition/egg.jpg", description: "Complete protein with essential amino acids and healthy fats for muscle building." },
          { name: "Greek Yogurt", image: "/images/nutrition/greekyogurt.jpg", description: "Protein-dense dairy with probiotics that aid gut health and nutrient absorption." },
          { name: "Lentils", image: "/images/nutrition/lentils.jpg", description: "Plant-based protein, high in fiber, supports sustained energy throughout training." },
          { name: "Tofu", image: "/images/nutrition/tofu.jpg", description: "Plant protein rich in calcium and iron, versatile for various meal preparations." }
        ]
      },
      {
        category: "Complex Carbs (moderate)",
        icon: <Activity className="text-amber-500" size={24} />,
        color: "amber",
        foods: [
          { name: "Brown Rice", image: "/images/nutrition/brownrice.jpg", description: "Slowly digestible complex carbs, provides sustained energy for long training sessions." },
          { name: "Quinoa", image: "/images/nutrition/quinoa.jpg", description: "Complete protein source with complex carbs, gluten-free and nutrient-dense." },
          { name: "Oats", image: "/images/nutrition/oats.jpg", description: "High in fiber, stabilizes blood sugar, provides steady fuel for endurance training." },
          { name: "Sweet Potatoes", image: "/images/nutrition/sweetpotato.jpg", description: "Rich in vitamins, minerals, and slow-release carbs for sustained performance." },
          { name: "Whole Wheat Bread", image: "/images/nutrition/bread.jpg", description: "Fiber-rich complex carbs, provides steady energy without blood sugar spikes." }
        ]
      },
      {
        category: "Healthy Fats",
        icon: <Target className="text-purple-500" size={24} />,
        color: "purple",
        foods: [
          { name: "Mixed Nuts", image: "/images/nutrition/mixednuts.webp", description: "Contain healthy fats, support brain function and heart health during recovery." },
          { name: "Seeds", image: "/images/nutrition/seeds.jpeg", description: "Omega-3 rich seeds, aid muscle recovery and reduce exercise inflammation." },
          { name: "Olive Oil", image: "/images/nutrition/olive oil.jpeg", description: "Monounsaturated fats, supports heart health and reduces joint inflammation." },
          { name: "Avocado", image: "/images/nutrition/avacado.webp", description: "Nutrient-dense healthy fats, supports hormone balance and reduces inflammation." }
        ]
      }
    ],
    onseason: [
      {
        category: "High-GI Carbs (Pre-Match)",
        icon: <Activity className="text-amber-500" size={24} />,
        color: "amber",
        foods: [
          { name: "White Rice", image: "/images/nutrition/whiterice.webp", description: "Quick-digesting carbs for instant energy boost before matches and training." },
          { name: "Pasta", image: "/images/nutrition/pasta.webp", description: "High-carb meal for sustained energy during long matches and intense sessions." },
          { name: "Bananas", image: "/images/nutrition/banana.jpg", description: "Natural sugars and potassium for quick energy and muscle cramp prevention." },
          { name: "Sports Drinks", image: "/images/nutrition/sportsdrinks.jpg", description: "Fast carbs and electrolytes to maintain hydration and energy during play." }
        ]
      },
      {
        category: "Moderate/Low-GI Carbs (Post-Match)",
        icon: <CheckCircle2 className="text-emerald-500" size={24} />,
        color: "emerald",
        foods: [
          { name: "Whole Wheat Bread", image: "/images/nutrition/bread.jpg", description: "Complex carbs with fiber to restore glycogen stores for the next game." },
          { name: "Sweet Potatoes", image: "/images/nutrition/sweetpotato.jpg", description: "Slow-release carbs with vitamins to replenish energy without blood sugar spikes." },
          { name: "Oats", image: "/images/nutrition/oats.jpg", description: "Fiber-rich complex carbs for steady glycogen restoration and muscle recovery." }
        ]
      },
      {
        category: "Protein",
        icon: <Zap className="text-rose-500" size={24} />,
        color: "rose",
        foods: [
          { name: "Lean Meat", image: "/images/nutrition/chickenbreast.jpg", description: "High-quality protein for muscle repair and recovery after intense matches." },
          { name: "Eggs", image: "/images/nutrition/egg.jpg", description: "Complete protein with essential amino acids for optimal muscle rebuilding." },
          { name: "Lentils", image: "/images/nutrition/lentils.jpg", description: "Plant-based protein with iron for oxygen delivery and muscle repair." }
        ]
      }
    ]
  };

  const badmintonNutrition = {
    offseason: [
      {
        category: "Lean Protein",
        icon: <Zap className="text-rose-500" size={24} />,
        color: "rose",
        foods: [
          { name: "Eggs", image: "/images/nutrition/egg.jpg", description: "Rich in complete protein for muscle repair and recovery after training." },
          { name: "Chicken Breast", image: "/images/nutrition/chickenbreast.jpg", description: "Lean protein that supports muscle growth without adding excess fat." },
          { name: "Fish", image: "/images/nutrition/fish.jpg", description: "High-quality protein with omega-3s for joint health and reduced inflammation." }
        ]
      },
      {
        category: "Complex Carbs",
        icon: <Activity className="text-amber-500" size={24} />,
        color: "amber",
        foods: [
          { name: "Brown Rice", image: "/images/nutrition/brownrice.jpg", description: "Complex carbohydrate providing steady energy for long training sessions." },
          { name: "Oats", image: "/images/nutrition/oats.jpg", description: "Slow-digesting carbs with fiber to keep energy levels stable during workouts." }
        ]
      }
    ],
    onseason: [
      {
        category: "High-GI Carbs (pre-match)",
        icon: <Activity className="text-amber-500" size={24} />,
        color: "amber",
        foods: [
          { name: "White Rice", image: "/images/nutrition/whiterice.webp", description: "Provides quick-digesting carbs for instant energy before matches." },
          { name: "Bananas", image: "/images/nutrition/banana.jpg", description: "Natural sugars and potassium to prevent cramps and boost energy." }
        ]
      }
    ]
  };

  const seasons = [
    { id: 'offseason', name: 'Off Season', icon: <Calendar size={18} /> },
    { id: 'onseason', name: 'On Season', icon: <Target size={18} /> }
  ];

  const sports = [
    { id: 'cricket', name: 'Cricket', icon: <GiCricketBat size={20} /> },
    { id: 'badminton', name: 'Badminton', icon: <MdSportsTennis size={20} /> },
    { id: 'football', name: 'Football', icon: <GiSoccerKick size={20} /> },
    { id: 'volleyball', name: 'Volleyball', icon: <GiVolleyballBall size={20} /> },
    { id: 'kabaddi', name: 'Kabaddi', icon: <GiRunningNinja size={20} /> }
  ];

  const getCurrentNutrition = () => {
    if (selectedSport === 'cricket') {
      return cricketNutrition[selectedSeason] || [];
    } else if (selectedSport === 'badminton') {
      return badmintonNutrition[selectedSeason] || [];
    }
    return cricketNutrition[selectedSeason] || [];
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-7xl animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center mb-4 md:mb-8">
        <button 
          onClick={() => navigate('/fitness')}
          className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-white transition-colors shadow-sm mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-500" size={32} />
            Nutrition Guide
          </h1>
          <p className="text-slate-500 font-medium">Expert fueling strategies for peak performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 border border-white sticky top-8">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Select Sport</h3>
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
            
            <div className="mt-4 md:mt-8 mb-4">
              <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Season Type</h3>
            </div>
            <div className="flex bg-white/60 p-1 rounded-2xl border border-white">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => setSelectedSeason(season.id)}
                  className={`flex-1 flex justify-center items-center py-3 px-2 text-xs font-bold rounded-xl transition-all ${
                    selectedSeason === season.id 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="mr-1.5">{season.icon}</span>
                  {season.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {getCurrentNutrition().map((group, groupIndex) => (
            <div key={groupIndex} className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className={`w-12 h-12 rounded-full bg-${group.color}-100 flex items-center justify-center`}>
                  {group.icon}
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800">{group.category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                {group.foods.map((food, index) => (
                  <div key={index} className="rounded-[24px] glass-panel bg-white/60 border border-white shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col">
                    <div className="h-40 overflow-hidden relative">
                      <div className="absolute inset-0 bg-slate-900/5 z-10 group-hover:bg-transparent transition-colors"></div>
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.src = '/images/nutrition-placeholder.jpg'; }}
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-extrabold text-slate-800 mb-2">{food.name}</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">{food.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NutritionGuide;

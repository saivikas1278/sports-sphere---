import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, User, Target, Compass, Flame } from 'lucide-react';

const FitnessDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-4xl animate-fade-in">
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
            <Activity className="text-blue-500" size={32} />
            Fitness Hub Details
          </h1>
          <p className="text-slate-500 font-medium">Your personalized activity center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white">
          <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
            <User size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Profile Insights</h2>
          <p className="text-slate-600 font-medium mb-4 md:mb-6">
            Detailed information about your fitness profile, training history, and biometric data will be available here soon.
          </p>
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
          </div>
        </div>

        <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
            <Target size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Goal Tracking</h2>
          <p className="text-slate-600 font-medium mb-4 md:mb-6">
            Set and monitor your long-term fitness objectives. Track your milestones and celebrate achievements.
          </p>
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
            <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
            <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
          </div>
        </div>

        <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white">
          <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
            <Flame size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Activity Streaks</h2>
          <p className="text-slate-600 font-medium mb-4 md:mb-6">
            View your consistency metrics, activity heatmap, and longest active streaks.
          </p>
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
            <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
          </div>
        </div>

        <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white">
          <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
            <Compass size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Journey Map</h2>
          <p className="text-slate-600 font-medium mb-4 md:mb-6">
            Explore different training paths, unlock new workout tiers, and map your progression.
          </p>
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
            <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessDetails;

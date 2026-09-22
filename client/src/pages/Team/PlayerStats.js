import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Activity, Trophy, Target, Zap } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const PlayerStats = () => {
  const { teamId, playerId } = useParams();

  const stats = [
    { label: 'Matches Played', value: '42', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Points Scored', value: '284', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'MVP Awards', value: '5', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg Rating', value: '8.4', icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' }
  ];

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex items-center gap-4 mb-4 md:mb-8">
          <Link to={`/teams/${teamId || '1'}`} className="p-2 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              Player Statistics
            </h1>
          </div>
        </div>

        {/* Profile Header */}
        <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/60 mb-4 md:mb-8 flex flex-col md:flex-row items-center gap-3 md:gap-6">
          <div className="w-16 md:w-24 h-16 md:h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-blue-500 font-bold text-2xl">
              MC
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-slate-800">Michael Chen</h2>
            <p className="text-slate-500 font-medium">Striker • Neon Strikers</p>
            <div className="mt-3 flex gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">Captain</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 md:mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass-panel p-4 md:p-6 rounded-[2rem] border border-white/60 text-center hover:-translate-y-1 transition-transform">
              <div className={`w-12 h-12 mx-auto rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={24} />
              </div>
              <p className="text-xl md:text-3xl font-black text-slate-800">{stat.value}</p>
              <h3 className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</h3>
            </div>
          ))}
        </div>

        {/* Performance Chart Mockup */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 md:mb-6">Recent Performance</h3>
          
          <div className="space-y-4">
            {[
              { match: 'vs Thunderbolts', rating: 8.5, date: 'Oct 12' },
              { match: 'vs City FC', rating: 7.2, date: 'Oct 15' },
              { match: 'vs Red Dragons', rating: 9.1, date: 'Oct 20' },
              { match: 'vs Spartans', rating: 8.8, date: 'Oct 25' }
            ].map((perf, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <span className="font-bold text-slate-700 text-sm">{perf.match}</span>
                    <span className="text-xs text-slate-400 ml-2">{perf.date}</span>
                  </div>
                  <span className="font-black text-blue-600">{perf.rating}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${perf.rating * 10}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlayerStats;

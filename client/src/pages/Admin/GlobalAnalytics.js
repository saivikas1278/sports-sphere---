import React from 'react';
import { LineChart, BarChart, TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const GlobalAnalytics = () => {
  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <LineChart className="text-blue-500" />
              Global Analytics
            </h1>
            <p className="text-slate-500 font-medium mt-1">Platform-wide health, growth, and revenue metrics.</p>
          </div>
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
            <Download size={18} /> Export Full Report
          </button>
        </div>

        {/* High Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-8">
          {[
            { label: 'Total Active Users', value: '124,592', trend: '+14.2%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Platform Revenue', value: '$842,500', trend: '+8.4%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Active Tournaments', value: '1,204', trend: '+22.1%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Engagement Rate', value: '68%', trend: '+4.5%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' }
          ].map((metric, i) => (
            <div key={i} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/60 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${metric.bg} ${metric.color}`}>
                  <metric.icon size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {metric.trend}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-500 mb-1">{metric.label}</h3>
              <p className="text-xl md:text-3xl font-black text-slate-800">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Mockup Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          
          {/* User Growth Chart */}
          <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 md:mb-8">
              <h3 className="text-lg font-bold text-slate-800">User Growth (YTD)</h3>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-600 outline-none">
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>
            {/* Mock Chart Visual */}
            <div className="relative h-64 w-full flex items-end gap-2 justify-between pt-6 md:pt-10">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-4 md:pb-8">
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
              </div>
              
              {/* Bars */}
              {[40, 55, 45, 70, 65, 85, 100, 90, 110, 130, 120, 150].map((h, i) => (
                <div key={i} className="relative z-10 w-full flex flex-col items-center group">
                  <div className="w-full bg-blue-100 rounded-t-md hover:bg-blue-200 transition-colors" style={{ height: `${h}px` }}>
                    <div className="w-full bg-blue-500 rounded-t-md" style={{ height: `${h * 0.7}px`, marginTop: `${h * 0.3}px` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-2">{'JFMAMJJASOND'[i]}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded transition-opacity pointer-events-none">
                    {Math.floor(h * 1.5)}k
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 md:mb-8">
              <h3 className="text-lg font-bold text-slate-800">Revenue Distribution</h3>
              <button className="text-slate-400 hover:text-blue-500"><BarChart size={20} /></button>
            </div>
            
            <div className="space-y-6 mt-4">
              {[
                { label: 'Tournament Fees (Platform Cut)', value: '65%', amount: '$547,625', color: 'bg-blue-500' },
                { label: 'Premium Subscriptions', value: '25%', amount: '$210,625', color: 'bg-purple-500' },
                { label: 'Sponsorship Ads', value: '10%', amount: '$84,250', color: 'bg-amber-500' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <div className="text-right">
                      <span className="block font-black text-slate-800">{item.amount}</span>
                      <span className="text-xs font-bold text-slate-400">{item.value}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: item.value }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GlobalAnalytics;

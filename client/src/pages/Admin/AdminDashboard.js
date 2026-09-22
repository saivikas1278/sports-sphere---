import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Trophy,
  MessageSquare,
  BarChart2,
  Settings,
  ChevronRight,
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const AdminDashboard = () => {
  // Mock data for dashboard
  const stats = [
    { title: 'Total Users', value: '12,450', change: '+12%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Active Tournaments', value: '342', change: '+5%', icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Pending Verification', value: '28', change: '-2%', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Reported Content', value: '15', change: '+1%', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const quickActions = [
    { title: 'Manage Users', desc: 'View, block, or verify users and roles.', link: '/admin/users', icon: Users },
    { title: 'Tournament Verification', desc: 'Review and approve pending tournaments.', link: '/admin/verification', icon: Trophy },
    { title: 'Content Moderation', desc: 'Review user reports and flagged content.', link: '/admin/moderation', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 font-medium mt-1">Platform overview and management.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-slate-500 font-semibold mb-1">{stat.title}</h3>
              <p className="text-xl md:text-3xl font-extrabold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-4 md:mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            <Link to="/admin/moderation" className="block p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all group">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Content Moderation</h3>
              <p className="text-sm text-slate-500">Review reported comments and posts</p>
            </Link>
            <Link to="/admin/analytics" className="block p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BarChart2 size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Global Analytics</h3>
              <p className="text-sm text-slate-500">Platform health and user growth</p>
            </Link>
            <Link to="/admin/settings" className="block p-5 bg-white rounded-2xl md:rounded-3xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all group">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Platform Settings</h3>
              <p className="text-sm text-slate-500">Configuration and API keys</p>
            </Link>
          </div>
        </div>

        {/* Global Analytics Overview (Placeholder) */}
        <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-500" /> Platform Growth
            </h2>
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
            <p className="text-slate-400 font-medium">Growth Chart Placeholder</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;

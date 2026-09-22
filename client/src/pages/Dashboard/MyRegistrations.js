import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const MyRegistrations = () => {
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past

  // Mock data
  const registrations = [
    { id: 1, tournamentName: 'City Summer League', role: 'Captain (Neon Strikers)', date: 'Aug 15 - Aug 20, 2024', status: 'approved', location: 'Central Park Arena', type: 'upcoming' },
    { id: 2, tournamentName: 'Winter Classic', role: 'Player (Neon Strikers)', date: 'Dec 10 - Dec 15, 2024', status: 'pending', location: 'Downtown Fields', type: 'upcoming' },
    { id: 3, tournamentName: 'Spring Kickoff', role: 'Player (Neon Strikers)', date: 'Mar 01 - Mar 05, 2024', status: 'completed', location: 'Eastside Sports Complex', type: 'past', result: 'Quarter Finals' }
  ];

  const displayedRegistrations = registrations.filter(r => r.type === activeTab);

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">My Registrations</h1>
          <p className="text-slate-500 font-medium mt-1">Track your active tournament registrations and match schedules.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 md:mb-8 border-b border-slate-200/60 pb-4">
          <button 
            className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Tournaments
          </button>
          <button 
            className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'past' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('past')}
          >
            Past Tournaments
          </button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {displayedRegistrations.length > 0 ? (
            displayedRegistrations.map(reg => (
              <div key={reg.id} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/60 hover:-translate-y-1 transition-transform group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${reg.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : reg.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    {reg.status === 'approved' ? <CheckCircle size={24} /> : reg.status === 'pending' ? <Clock size={24} /> : <Trophy size={24} />}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : reg.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                    {reg.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{reg.tournamentName}</h3>
                
                <div className="space-y-2 mb-4 md:mb-6 text-sm font-medium text-slate-500">
                  <p className="flex items-center gap-2"><AlertCircle size={16} className="text-slate-400" /> {reg.role}</p>
                  <p className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /> {reg.date}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {reg.location}</p>
                  {reg.result && <p className="flex items-center gap-2 text-purple-600 mt-2"><Trophy size={16} /> Result: {reg.result}</p>}
                </div>

                <Link to={`/tournaments/${reg.id}`} className="block w-full py-3 bg-white border border-slate-200 rounded-2xl font-bold text-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-4 md:py-6 md:py-12 glass-panel rounded-2xl md:rounded-3xl">
              <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-800">No {activeTab} registrations</h3>
              <p className="text-slate-500 mb-4 md:mb-6">You haven't registered for any tournaments in this category.</p>
              <Link to="/tournaments" className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
                Browse Tournaments
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrations;

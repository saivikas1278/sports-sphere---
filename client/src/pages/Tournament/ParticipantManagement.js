import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Search, Mail, ArrowLeft } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const ParticipantManagement = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const applicants = [
    { id: 1, teamName: 'Neon Strikers', captain: 'Alex Turner', playersCount: 5, appliedDate: '2023-10-10', status: 'pending' },
    { id: 2, teamName: 'Urban Legends', captain: 'Sarah Connor', playersCount: 6, appliedDate: '2023-10-11', status: 'approved' },
    { id: 3, teamName: 'The Rookies', captain: 'Mike Ross', playersCount: 4, appliedDate: '2023-10-09', status: 'rejected' },
    { id: 4, teamName: 'Titanium FC', captain: 'David Clark', playersCount: 7, appliedDate: '2023-10-12', status: 'pending' },
  ];

  const filteredApplicants = applicants.filter(
    app => app.status === activeTab && app.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link to={`/tournaments/${id}/dashboard`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4 md:mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Participant Management</h1>
            <p className="text-slate-500 font-medium mt-1">Review team applications and manage tournament roster.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search teams..." 
              className="pl-10 pr-4 py-2 bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 md:mb-6 border-b border-slate-200/60 pb-4">
          {['pending', 'approved', 'rejected'].map(tab => (
            <button 
              key={tab}
              className={`px-4 py-2 font-bold rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({applicants.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>

        {/* Applicants List */}
        <div className="grid gap-4">
          {filteredApplicants.length > 0 ? (
            filteredApplicants.map(app => (
              <div key={app.id} className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 border border-white/60">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{app.teamName}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Users size={16} /> Captain: {app.captain}</span>
                    <span>Players: {app.playersCount}</span>
                    <span>Applied: {app.appliedDate}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="p-2 text-slate-400 hover:text-blue-600 bg-white/60 rounded-xl transition-colors" title="Message Captain">
                    <Mail size={20} />
                  </button>
                  {activeTab === 'pending' && (
                    <>
                      <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2">
                        <CheckCircle size={18} /> Approve
                      </button>
                      <button className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
                        <XCircle size={18} /> Reject
                      </button>
                    </>
                  )}
                  {activeTab === 'approved' && (
                    <button className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
                      <XCircle size={18} /> Revoke
                    </button>
                  )}
                  {activeTab === 'rejected' && (
                    <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2">
                      <CheckCircle size={18} /> Re-Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 md:py-6 md:py-12 glass-panel rounded-2xl md:rounded-3xl">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-800">No {activeTab} applications</h3>
              <p className="text-slate-500">There are currently no teams in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantManagement;

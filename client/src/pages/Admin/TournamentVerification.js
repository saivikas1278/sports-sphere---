import React from 'react';
import { Check, X, MapPin, Calendar, Users } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const TournamentVerification = () => {
  const pendingTournaments = [
    {
      id: 1,
      title: 'Summer City Classic',
      organizer: 'Jane Smith',
      sport: 'Basketball',
      location: 'Central Park Arena, NY',
      date: 'Aug 15 - Aug 20, 2024',
      status: 'pending review',
      documents: ['ID Proof', 'Venue Permit']
    },
    {
      id: 2,
      title: 'Regional Soccer Championship',
      organizer: 'Mike Johnson',
      sport: 'Soccer',
      location: 'Downtown Fields',
      date: 'Sep 01 - Sep 10, 2024',
      status: 'pending review',
      documents: ['ID Proof']
    }
  ];

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Tournament Verification</h1>
          <p className="text-slate-500 font-medium mt-1">Review and approve newly created tournaments to ensure legitimacy.</p>
        </div>

        <div className="grid gap-3 md:gap-6">
          {pendingTournaments.map((tournament) => (
            <div key={tournament.id} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 border border-white/60 hover:shadow-lg transition-all">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-slate-800">{tournament.title}</h2>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    {tournament.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-4">
                  <span className="flex items-center gap-1"><Users size={16} /> By {tournament.organizer}</span>
                  <span className="flex items-center gap-1"><MapPin size={16} /> {tournament.location}</span>
                  <span className="flex items-center gap-1"><Calendar size={16} /> {tournament.date}</span>
                </div>

                <div className="flex gap-2">
                  {tournament.documents.map((doc, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
                      📄 {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 md:flex-col lg:flex-row">
                <button className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Check size={18} /> Approve
                </button>
                <button className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <X size={18} /> Reject
                </button>
              </div>

            </div>
          ))}

          {pendingTournaments.length === 0 && (
            <div className="text-center py-4 md:py-6 md:py-12 glass-panel rounded-2xl md:rounded-3xl">
              <Check size={48} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-slate-500">There are no tournaments pending verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentVerification;

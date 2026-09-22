import React, { useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle, Eye, AlertTriangle } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState('reports'); // reports, descriptions

  const reports = [
    { id: 1, type: 'Comment', reporter: 'Alex', target: 'JohnDoe', reason: 'Abusive Language', status: 'pending' },
    { id: 2, type: 'Post', reporter: 'Sarah', target: 'Team Alpha', reason: 'Inappropriate Content', status: 'pending' }
  ];

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Content Moderation
          </h1>
          <p className="text-slate-500 font-medium mt-1">Review flagged content, user reports, and maintain community standards.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 md:mb-8 border-b border-slate-200/60 pb-4">
          <button 
            className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'reports' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('reports')}
          >
            User Reports
          </button>
          <button 
            className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'descriptions' ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('descriptions')}
          >
            Tournament Descriptions Review
          </button>
        </div>

        {activeTab === 'reports' && (
          <div className="grid gap-3 md:gap-6">
            {reports.map(report => (
              <div key={report.id} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/60">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase">{report.type} Flagged</span>
                      <span className="text-sm text-slate-500">Reported by <span className="font-bold text-slate-700">{report.reporter}</span></span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Target: {report.target}</h3>
                    <p className="text-red-500 font-medium flex items-center gap-1 mb-4"><AlertTriangle size={16} /> Reason: {report.reason}</p>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white/70 rounded-xl" title="View Content">
                    <Eye size={20} />
                  </button>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-slate-200/60">
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors flex items-center gap-2">
                    <CheckCircle size={18} /> Dismiss Report
                  </button>
                  <button className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors flex items-center gap-2">
                    <Trash2 size={18} /> Delete Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'descriptions' && (
          <div className="text-center py-4 md:py-6 md:py-12 glass-panel rounded-2xl md:rounded-3xl">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">All Descriptions Look Good</h3>
            <p className="text-slate-500">There are no flagged tournament descriptions at this time.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ContentModeration;

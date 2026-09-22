import React, { useState } from 'react';
import { Settings, CreditCard, Shield, Bell, Save, CheckCircle } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const PlatformSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
    { id: 'security', label: 'Access Control', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row gap-4 md:gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-800">Platform Settings</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">System configuration</p>
            </div>
            <div className="p-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <form onSubmit={handleSave} className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-4 md:p-8 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 capitalize">
                {tabs.find(t => t.id === activeTab)?.label} Configuration
              </h2>
            </div>

            <div className="p-4 md:p-8 space-y-6">
              {activeTab === 'general' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Platform Name</label>
                    <input type="text" defaultValue="SportsHub Elite" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
                    <input type="email" defaultValue="support@sportshub.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Platform Fee Percentage (%)</label>
                    <input type="number" defaultValue="5" className="w-full md:w-1/3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" />
                    <p className="text-xs text-slate-500 mt-2">The default cut taken from all tournament registrations.</p>
                  </div>
                </>
              )}

              {activeTab === 'payments' && (
                <>
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800">Stripe Integration</h3>
                      <p className="text-sm text-slate-500">Live Mode Active</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">Connected</span>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Stripe Publishable Key</label>
                    <input type="password" defaultValue="pk_live_xxxxxxxxxxxxxxxxxxx" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Stripe Secret Key</label>
                    <input type="password" defaultValue="sk_live_xxxxxxxxxxxxxxxxxxx" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" />
                  </div>
                </>
              )}

              {/* Add dummy blocks for other tabs if selected */}
              {(activeTab === 'security' || activeTab === 'notifications') && (
                <div className="py-4 md:py-6 md:py-12 text-center">
                  <Settings size={48} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Settings available in premium tier</h3>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="px-4 md:px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isSaving ? <CheckCircle size={18} /> : <Save size={18} />}
                {isSaving ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  );
};

export default PlatformSettings;

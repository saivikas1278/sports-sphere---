import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Shield, Bell, Save, CheckCircle, Loader2 } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import api from '../../services/api';
import { showToast } from '../../utils/toast';

const PlatformSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    platformName: 'SportSphere',
    supportEmail: 'support@sportsphere.com',
    platformFeePercentage: 5,
    stripeEnabled: true,
    razorpayEnabled: false,
    testMode: true,
    allowUserRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    emailNotifications: true,
    socketNotifications: true,
    adminAlerts: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data?.data) {
          setFormData(prev => ({
            ...prev,
            ...res.data.data
          }));
        }
      } catch (err) {
        console.error('Failed to load platform settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/settings', formData);
      if (res.data?.success) {
        showToast('Platform settings saved successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast(err.response?.data?.error || 'Failed to save platform settings', 'error');
    } finally {
      setIsSaving(false);
    }
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
          {loading ? (
            <div className="p-16 flex justify-center items-center bg-white rounded-3xl border border-slate-200">
              <Loader2 className="animate-spin text-blue-500" size={36} />
            </div>
          ) : (
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
                      <input 
                        type="text" 
                        name="platformName"
                        value={formData.platformName} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
                      <input 
                        type="email" 
                        name="supportEmail"
                        value={formData.supportEmail} 
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Platform Fee Percentage (%)</label>
                      <input 
                        type="number" 
                        name="platformFeePercentage"
                        value={formData.platformFeePercentage} 
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className="w-full md:w-1/3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none font-medium text-slate-700" 
                      />
                      <p className="text-xs text-slate-500 mt-2">The default cut taken from all tournament registrations.</p>
                    </div>
                  </>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Stripe Payments</h3>
                        <p className="text-sm text-slate-500">Credit card and international processing</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="stripeEnabled"
                          checked={formData.stripeEnabled} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Razorpay Integration</h3>
                        <p className="text-sm text-slate-500">UPI, NetBanking, and localized Indian gateways</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="razorpayEnabled"
                          checked={formData.razorpayEnabled} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Sandbox / Test Mode</h3>
                        <p className="text-sm text-slate-500">Process test payments with dummy credentials</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="testMode"
                          checked={formData.testMode} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Public User Registration</h3>
                        <p className="text-sm text-slate-500">Allow new athletes and organizers to sign up</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="allowUserRegistration"
                          checked={formData.allowUserRegistration} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Maintenance Mode</h3>
                        <p className="text-sm text-slate-500">Restrict access to administrators only</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="maintenanceMode"
                          checked={formData.maintenanceMode} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Email Notifications</h3>
                        <p className="text-sm text-slate-500">Dispatch tournament registration and reset emails</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="emailNotifications"
                          checked={formData.emailNotifications} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Real-Time Socket Events</h3>
                        <p className="text-sm text-slate-500">Broadcast live score and bracket advancement updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="socketNotifications"
                          checked={formData.socketNotifications} 
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
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
          )}
        </div>

      </div>
    </div>
  );
};

export default PlatformSettings;

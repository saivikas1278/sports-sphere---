import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Key, 
  Smartphone, 
  Globe, 
  CreditCard,
  LogOut,
  ChevronRight,
  Monitor,
  Camera
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, uploadAvatar, updateProfile } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import profileService from '../../services/profileService';
import { showToast } from '../../utils/toast';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('account');
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || ''
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const res = await profileService.getProfile(user._id || user.id);
          if (res.success && res.data?.preferences?.notifications) {
            setNotifications({
              email: res.data.preferences.notifications.email ?? true,
              push: res.data.preferences.notifications.push ?? true,
              sms: res.data.preferences.notifications.sms ?? false
            });
          }
        } catch (error) {
          console.error("Failed to load profile preferences", error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    dispatch(updateProfile(profileForm));
  };

  const toggleNotification = async (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    
    // Optimistic update
    setNotifications(newNotifications);
    
    try {
      await profileService.updateProfile({
        preferences: {
          notifications: newNotifications
        }
      });
      showToast('Preferences updated', 'success');
    } catch (error) {
      // Revert on failure
      setNotifications(notifications);
      showToast('Failed to update preferences', 'error');
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      
      {/* Header */}
      <div className="mb-4 md:mb-8 p-4 md:p-8 md:p-10 rounded-[40px] glass-panel bg-white/40 border border-white/60">
        <h1 className="text-xl md:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-600 font-medium mt-2">Manage your account preferences and configurations</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        
        {/* Sidebar */}
        <div className="md:w-1/3 lg:w-1/4 shrink-0">
          <div className="p-4 rounded-[32px] glass-panel bg-white/40 sticky top-24">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${
                      isActive 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-blue-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`mr-3 ${isActive ? 'text-white' : ''}`} size={20} />
                      {tab.label}
                    </div>
                    {isActive && <ChevronRight size={18} />}
                  </button>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-slate-200/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center p-4 rounded-2xl transition-all font-bold text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="mr-3" size={20} />
                  Log Out
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="p-4 md:p-8 md:p-10 rounded-[32px] glass-panel bg-white/60 min-h-[500px]">
            
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-6 border-b border-white pb-6 gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center shadow-md overflow-hidden border-4 border-white">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm"
                    >
                      <Camera size={24} className="text-white mb-1" />
                      <span className="text-white text-xs font-bold">Change</span>
                      <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            dispatch(uploadAvatar(e.target.files[0]));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Account Details</h2>
                    <p className="text-slate-500 font-medium text-sm">Update your personal information and profile picture</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input type="email" className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all" defaultValue={user?.email || ''} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                    <input 
                      type="text" 
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileChange}
                      className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all" 
                    />
                  </div>
                  
                  <div className="pt-6">
                    <button 
                      onClick={handleSaveProfile}
                      className="px-4 md:px-8 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center mb-4 md:mb-6 border-b border-white pb-6">
                  <div className="w-12 h-12 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Notifications</h2>
                    <p className="text-slate-500 font-medium text-sm">Choose what you want to be notified about</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { key: 'email', title: 'Email Notifications', desc: 'Receive summary emails and important alerts' },
                    { key: 'push', title: 'Push Notifications', desc: 'Receive real-time alerts on your device (browser)' },
                    { key: 'sms', title: 'SMS Alerts', desc: 'Get text messages for critical match updates' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-5 bg-white/40 rounded-2xl border border-white hover:bg-white/60 transition-colors">
                      <div>
                        <h3 className="font-extrabold text-slate-800">{item.title}</h3>
                        <p className="text-sm font-medium text-slate-500">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => toggleNotification(item.key)}
                        className={`w-12 h-6 rounded-full transition-colors relative shadow-inner ${notifications[item.key] ? 'bg-blue-500' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications[item.key] ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center mb-4 md:mb-6 border-b border-white pb-6">
                  <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Security</h2>
                    <p className="text-slate-500 font-medium text-sm">Keep your account secure</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-4 md:p-6 bg-white/40 rounded-2xl md:rounded-3xl border border-white">
                    <h3 className="font-extrabold text-slate-800 mb-4 flex items-center">
                      <Key className="mr-2 text-slate-500" size={18} />
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      <input type="password" placeholder="Current Password" className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all" />
                      <input type="password" placeholder="New Password" className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all" />
                      <input type="password" placeholder="Confirm New Password" className="w-full bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all" />
                      <button className="px-4 md:px-6 py-2.5 bg-purple-500 text-white font-bold rounded-full shadow-sm hover:bg-purple-600 hover:-translate-y-0.5 transition-all mt-2">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 bg-white/40 rounded-2xl md:rounded-3xl border border-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 mb-1 flex items-center">
                          <Smartphone className="mr-2 text-slate-500" size={18} />
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm font-medium text-slate-500">Add an extra layer of security to your account.</p>
                      </div>
                      <button className="px-4 md:px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-full border border-slate-200 hover:bg-slate-200 transition-all shrink-0">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {['appearance', 'billing'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Globe className="text-slate-300 mb-4" size={64} />
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Coming Soon</h2>
                <p className="text-slate-500 font-medium">This section is currently under development.</p>
              </div>
            )}

          </div>
        </div>
      </div>
      
      <div className="h-12 md:h-20" />
    </div>
  );
};

export default SettingsPage;

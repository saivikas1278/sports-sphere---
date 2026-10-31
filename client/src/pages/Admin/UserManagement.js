import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  CheckCircle,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import userService from '../../services/userService';
import { showToast } from '../../utils/toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async (query = '') => {
    try {
      setLoading(true);
      const res = query 
        ? await userService.searchUsers(query)
        : await userService.getUsers({ limit: 50 });
      
      const userList = res.data?.data || res.data || [];
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('Failed to load users from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleRoleToggle = async (user) => {
    const nextRoleMap = {
      player: 'organizer',
      organizer: 'admin',
      admin: 'player'
    };
    const nextRole = nextRoleMap[user.role] || 'player';

    try {
      await userService.updateUserRole(user._id || user.id, nextRole);
      showToast(`Updated role for ${user.firstName || user.name} to ${nextRole}`, 'success');
      setUsers(prev => prev.map(u => (u._id === user._id ? { ...u, role: nextRole } : u)));
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter === 'all') return true;
    return u.role === roleFilter;
  });

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">User Management</h1>
            <p className="text-slate-500 font-medium mt-1">Manage players, organizers, and platform access.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="pl-10 pr-4 py-2 bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="player">Players</option>
              <option value="organizer">Organizers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-panel rounded-2xl md:rounded-3xl overflow-hidden border border-white/60">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                No users found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/60">
                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Verification</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {filteredUsers.map((user) => {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User';
                    const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active';
                    return (
                      <tr key={user._id || user.id} className="hover:bg-white/40 transition-colors">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt={fullName} className="h-10 w-10 rounded-full object-cover mr-3" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                <UserIcon size={20} />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-bold text-slate-800">{fullName}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                              user.role === 'organizer' ? 'bg-amber-100 text-amber-800' : 
                              'bg-blue-100 text-blue-800'}`}
                          >
                            {user.role || 'player'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${user.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}
                          >
                            {user.isVerified ? <CheckCircle size={12} /> : null}
                            {user.isVerified ? 'Verified' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {joinedDate}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleRoleToggle(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                            title="Cycle Role: Player -> Organizer -> Admin"
                          >
                            <Shield size={14} className="text-blue-500" /> Cycle Role
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

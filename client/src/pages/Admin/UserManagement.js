import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle,
  User
} from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'player', status: 'active', date: '2023-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'organizer', status: 'verified', date: '2023-02-20' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'player', status: 'blocked', date: '2023-03-10' },
    { id: 4, name: 'Admin User', email: 'admin@sportsphere.com', role: 'admin', status: 'active', date: '2022-11-05' },
  ];

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
                placeholder="Search users..." 
                className="pl-10 pr-4 py-2 bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 bg-white/70 border border-slate-200 rounded-xl text-slate-600 hover:bg-white hover:text-blue-600 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-panel rounded-2xl md:rounded-3xl overflow-hidden border border-white/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60">
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{user.name}</div>
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
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 
                          user.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                          'bg-slate-100 text-slate-800'}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.date}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-emerald-600 transition-colors" title="Verify User">
                          <CheckCircle size={18} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Block User">
                          <Ban size={18} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Change Role">
                          <Shield size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

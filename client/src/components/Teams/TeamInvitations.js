import React, { useState, useEffect } from 'react';
import { Users, Check, X, Loader2 } from 'lucide-react';
import teamService from '../../services/teamService';
import { showToast } from '../../utils/toast';
import { Link } from 'react-router-dom';

const TeamInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await teamService.getInvitations();
      if (response.success) {
        setInvitations(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching team invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (teamId, inviteId, status) => {
    try {
      if (status === 'accepted') {
        await teamService.acceptInvitation(teamId, inviteId);
        showToast('Successfully joined the team!', 'success');
      } else {
        await teamService.rejectInvitation(teamId, inviteId);
        showToast('Invitation declined.', 'info');
      }
      fetchInvitations();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to respond to invitation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Hide the widget if no invitations
  }

  return (
    <div className="p-4 md:p-6 rounded-[32px] glass-panel bg-white/40 mb-6">
      <h3 className="text-lg font-extrabold text-slate-800 mb-4 tracking-tight flex items-center">
        <Users className="mr-2 text-blue-500" size={20} />
        Team Invitations ({invitations.length})
      </h3>
      <div className="space-y-3">
        {invitations.map((invite) => (
          <div key={invite._id} className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/teams/${invite.team._id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors">
                  {invite.team.name}
                </Link>
                <div className="text-xs font-medium text-slate-500 mt-1 capitalize">Role: {invite.role}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRespond(invite.team._id, invite._id, 'declined')}
                  className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                  title="Decline"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={() => handleRespond(invite.team._id, invite._id, 'accepted')}
                  className="p-1.5 bg-green-50 text-green-500 hover:bg-green-500 hover:text-white rounded-full transition-colors"
                  title="Accept"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamInvitations;

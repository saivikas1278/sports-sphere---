import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Send, 
  Megaphone, 
  MessageSquare, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Users, 
  History,
  ShieldAlert
} from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import api from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';

const CommunicationCenter = () => {
  const { id } = useParams();
  const [messageType, setMessageType] = useState('broadcast'); // broadcast, direct

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('high');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Tournament and history data
  const [tournament, setTournament] = useState(null);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch tournament info and broadcast history
  useEffect(() => {
    let isMounted = true;
    setLoadingHistory(true);

    // 1. Fetch tournament metadata
    api.get(`/tournaments/${id}`)
      .then((res) => {
        if (isMounted && res.data) {
          setTournament(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load tournament metadata:', err);
      });

    // 2. Fetch sent broadcast history
    api.get(`/tournaments/${id}/broadcasts`)
      .then((res) => {
        if (isMounted) {
          setBroadcastHistory(res.data || []);
          setLoadingHistory(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Could not load broadcast history:', err);
          setLoadingHistory(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const validateForm = () => {
    const errors = {};
    if (!message.trim()) {
      errors.message = 'Broadcast message content is required.';
    } else if (message.trim().length < 5) {
      errors.message = 'Message must be at least 5 characters long.';
    }

    if (messageType === 'direct' && !selectedTeamId) {
      errors.team = 'Please select a recipient team.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (messageType === 'broadcast') {
        const payload = {
          title: title.trim() || undefined,
          message: message.trim(),
          priority
        };

        const res = await api.post(`/tournaments/${id}/broadcast`, payload);

        if (res.success) {
          showSuccess(res.message || 'Broadcast announcement delivered successfully!');
          setSuccessInfo({
            message: res.message || 'Broadcast announcement delivered successfully!',
            count: res.data?.recipientsCount || 0
          });

          // Prepend to history
          const newHistoryItem = {
            _id: res.data?._id || Date.now(),
            text: res.data?.text || message.trim(),
            sender: { firstName: 'You (Organizer)', lastName: '' },
            createdAt: res.data?.createdAt || new Date().toISOString(),
            isAnnouncement: true
          };
          setBroadcastHistory((prev) => [newHistoryItem, ...prev]);

          // Clear form
          setTitle('');
          setMessage('');
          setFormErrors({});
        }
      } else {
        // Direct message to team room
        const payload = {
          text: `[Direct Announcement]: ${message.trim()}`
        };

        const res = await api.post(`/chat/team/${selectedTeamId}`, payload);

        if (res.data) {
          showSuccess('Direct message sent to team chat successfully!');
          setSuccessInfo({
            message: 'Direct message sent to team chat successfully!',
            count: 1
          });
          setMessage('');
          setFormErrors({});
        }
      }
    } catch (err) {
      console.error('Broadcast submission error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to deliver message. Please verify permissions or rate limit.';

      setError(errMsg);
      showError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamsList = (tournament?.registeredTeams || [])
    .filter((rt) => rt && rt.team)
    .map((rt) => (typeof rt.team === 'object' ? rt.team : { _id: rt.team, name: 'Team' }));

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link
          to={`/tournaments/${id}/dashboard`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" /> Back to Dashboard
        </Link>

        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                <Megaphone className="text-blue-500" size={32} /> Communication Center
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {tournament?.name
                  ? `Broadcast announcements and direct messages for ${tournament.name}`
                  : 'Broadcast real-time announcements to team captains or message teams.'}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
              <Clock size={14} /> Rate Limit: Max 10/hour
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successInfo && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-bold">{successInfo.message}</p>
              {successInfo.count > 0 && (
                <p className="text-xs text-emerald-700 mt-0.5">
                  Delivered real-time push notification and socket alerts to {successInfo.count} team captains.
                </p>
              )}
            </div>
            <button
              onClick={() => setSuccessInfo(null)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-bold">Broadcast Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/60 bg-white shadow-sm mb-8">
          {/* Message Type Selector */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                messageType === 'broadcast'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                setMessageType('broadcast');
                setFormErrors({});
                setError(null);
              }}
            >
              <Megaphone size={20} /> Broadcast Announcement
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                messageType === 'direct'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                setMessageType('direct');
                setFormErrors({});
                setError(null);
              }}
            >
              <MessageSquare size={20} /> Direct Message
            </button>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleBroadcastSubmit}>
            {messageType === 'broadcast' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Announcement Title <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Schedule Update / Rain Delay Notice"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-700">
                  <Users size={16} className="flex-shrink-0" />
                  <span>
                    This broadcast creates an in-app notification for every team captain of approved & pending teams, and pushes live WebSockets.
                  </span>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Team</label>
                <select
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium ${
                    formErrors.team ? 'border-rose-400' : 'border-slate-200'
                  }`}
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                >
                  <option value="">Choose registered team...</option>
                  {teamsList.map((tm) => (
                    <option key={tm._id} value={tm._id}>
                      {tm.name || 'Team'}
                    </option>
                  ))}
                </select>
                {formErrors.team && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.team}</p>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">{message.length} characters</span>
              </div>
              <textarea
                rows="5"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none text-sm text-slate-800 leading-relaxed ${
                  formErrors.message ? 'border-rose-400 ring-1 ring-rose-100' : 'border-slate-200'
                }`}
                placeholder={
                  messageType === 'broadcast'
                    ? 'Write your announcement to all team captains (e.g. Venue changes, reporting time, equipment guidelines)...'
                    : 'Write your direct message to this team...'
                }
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (formErrors.message) setFormErrors({ ...formErrors, message: null });
                }}
              ></textarea>
              {formErrors.message && (
                <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldAlert size={14} /> Only tournament owners or admins can broadcast.
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-6 md:px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sent Broadcast History Section */}
        <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/60 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History size={20} className="text-blue-500" /> Sent Broadcast History
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              {broadcastHistory.length} Announcements
            </span>
          </div>

          {loadingHistory ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">Loading sent broadcasts...</p>
            </div>
          ) : broadcastHistory.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-400" />
              <p className="text-sm font-semibold text-slate-600">No broadcasts sent yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Announcements sent from this dashboard will appear here with delivery timestamps.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {broadcastHistory.map((item) => {
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  : 'Recent';

                const senderName = item.sender
                  ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim() || 'Organizer'
                  : 'Organizer';

                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-700">
                          Broadcast
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{senderName}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{dateStr}</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;

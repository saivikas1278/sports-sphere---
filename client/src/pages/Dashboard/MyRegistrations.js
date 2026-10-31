import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Shield,
  ArrowRight
} from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import api from '../../services/api';

const MyRegistrations = () => {
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, ongoing, completed, rejected
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/tournaments/my?type=registrations');
      const list = res.data?.data || res.data || [];
      setRegistrations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load tournament registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const getRegistrationCategory = (tourn) => {
    const regStatus = (tourn.registrationStatus || tourn.myRegistration?.status || '').toLowerCase();
    if (regStatus === 'rejected') {
      return 'rejected';
    }

    const status = (tourn.status || '').toLowerCase();
    const now = new Date();
    const start = tourn.dates?.tournamentStart || tourn.startDate;
    const end = tourn.dates?.tournamentEnd || tourn.endDate;
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    if (status === 'completed' || (endDate && !isNaN(endDate.getTime()) && endDate < now)) {
      return 'completed';
    }
    if (status === 'ongoing' || (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= now && endDate >= now)) {
      return 'ongoing';
    }
    return 'upcoming';
  };

  const counts = {
    upcoming: registrations.filter(r => getRegistrationCategory(r) === 'upcoming').length,
    ongoing: registrations.filter(r => getRegistrationCategory(r) === 'ongoing').length,
    completed: registrations.filter(r => getRegistrationCategory(r) === 'completed').length,
    rejected: registrations.filter(r => getRegistrationCategory(r) === 'rejected').length
  };

  const displayedRegistrations = registrations.filter(r => getRegistrationCategory(r) === activeTab);

  const formatDateRange = (tourn) => {
    const start = tourn.dates?.tournamentStart || tourn.startDate;
    const end = tourn.dates?.tournamentEnd || tourn.endDate;
    if (!start && !end) return 'Dates TBA';

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    try {
      if (start && end) {
        const sDate = new Date(start);
        const eDate = new Date(end);
        if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
          const sStr = sDate.toLocaleDateString(undefined, options);
          const eStr = eDate.toLocaleDateString(undefined, options);
          return sStr === eStr ? sStr : `${sStr} - ${eStr}`;
        }
      }
      const single = new Date(start || end);
      return !isNaN(single.getTime()) ? single.toLocaleDateString(undefined, options) : 'Dates TBA';
    } catch {
      return 'Dates TBA';
    }
  };

  const formatLocation = (tourn) => {
    if (tourn.venue?.name && tourn.venue?.city) {
      return `${tourn.venue.name}, ${tourn.venue.city}`;
    }
    if (tourn.venue?.name) return tourn.venue.name;
    if (tourn.location?.venue && tourn.location?.city) {
      return `${tourn.location.venue}, ${tourn.location.city}`;
    }
    if (tourn.location?.venue) return tourn.location.venue;
    if (tourn.venue?.city) return tourn.venue.city;
    if (tourn.location?.city) return tourn.location.city;
    return 'Venue TBA';
  };

  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle size={14} /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={14} /> Pending Approval
          </span>
        );
    }
  };

  const getStatusIconBox = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (s === 'rejected') return 'bg-rose-50 text-rose-600 border border-rose-100';
    return 'bg-amber-50 text-amber-600 border border-amber-100';
  };

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">My Registrations</h1>
            <p className="text-slate-500 font-medium mt-1">
              Track your tournament entries, team registration statuses, and upcoming schedules.
            </p>
          </div>
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs: Upcoming, Ongoing, Completed, Rejected */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 md:mb-8 border-b border-slate-200/60 pb-4">
          <button
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm sm:text-base transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span>Upcoming</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'upcoming' ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.upcoming}
            </span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm sm:text-base transition-all ${
              activeTab === 'ongoing'
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('ongoing')}
          >
            <span>Ongoing</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'ongoing' ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.ongoing}
            </span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm sm:text-base transition-all ${
              activeTab === 'completed'
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            <span>Completed</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'completed' ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.completed}
            </span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm sm:text-base transition-all ${
              activeTab === 'rejected'
                ? 'bg-rose-50 text-rose-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('rejected')}
          >
            <span>Rejected</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'rejected' ? 'bg-rose-200/70 text-rose-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-panel p-6 rounded-3xl border border-white/60 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                  <div className="w-24 h-6 bg-slate-200 rounded-full" />
                </div>
                <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                </div>
                <div className="h-11 bg-slate-200 rounded-2xl w-full pt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-rose-200 bg-rose-50/50 text-center max-w-xl mx-auto my-6">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load registrations</h3>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <button
              onClick={fetchRegistrations}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* Registration Cards Grid */}
        {!loading && !error && displayedRegistrations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayedRegistrations.map(tourn => {
              const regStatus = tourn.registrationStatus || tourn.myRegistration?.status || 'pending';
              const teamName = tourn.registeredTeam?.name || tourn.myRegistration?.team?.name || 'Registered Team';
              const roleDisplay = tourn.myRole || `Team: ${teamName}`;

              return (
                <div
                  key={tourn._id}
                  className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/60 hover:-translate-y-1 transition-all group flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div>
                    {/* Header: Icon & Status Badge */}
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div className={`p-3 rounded-2xl ${getStatusIconBox(regStatus)}`}>
                        {regStatus === 'approved' ? (
                          <CheckCircle size={24} />
                        ) : regStatus === 'rejected' ? (
                          <XCircle size={24} />
                        ) : (
                          <Clock size={24} />
                        )}
                      </div>
                      {renderStatusBadge(regStatus)}
                    </div>

                    {/* Tournament Title & Sport Tag */}
                    <div className="mb-3">
                      <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md mb-2">
                        {tourn.sport || 'Sports'}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {tourn.name}
                      </h3>
                    </div>

                    {/* Registration Details */}
                    <div className="space-y-2.5 mb-6 text-sm font-medium text-slate-500">
                      <p className="flex items-center gap-2 text-slate-700">
                        <Shield size={16} className="text-blue-500 shrink-0" />
                        <span className="font-semibold truncate">{roleDisplay}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate">{formatDateRange(tourn)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400 shrink-0" />
                        <span className="truncate">{formatLocation(tourn)}</span>
                      </p>
                      {tourn.registeredTeams?.length > 0 && (
                        <p className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                          <Users size={14} className="shrink-0" />
                          <span>{tourn.registeredTeams.length} teams registered</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    to={`/tournaments/${tourn._id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-2xl font-bold text-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                  >
                    <span>View Tournament</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedRegistrations.length === 0 && (
          <div className="col-span-full text-center py-10 md:py-16 glass-panel rounded-2xl md:rounded-3xl border border-white/60 max-w-2xl mx-auto px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 capitalize">
              No {activeTab} registrations
            </h3>
            <p className="text-slate-500 mt-2 mb-6 max-w-md mx-auto text-sm sm:text-base">
              {activeTab === 'rejected'
                ? 'None of your tournament registration requests have been rejected.'
                : activeTab === 'completed'
                ? "You don't have any completed tournament records yet."
                : activeTab === 'ongoing'
                ? 'You do not have any tournaments currently active in progress.'
                : "You haven't registered for any upcoming tournaments yet."}
            </p>
            <Link
              to="/tournaments"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <span>Browse Tournaments</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRegistrations;

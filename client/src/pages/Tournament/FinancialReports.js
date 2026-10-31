import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTournamentById } from '../../redux/slices/tournamentSlice';
import { DollarSign, TrendingUp, Download, ArrowLeft, CreditCard, Users, Trophy } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const FinancialReports = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentTournament, loading } = useSelector((state) => state.tournaments);

  useEffect(() => {
    if (id) {
      dispatch(fetchTournamentById(id));
    }
  }, [dispatch, id]);

  const regFee = currentTournament?.registrationFee || 0;
  const registeredTeams = currentTournament?.registeredTeams || [];
  const approvedTeams = registeredTeams.filter(t => t.status === 'approved');
  const totalCollected = approvedTeams.length * regFee;
  const prizePoolTotal = currentTournament?.prizePool?.total || 0;
  const sponsorsCount = currentTournament?.sponsors?.length || 0;
  const sponsorRevenue = sponsorsCount * 500;
  const totalRevenue = totalCollected + sponsorRevenue;

  const metrics = [
    { 
      label: 'Total Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      trend: '+100%', 
      icon: DollarSign, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Entry Fees', 
      value: `$${totalCollected.toLocaleString()}`, 
      desc: `${approvedTeams.length} approved teams @ $${regFee}`, 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Sponsorships', 
      value: `$${sponsorRevenue.toLocaleString()}`, 
      desc: `${sponsorsCount} Active Sponsors`, 
      icon: TrendingUp, 
      color: 'text-purple-500', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Prize Pool', 
      value: `$${prizePoolTotal.toLocaleString()}`, 
      desc: 'Committed prize awards', 
      icon: Trophy, 
      color: 'text-amber-500', 
      bg: 'bg-amber-50' 
    }
  ];

  const transactions = registeredTeams.map((rt, idx) => {
    const teamObj = typeof rt.team === 'object' ? rt.team : {};
    return {
      id: `TXN-${String(idx + 1).padStart(3, '0')}`,
      team: teamObj.name || 'Team Registration',
      date: new Date(rt.registeredAt || Date.now()).toLocaleDateString(),
      status: rt.status === 'approved' ? 'completed' : rt.status || 'pending',
      amount: regFee
    };
  });

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Team', 'Date', 'Status', 'Amount'];
    const rows = transactions.map(t => [t.id, `"${t.team}"`, t.date, t.status, t.amount]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !currentTournament) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden bg-slate-50/50">
      <FloatingElements />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/tournaments/${id}/dashboard`} className="p-2 bg-white rounded-full text-slate-500 hover:text-blue-600 shadow-sm transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                <DollarSign className="text-emerald-500" />
                Financial Reports
              </h1>
              <p className="text-slate-500 font-medium mt-1">Track revenue, expenses, and payouts.</p>
            </div>
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-8">
          {metrics.map((metric, i) => (
            <div key={i} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/60 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${metric.bg} ${metric.color}`}>
                  <metric.icon size={24} />
                </div>
                {metric.trend && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {metric.trend}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-500 mb-1">{metric.label}</h3>
              <p className="text-xl md:text-3xl font-black text-slate-800">{metric.value}</p>
              {metric.desc && <p className="text-xs text-slate-400 font-medium mt-2">{metric.desc}</p>}
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="text-slate-400" size={20} /> Recent Transactions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-sm font-bold text-slate-500">
                  <th className="p-4 pl-6">Transaction ID</th>
                  <th className="p-4">Sender/Team</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-500 text-sm">{txn.id}</td>
                    <td className="p-4 font-bold text-slate-800">{txn.team}</td>
                    <td className="p-4 text-slate-500 text-sm">{txn.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${txn.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right font-black text-slate-800">${txn.amount}</td>
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

export default FinancialReports;

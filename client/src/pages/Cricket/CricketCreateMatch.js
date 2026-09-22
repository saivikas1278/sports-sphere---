import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, MapPin, Plus, Minus, CheckCircle2, Swords } from 'lucide-react';
import { showToast } from '../../utils/toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const CricketCreateMatch = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    matchTitle: '',
    matchType: 'T20',
    overs: 20,
    venue: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    team1: '',
    team2: '',
    team1Players: Array(11).fill({ name: '', role: 'Batsman' }),
    team2Players: Array(11).fill({ name: '', role: 'Batsman' }),
    customTeam1Name: '',
    customTeam2Name: '',
    useCustomTeams: false
  });

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setTeams([
          { id: '1', name: 'Super Kings' },
          { id: '2', name: 'Royal Challengers' },
          { id: '3', name: 'Mumbai Indians' },
          { id: '4', name: 'Delhi Capitals' }
        ]);
        setIsLoading(false);
      } catch (error) {
        showToast('Failed to load teams', 'error');
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handlePlayerChange = (teamKey, index, field, value) => {
    setFormData(prev => {
      const updated = [...prev[teamKey]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [teamKey]: updated };
    });
  };

  const addPlayer = (teamKey) => {
    setFormData(prev => ({
      ...prev,
      [teamKey]: [...prev[teamKey], { name: '', role: 'Batsman' }]
    }));
  };

  const removePlayer = (teamKey, index) => {
    if (formData[teamKey].length <= 11) {
      showToast('A team must have at least 11 players', 'warning');
      return;
    }
    setFormData(prev => {
      const updated = [...prev[teamKey]];
      updated.splice(index, 1);
      return { ...prev, [teamKey]: updated };
    });
  };

  const validateForm = () => {
    if (!formData.matchTitle) { showToast('Match title is required', 'error'); return false; }
    if (!formData.venue) { showToast('Venue is required', 'error'); return false; }
    
    if (formData.useCustomTeams) {
      if (!formData.customTeam1Name || !formData.customTeam2Name) {
        showToast('Both team names are required', 'error'); return false;
      }
      if (formData.team1Players.some(p => !p.name) || formData.team2Players.some(p => !p.name)) {
        showToast('All players must have names', 'error'); return false;
      }
    } else {
      if (!formData.team1 || !formData.team2) { showToast('Please select both teams', 'error'); return false; }
      if (formData.team1 === formData.team2) { showToast('Please select different teams', 'error'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('Match created successfully!', 'success');
      navigate('/cricket');
    } catch (error) {
      showToast('Failed to create match', 'error');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-transparent"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-5xl animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center mb-4 md:mb-8">
        <button 
          onClick={() => navigate('/cricket')}
          className="w-10 h-10 rounded-full bg-white/60 border border-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-white transition-colors shadow-sm mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Trophy className="text-blue-500" size={32} />
            Create Match
          </h1>
          <p className="text-slate-500 font-medium">Set up a new cricket fixture</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Match Details */}
        <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
          <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <Trophy className="text-indigo-500" size={20} /> Match Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Match Title*</label>
              <input
                type="text"
                name="matchTitle"
                value={formData.matchTitle}
                onChange={handleInputChange}
                placeholder="e.g. Final Showdown"
                className="w-full px-5 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Venue*</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="Stadium Name"
                  className="w-full pl-12 pr-5 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Match Type</label>
              <select
                name="matchType"
                value={formData.matchType}
                onChange={handleInputChange}
                className="w-full px-5 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700 shadow-sm appearance-none"
              >
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Overs per Innings</label>
              <input
                type="number"
                name="overs"
                value={formData.overs}
                onChange={handleInputChange}
                min="1" max="50"
                className="w-full px-5 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date & Time</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-2/3 px-4 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700 shadow-sm"
                />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-1/3 px-4 py-3 bg-white/80 border border-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-700 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Teams Setup */}
        <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 border-b border-white/50 pb-4">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Swords className="text-amber-500" size={20} /> Teams Setup
            </h2>
            
            <label className="flex items-center cursor-pointer bg-white/60 px-4 py-2 rounded-xl border border-white shadow-sm hover:bg-white transition-colors">
              <div className="relative">
                <input 
                  type="checkbox" 
                  name="useCustomTeams"
                  checked={formData.useCustomTeams} 
                  onChange={handleCheckboxChange} 
                  className="sr-only" 
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.useCustomTeams ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.useCustomTeams ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div className="ml-3 font-bold text-sm text-slate-700">Custom Squads</div>
            </label>
          </div>

          {!formData.useCustomTeams ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative">
              <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center font-black text-slate-400 italic">VS</div>
              </div>
              
              <div className="p-4 md:p-6 bg-white/60 rounded-2xl border border-white shadow-sm">
                <label className="block text-sm font-extrabold text-blue-600 uppercase tracking-widest mb-3">Home Team</label>
                <select
                  name="team1"
                  value={formData.team1}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-slate-800 shadow-sm appearance-none text-lg"
                >
                  <option value="">Select Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              
              <div className="p-4 md:p-6 bg-white/60 rounded-2xl border border-white shadow-sm">
                <label className="block text-sm font-extrabold text-rose-600 uppercase tracking-widest mb-3">Away Team</label>
                <select
                  name="team2"
                  value={formData.team2}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-bold text-slate-800 shadow-sm appearance-none text-lg"
                >
                  <option value="">Select Team</option>
                  {teams.map(t => <option key={t.id} value={t.id} disabled={t.id === formData.team1}>{t.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              {/* Custom Team 1 */}
              <div className="p-4 md:p-6 bg-white/60 rounded-2xl border border-white shadow-sm">
                <input
                  type="text"
                  name="customTeam1Name"
                  value={formData.customTeam1Name}
                  onChange={handleInputChange}
                  placeholder="Team 1 Name"
                  className="w-full px-5 py-3 mb-4 md:mb-6 bg-blue-50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-black text-blue-900 text-lg placeholder:text-blue-300"
                />
                
                <div className="space-y-3">
                  {formData.team1Players.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-slate-100">
                      <span className="w-6 text-center font-bold text-slate-400 text-sm">{idx+1}.</span>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerChange('team1Players', idx, 'name', e.target.value)}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 bg-transparent focus:outline-none font-bold text-slate-700 text-sm"
                      />
                      <select
                        value={player.role}
                        onChange={(e) => handlePlayerChange('team1Players', idx, 'role', e.target.value)}
                        className="w-28 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-bold text-slate-600 text-xs appearance-none"
                      >
                        <option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>WK</option>
                      </select>
                      <button type="button" onClick={() => removePlayer('team1Players', idx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <Minus size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addPlayer('team1Players')} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm flex items-center justify-center">
                    <Plus size={16} className="mr-1" /> Add Player
                  </button>
                </div>
              </div>

              {/* Custom Team 2 */}
              <div className="p-4 md:p-6 bg-white/60 rounded-2xl border border-white shadow-sm">
                <input
                  type="text"
                  name="customTeam2Name"
                  value={formData.customTeam2Name}
                  onChange={handleInputChange}
                  placeholder="Team 2 Name"
                  className="w-full px-5 py-3 mb-4 md:mb-6 bg-rose-50 border border-rose-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-black text-rose-900 text-lg placeholder:text-rose-300"
                />
                
                <div className="space-y-3">
                  {formData.team2Players.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-slate-100">
                      <span className="w-6 text-center font-bold text-slate-400 text-sm">{idx+1}.</span>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerChange('team2Players', idx, 'name', e.target.value)}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 bg-transparent focus:outline-none font-bold text-slate-700 text-sm"
                      />
                      <select
                        value={player.role}
                        onChange={(e) => handlePlayerChange('team2Players', idx, 'role', e.target.value)}
                        className="w-28 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-bold text-slate-600 text-xs appearance-none"
                      >
                        <option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>WK</option>
                      </select>
                      <button type="button" onClick={() => removePlayer('team2Players', idx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <Minus size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addPlayer('team2Players')} className="w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm flex items-center justify-center">
                    <Plus size={16} className="mr-1" /> Add Player
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pb-6 md:pb-12">
          <button
            type="button"
            onClick={() => navigate('/cricket')}
            className="px-4 md:px-8 py-4 bg-white/80 text-slate-600 font-bold rounded-2xl hover:bg-white border border-white shadow-sm transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 md:px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><LoadingSpinner size="sm" className="mr-2 border-white border-t-transparent" /> Creating...</>
            ) : (
              <><CheckCircle2 size={20} className="mr-2" /> Start Match</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CricketCreateMatch;

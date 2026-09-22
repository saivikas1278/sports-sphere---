import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Info, 
  Trophy, 
  ChevronLeft,
  Loader2,
  Camera
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import teamService from '../../services/teamService';

const SPORTS = [
  'Basketball', 'Soccer', 'Cricket', 'Tennis', 'Badminton', 'Volleyball', 'Kabaddi', 'Other'
];

const SKILL_LEVELS = [
  'Beginner', 'Intermediate', 'Advanced', 'Professional'
];

const TEAM_TYPES = [
  'Competitive', 'Recreational', 'Corporate', 'School/University'
];

const TeamCreatePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sport: 'Basketball',
    location: '',
    description: '',
    skillLevel: 'Intermediate',
    type: 'Competitive'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo size must be less than 2MB', 'error');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.sport || !formData.location.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const teamData = {
        name: formData.name,
        sport: formData.sport,
        location: formData.location,
        description: formData.description,
        skillLevel: formData.skillLevel,
        type: formData.type
      };

      if (logoFile) {
        teamData.logo = logoFile;
      }

      const response = await teamService.createTeam(teamData);
      
      if (response.success) {
        showToast('Team created successfully!', 'success');
        navigate(`/teams/${response.data._id}`);
      } else {
        showToast('Failed to create team', 'error');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      showToast(error.response?.data?.message || 'Failed to create team. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <Link to="/teams" className="inline-flex items-center text-slate-500 hover:text-blue-500 font-bold mb-4 md:mb-6 transition-colors group">
            <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
            Back to Teams Hub
          </Link>
          <div className="p-4 md:p-8 rounded-[40px] glass-panel bg-white/40 border border-white/60 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Create Your Squad</h1>
            <p className="text-slate-500 font-medium">Build a team, invite players, and compete in tournaments.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
              <Info className="text-blue-500" size={24} />
              Basic Information
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-4 md:mb-6">
              {/* Logo Upload */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Team Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <Camera size={32} className="mb-2" />
                      <span className="text-xs font-bold uppercase">Upload Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Change Logo</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleLogoChange}
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-3 text-center">Optional. Max size 2MB.</p>
              </div>

              {/* Core Details */}
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Thunderbolts"
                    className="w-full px-5 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell us about your team..."
                    rows="3"
                    className="w-full px-5 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 rounded-[32px] glass-panel bg-white/60 border border-white">
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
              <Trophy className="text-blue-500" size={24} />
              Team Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Sport <span className="text-red-500">*</span>
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                  required
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                  Location / Home Venue <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai Central"
                    className="w-full pl-12 pr-5 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Skill Level
                </label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                >
                  {SKILL_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Team Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                >
                  {TEAM_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 md:px-8 py-4 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin mr-2" size={20} /> Creating Team...</>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default TeamCreatePage;

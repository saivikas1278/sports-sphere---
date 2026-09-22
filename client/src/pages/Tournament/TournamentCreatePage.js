import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Trophy, 
  Upload, 
  User, 
  Info, 
  ClipboardList, 
  Medal,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import { useDispatch } from 'react-redux';
import { createTournament } from '../../redux/slices/tournamentSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const schema = yup.object().shape({
  organizerName: yup.string().required('Organizer name is required'),
  organizerEmail: yup.string().email('Invalid email format').required('Email is required'),
  organizerPhone: yup.string().required('Contact number is required'),
  whatsappLink: yup.string(),
  tournamentName: yup.string().required('Tournament name is required'),
  sport: yup.string().required('Sport is required'),
  format: yup.string().required('Tournament format is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().min(yup.ref('startDate'), "End date can't be before start date").required('End date is required'),
  venueName: yup.string().required('Venue name is required'),
  venueAddress: yup.string().required('Venue address is required'),
  venueMapLink: yup.string().url('Must be a valid URL'),
  specialRules: yup.string(),
  reportingTime: yup.string().required('Reporting time is required'),
  amenities: yup.string(),
  equipment: yup.string().required('Equipment requirements are required'),
  prizes: yup.string().required('Prize details are required'),
  specialAwards: yup.string(),
  registrationStartDate: yup.date().required('Registration start date is required'),
  registrationEndDate: yup.date()
    .min(yup.ref('registrationStartDate'), "Registration end date can't be before start date")
    .max(yup.ref('startDate'), "Registration must end on or before tournament starts")
    .required('Registration end date is required'),
  entryFee: yup.number().min(0, 'Entry fee must be a positive number').required('Entry fee is required'),
  paymentDetails: yup.string().required('Payment details are required'),
  eligibility: yup.string().required('Eligibility criteria are required'),
  minTeamSize: yup.number().min(1, 'Minimum team size must be at least 1').required('Minimum team size is required'),
  requiredDocuments: yup.string()
});

const TournamentCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      sport: '',
      format: '',
      entryFee: 0,
      minTeamSize: 5,
      registrationStartDate: new Date().toISOString().split('T')[0],
      registrationEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const selectedSport = watch('sport');

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const mapSportToBackend = (sport) => {
    const sportMapping = {
      'Basketball': 'basketball',
      'Soccer': 'football',
      'Volleyball': 'volleyball',
      'Tennis': 'tennis',
      'Cricket': 'cricket',
      'Hockey': 'other',
      'Rugby': 'other',
      'Badminton': 'badminton'
    };
    return sportMapping[sport] || 'other';
  };

  const mapFormatToBackend = (format) => {
    const formatMapping = {
      'League': 'round-robin',
      'Knockout': 'single-elimination',
      'Round Robin': 'round-robin',
      '5v5': 'round-robin',
      '3v3': 'round-robin',
      '11v11': 'round-robin',
      '7v7': 'round-robin',
      '6v6': 'round-robin',
      '4v4': 'round-robin',
      'Singles': 'single-elimination',
      'Doubles': 'single-elimination',
      'Mixed Doubles': 'single-elimination',
      'T20': 'round-robin',
      'ODI': 'round-robin',
      'Test': 'league',
      'Union': 'round-robin',
      'Sevens': 'single-elimination',
      'Team Event': 'round-robin',
      'Beach': 'round-robin',
      'Indoor': 'round-robin',
      'Mixed': 'round-robin',
      'Field Hockey': 'round-robin',
      'Ice Hockey': 'round-robin'
    };
    return formatMapping[format] || 'round-robin';
  };

  const extractCityFromVenue = (venueName) => {
    if (venueName.toLowerCase().includes('central')) return 'Central City';
    if (venueName.toLowerCase().includes('downtown')) return 'Downtown';
    if (venueName.toLowerCase().includes('memorial')) return 'Memorial';
    return venueName.split(' ')[0] || 'City';
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const regStart = new Date(data.registrationStartDate);
      const regEnd = new Date(data.registrationEndDate);
      const tournStart = new Date(data.startDate);
      const tournEnd = new Date(data.endDate);
      
      if (regStart >= regEnd) {
        showToast('Registration start date must be before registration end date', 'error');
        return;
      }
      if (regEnd > tournStart) {
        showToast('Registration must end on or before tournament starts', 'error');
        return;
      }
      if (tournStart >= tournEnd) {
        showToast('Tournament start date must be before tournament end date', 'error');
        return;
      }
      
      const tournamentData = {
        name: data.tournamentName,
        description: data.prizes && data.prizes.length >= 10 ? data.prizes : `${data.tournamentName} - An exciting ${data.sport} tournament with great prizes and competitive matches.`,
        sport: mapSportToBackend(data.sport),
        format: mapFormatToBackend(data.format),
        maxTeams: 32,
        registrationFee: data.entryFee || 0,
        venue: {
          name: data.venueName,
          address: data.venueAddress,
          city: extractCityFromVenue(data.venueName),
          state: '',
          country: 'US'
        },
        dates: {
          registrationStart: regStart.toISOString(),
          registrationEnd: regEnd.toISOString(),
          tournamentStart: tournStart.toISOString(),
          tournamentEnd: tournEnd.toISOString()
        },
        status: 'draft',
        visibility: 'public',
        rules: data.specialRules || '',
        eligibility: { skillLevel: 'all', genderRestriction: 'none' },
        settings: {
          allowLateRegistration: false,
          requireApproval: false,
          maxPlayersPerTeam: data.minTeamSize + 5 || 15,
          minPlayersPerTeam: data.minTeamSize || 5
        }
      };
      
      await dispatch(createTournament(tournamentData)).unwrap();
      
      showToast('Tournament created successfully! You can now manage it from your dashboard.', 'success');
      reset();
      setLogoPreview(null);
      navigate('/tournaments');
    } catch (error) {
      console.error('Error creating tournament:', error);
      showToast(error.message || 'Failed to create tournament. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sportOptions = ['Basketball', 'Soccer', 'Volleyball', 'Tennis', 'Cricket', 'Badminton', 'Chess'];
  
  const formatOptions = {
    'Basketball': ['5v5', '3v3', 'League', 'Knockout', 'Mixed'],
    'Soccer': ['11v11', '7v7', '5v5', 'League', 'Knockout'],
    'Volleyball': ['6v6', '4v4', 'Beach', 'Indoor', 'League', 'Knockout', 'Mixed'],
    'Tennis': ['Singles', 'Doubles', 'Mixed Doubles', 'Round Robin', 'League', 'Knockout'],
    'Cricket': ['T20', 'ODI', 'Test', 'League', 'Knockout'],
    'Hockey': ['Field Hockey', 'Ice Hockey', 'League', 'Knockout'],
    'Rugby': ['Union', 'League', 'Sevens', 'Knockout'],
    'Badminton': ['Singles', 'Doubles', 'Mixed Doubles', 'Team Event', 'League', 'Knockout']
  };

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="mb-4 md:mb-8 p-4 md:p-8 rounded-[32px] glass-panel bg-white/40 border border-white/60 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -z-10" />
      <div className="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-white/40">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm border border-white">
          <Icon size={20} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, name, type = "text", register, error, placeholder = "", options = [], className = "" }) => (
    <div className={`mb-5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>
      
      {type === "select" ? (
        <div className="relative">
          <select
            id={name}
            {...register(name)}
            className={`w-full px-4 py-3.5 bg-white/80 border ${error ? 'border-red-400' : 'border-white'} rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm appearance-none`}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          {...register(name)}
          rows="4"
          placeholder={placeholder}
          className={`w-full px-4 py-3.5 bg-white/80 border ${error ? 'border-red-400' : 'border-white'} rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm resize-none`}
        ></textarea>
      ) : (
        <input
          id={name}
          type={type}
          {...register(name)}
          placeholder={placeholder}
          className={`w-full px-4 py-3.5 bg-white/80 border ${error ? 'border-red-400' : 'border-white'} rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm`}
        />
      )}
      
      {error && (
        <p className="mt-2 text-sm font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle size={14} /> {error.message}
        </p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 md:py-10 relative z-10">
      
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-4 md:mb-6 md:mb-10 p-4 md:p-8 rounded-[40px] glass-panel bg-white/40">
          <div className="w-16 h-16 mx-auto rounded-2xl md:rounded-3xl bg-blue-500 text-white flex items-center justify-center mb-4 shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]">
            <Trophy size={32} />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">Organize a Tournament</h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Fill out the form below to create your tournament and invite participants.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          
          <FormSection title="Organizer Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <InputField label="Organizer Name *" name="organizerName" register={register} error={errors.organizerName} placeholder="Your name or organization" />
              <InputField label="Email Address *" name="organizerEmail" type="email" register={register} error={errors.organizerEmail} placeholder="contact@example.com" />
              <InputField label="Phone Number *" name="organizerPhone" register={register} error={errors.organizerPhone} placeholder="+1 123-456-7890" />
              <InputField label="WhatsApp Group Link" name="whatsappLink" register={register} error={errors.whatsappLink} placeholder="https://chat.whatsapp.com/..." />
            </div>
          </FormSection>

          <FormSection title="Tournament Details" icon={Trophy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="md:col-span-2">
                <InputField label="Tournament Name *" name="tournamentName" register={register} error={errors.tournamentName} placeholder="Summer Championship 2025" />
              </div>
              
              <InputField label="Sport *" name="sport" type="select" register={register} error={errors.sport} options={sportOptions} />
              <InputField label="Format *" name="format" type="select" register={register} error={errors.format} options={formatOptions[selectedSport] || ['League', 'Knockout']} />
              
              <InputField label="Start Date *" name="startDate" type="date" register={register} error={errors.startDate} />
              <InputField label="End Date *" name="endDate" type="date" register={register} error={errors.endDate} />
              
              <div className="md:col-span-2 mt-2 pt-4 border-t border-white/40">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> Venue Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <InputField label="Venue Name *" name="venueName" register={register} error={errors.venueName} placeholder="Central Sports Complex" />
                  <InputField label="Map Link" name="venueMapLink" register={register} error={errors.venueMapLink} placeholder="Google Maps URL" />
                  <div className="md:col-span-2">
                    <InputField label="Venue Address *" name="venueAddress" register={register} error={errors.venueAddress} placeholder="Full address" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 mt-4">
                <label className="block text-sm font-bold text-slate-700 mb-3">Tournament Logo</label>
                <div className="flex items-center gap-3 md:gap-6">
                  <div className="w-16 md:w-24 h-16 md:h-24 rounded-2xl md:rounded-3xl bg-white/60 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-sm">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Trophy size={32} className="text-slate-300" />
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 md:px-6 py-3 bg-white text-slate-700 font-bold text-sm rounded-full shadow-sm hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all">
                      <Upload size={16} /> Choose Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                    <p className="text-xs font-medium text-slate-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Rules & Info" icon={Info}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="md:col-span-2">
                <InputField label="Special Rules" name="specialRules" type="textarea" register={register} error={errors.specialRules} placeholder="Any modifications to standard rules" />
              </div>
              <InputField label="Reporting Time *" name="reportingTime" register={register} error={errors.reportingTime} placeholder="1 hour before match" />
              <InputField label="Amenities Provided" name="amenities" register={register} error={errors.amenities} placeholder="Water, First aid, etc." />
              <div className="md:col-span-2">
                <InputField label="Equipment Requirements *" name="equipment" type="textarea" register={register} error={errors.equipment} placeholder="What participants need to bring" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Awards" icon={Medal}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="md:col-span-2">
                <InputField label="Prizes *" name="prizes" type="textarea" register={register} error={errors.prizes} placeholder="Details of main prizes, trophies, cash awards, etc." />
              </div>
              <div className="md:col-span-2">
                <InputField label="Special Awards" name="specialAwards" type="textarea" register={register} error={errors.specialAwards} placeholder="MVP, Fair Play, etc." />
              </div>
            </div>
          </FormSection>

          <FormSection title="Registration" icon={ClipboardList}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <InputField label="Registration Start Date *" name="registrationStartDate" type="date" register={register} error={errors.registrationStartDate} />
              <InputField label="Registration Deadline *" name="registrationEndDate" type="date" register={register} error={errors.registrationEndDate} />
              <InputField label="Entry Fee ($) *" name="entryFee" type="number" register={register} error={errors.entryFee} placeholder="0" />
              <InputField label="Minimum Team Size *" name="minTeamSize" type="number" register={register} error={errors.minTeamSize} placeholder="5" />
              
              <div className="md:col-span-2">
                <InputField label="Payment Details *" name="paymentDetails" register={register} error={errors.paymentDetails} placeholder="How and where to make payment" />
              </div>
              <div className="md:col-span-2">
                <InputField label="Eligibility Criteria *" name="eligibility" register={register} error={errors.eligibility} placeholder="Age group, skill level, etc." />
              </div>
              <div className="md:col-span-2">
                <InputField label="Required Documents" name="requiredDocuments" type="textarea" register={register} error={errors.requiredDocuments} placeholder="ID cards, waivers, etc." />
              </div>
            </div>
          </FormSection>

          {/* Submit */}
          <div className="flex justify-center pb-6 md:pb-10 md:pb-20">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-4 md:px-6 md:px-12 py-5 bg-blue-500 text-white font-extrabold text-lg rounded-full shadow-[0_8px_30px_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-105 hover:-translate-y-1 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={24} /> Publish Tournament
                </>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default TournamentCreatePage;
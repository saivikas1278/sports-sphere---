import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../redux/slices/authSlice';
import { validatePassword } from '../../utils/helpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Circle
} from 'lucide-react';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (name === 'password') {
      setPasswordValidation(validatePassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;
    if (!formData.acceptTerms) return;
    
    try {
      const result = await dispatch(register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }));
      if (register.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    } catch (err) {}
  };

  const isPasswordValid = passwordValidation.isValid;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const canSubmit = !loading && formData.acceptTerms && isPasswordValid && passwordsMatch && formData.fullName && formData.email;

  const renderValidationItem = (isValid, text) => (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${isValid ? 'text-green-600' : 'text-slate-400'}`}>
      {isValid ? <CheckCircle2 size={14} className="text-green-500" /> : <Circle size={14} />}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-10 py-4 md:py-6 md:py-10">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-purple-400/20 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '2s'}} />
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-[40px] glass-panel bg-white/40 overflow-hidden shadow-[0_20px_60px_rgb(0,0,255,0.05)]">
        
        {/* Left Side (Branding / Info) */}
        <div className="hidden md:flex w-5/12 p-4 md:p-6 md:p-12 bg-gradient-to-br from-blue-600 to-purple-700 flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80')] opacity-20 mix-blend-overlay bg-cover bg-center" />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-extrabold tracking-tighter">S</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">SportSphere</span>
            </Link>
          </div>

          <div className="relative z-10 mt-4 md:mt-6 md:mt-10 md:mt-20 mb-auto">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold mb-4 md:mb-6 leading-tight">
              Join the future of sports.
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-sm mb-4 md:mb-8">
              Create an account to get access to tournaments, teams, and connect with athletes across the globe.
            </p>
            
            <ul className="space-y-4 font-medium text-blue-100">
              <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-300" /> Organize & join tournaments</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-300" /> Create & manage teams</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-300" /> Access exclusive content</li>
            </ul>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-sm text-blue-200 font-medium">
            <ShieldCheck size={18} />
            Secure registration
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-7/12 p-4 md:p-8 md:p-14 flex flex-col justify-center bg-white/60 backdrop-blur-xl">
          <div className="md:hidden flex items-center justify-center gap-2 mb-4 md:mb-8">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-extrabold text-white tracking-tighter">S</span>
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">SportSphere</span>
          </div>

          <div className="mb-4 md:mb-8 text-center md:text-left">
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-slate-400" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="Full Name"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="Email Address"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">I am a:</p>
              <div className="grid grid-cols-3 gap-3">
                {['player', 'organizer', 'fan'].map(role => (
                  <label key={role} className={`cursor-pointer text-center px-2 py-3 rounded-2xl border-2 transition-all font-semibold text-sm capitalize ${formData.role === role ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-white bg-white/60 text-slate-500 hover:border-blue-200'}`}>
                    <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleChange} className="hidden" />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Password */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-slate-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3.5 bg-white/80 border border-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 transition-all outline-none"
                    placeholder="Create Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-slate-400" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 bg-white/80 border ${formData.confirmPassword && !passwordsMatch ? 'border-red-400 focus:ring-red-100' : 'border-white focus:border-blue-400 focus:ring-blue-100'} focus:ring-4 rounded-2xl text-slate-700 font-medium placeholder-slate-400 transition-all outline-none`}
                    placeholder="Confirm Password"
                  />
                </div>
              </div>
            </div>

            {/* Password Validation Display */}
            {formData.password && (
              <div className="bg-white/40 p-3 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-y-2">
                {renderValidationItem(passwordValidation.criteria?.minLength, "6+ characters")}
                {renderValidationItem(passwordValidation.criteria?.hasUpperCase, "1 uppercase")}
                {renderValidationItem(passwordValidation.criteria?.hasNumbers, "1 number")}
              </div>
            )}

            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-sm font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> Passwords do not match
              </p>
            )}

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-500 checked:border-blue-500 transition-colors"
                />
                <CheckCircle2 size={14} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 md:mt-8 text-center text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all">
              Sign in here
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../redux/slices/authSlice';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await dispatch(login(formData));
      if (login.fulfilled.match(result)) {
        navigate(from, { replace: true });
      }
    } catch (error) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-10">
      
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-purple-400/20 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '2s'}} />
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-[40px] glass-panel bg-white/40 overflow-hidden shadow-[0_20px_60px_rgb(0,0,255,0.05)]">
        
        {/* Left Side (Branding / Info) */}
        <div className="hidden md:flex w-1/2 p-4 md:p-6 md:p-12 bg-gradient-to-br from-blue-600 to-purple-700 flex-col justify-between relative overflow-hidden text-white">
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
            <h1 className="text-xl md:text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 leading-tight">
              Welcome back to the game.
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
              Log in to manage your tournaments, connect with your team, and track your fitness progress all in one place.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-sm text-blue-200 font-medium">
            <ShieldCheck size={18} />
            Secure authentication
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-1/2 p-4 md:p-8 md:p-14 flex flex-col justify-center bg-white/60 backdrop-blur-xl">
          <div className="md:hidden flex items-center justify-center gap-2 mb-4 md:mb-8">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-extrabold text-white tracking-tighter">S</span>
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">SportSphere</span>
          </div>

          <div className="mb-4 md:mb-6 md:mb-10 text-center md:text-left">
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Sign In</h2>
            <p className="text-slate-500 font-medium">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-4 bg-white/80 border border-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 transition-all outline-none"
                  placeholder="Email address"
                />
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-4 bg-white/80 border border-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 transition-all outline-none"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 md:mt-8 text-center text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all">
              Create an account
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

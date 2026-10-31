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
import api from '../../services/api';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    dispatch(clearError());

    // Check if Google OAuth is configured on backend
    api.get('/auth/google/status')
      .then((res) => {
        if (res?.data?.enabled) {
          setGoogleAuthEnabled(true);
        }
      })
      .catch(() => {
        setGoogleAuthEnabled(false);
      });
  }, [dispatch]);

  const handleGoogleLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

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

          {googleAuthEnabled && (
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 px-3 text-slate-400 font-bold">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:shadow-md transition-all shadow-sm flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

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

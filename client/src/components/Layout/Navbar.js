import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { selectUnreadCount, fetchUnreadCount } from '../../redux/slices/notificationSlice';
import NotificationPanel from '../Notifications/NotificationPanel';
import GlobalSearchModal from '../UI/GlobalSearchModal';
import { 
  Bell, 
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LogIn,
  UserPlus,
  Search
} from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const unreadCount = useSelector(selectUnreadCount);

  React.useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
    }
  }, [isAuthenticated, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setShowProfileMenu(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 rounded-b-3xl rounded-t-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-20">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                  SportSphere
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Elite Sports Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link to="/" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Home</Link>
              <Link to="/dashboard" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Dashboard</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-full transition-all border border-purple-200">Admin</Link>
              )}
              <Link to="/tournaments" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Tournaments</Link>
              <Link to="/matches" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Matches</Link>
              <Link to="/teams" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Teams</Link>
              <Link to="/cricket" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Cricket</Link>
              <Link to="/posts" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Feed</Link>
              <Link to="/fitness" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-white/60 rounded-full transition-all">Fitness</Link>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2.5 rounded-full text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 rounded-full text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all hidden sm:block"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </div>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationPanel onClose={() => setShowNotifications(false)} />
                  )}
                </div>
              )}

              {/* Authentication Buttons */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 p-1.5 pr-4 bg-white/70 backdrop-blur-lg rounded-full border border-white/40 shadow-sm transition-all hover:bg-white/90"
                  >
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.firstName || 'User'} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User size={16} />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-semibold text-slate-700">
                      {user?.firstName || 'Profile'}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 p-2 bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgb(0,0,255,0.12)] border border-white/60 z-50">
                      <div className="flex flex-col gap-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User size={16} className="mr-3" />
                          My Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Settings size={16} className="mr-3" />
                          Settings
                        </Link>
                        <div className="h-px bg-slate-200/60 my-1 mx-2" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 rounded-2xl hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} className="mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-white/80 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center px-4 md:px-6 py-2.5 rounded-full text-sm font-bold text-white bg-blue-500 shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 text-slate-600 hover:bg-white/60 rounded-full transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? 'max-h-[80vh] overflow-y-auto opacity-100 border-t border-white/40' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-4 space-y-2 bg-white/50 backdrop-blur-md rounded-b-3xl">
            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-1 mb-4">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Home</Link>
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Dashboard</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-purple-700 hover:bg-purple-50 rounded-2xl transition-all border border-purple-200">Admin Portal</Link>
              )}
              <Link to="/tournaments" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Tournaments</Link>
              <Link to="/matches" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Matches</Link>
              <Link to="/teams" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Teams</Link>
              <Link to="/cricket" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Cricket</Link>
              <Link to="/posts" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Feed</Link>
              <Link to="/fitness" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-bold text-slate-700 hover:bg-white/70 rounded-2xl transition-all">Fitness</Link>
            </div>
            
            {!isAuthenticated && (
              <div className="flex flex-col gap-2 border-t border-slate-200/50 pt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-3 px-4 py-3 rounded-2xl text-slate-700 bg-white/70 hover:bg-white font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center space-x-3 px-4 py-3 rounded-2xl text-white bg-blue-500 shadow-md font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-12 md:h-20" />

      {/* Full-Screen Search Modal */}
      <GlobalSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;

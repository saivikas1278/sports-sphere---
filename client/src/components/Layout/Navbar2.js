import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../UI/ThemeToggle';
import { 
  FaHome, 
  FaTrophy, 
  FaDumbbell, 
  FaUser, 
  FaBars, 
  FaTimes,
  FaBell,
  FaSearch,
  FaGamepad,
  FaCog,
  FaSignOutAlt,
  FaNewspaper,
  FaComments
} from 'react-icons/fa';

const Navbar2 = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const { isDark } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: FaHome, color: 'from-blue-500 to-blue-700' },
    { name: 'Cricket', path: '/cricket', icon: FaGamepad, color: 'from-green-500 to-green-700' },
    { name: 'Tournaments', path: '/tournaments', icon: FaTrophy, color: 'from-yellow-500 to-yellow-700' },
    { name: 'Posts', path: '/posts', icon: FaNewspaper, color: 'from-purple-500 to-purple-700' },
    { name: 'Fitness', path: '/fitness', icon: FaDumbbell, color: 'from-orange-500 to-orange-700' },
    { name: 'Chat', path: '/chat', icon: FaComments, color: 'from-pink-500 to-pink-700' },
  ];

  const isActivePath = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* Futuristic Navbar */}
      <nav className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out
        ${isScrolled 
          ? isDark
            ? 'bg-black/90 backdrop-blur-2xl border-b border-cyan-500/30 shadow-2xl shadow-cyan-500/10'
            : 'bg-gray-100/90 backdrop-blur-2xl border-b border-blue-500/30 shadow-2xl shadow-blue-500/10'
          : isDark
            ? 'bg-gradient-to-r from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl'
            : 'bg-gradient-to-r from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-xl'
        }
      `}>
        
        {/* Animated circuit lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`
            absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse
            ${!isDark ? 'opacity-60' : ''}
          `} />
          <div className={`
            absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse delay-1000
            ${!isDark ? 'opacity-60' : ''}
          `} />
          
          {/* Circuit nodes */}
          <div className={`
            absolute top-2 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-ping
            ${!isDark ? 'opacity-60' : ''}
          `} />
          <div className={`
            absolute top-2 right-32 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-500
            ${!isDark ? 'opacity-60' : ''}
          `} />
          <div className={`
            absolute bottom-2 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-1000
            ${!isDark ? 'opacity-60' : ''}
          `} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-20">
            
            {/* Futuristic Logo */}
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="relative">
                {/* Outer ring */}
                <div className="w-12 h-12 border-2 border-cyan-400 rounded-full animate-spin-slow" />
                {/* Inner logo */}
                <div className="absolute inset-2 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaTrophy className="text-white text-lg animate-pulse" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
              </div>
              
              <div className="flex flex-col">
                <span className={`
                  text-2xl font-bold transition-all duration-300
                  ${isDark 
                    ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent'
                  }
                `}>
                  SportSphere
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className={`
                    text-xs font-mono transition-colors duration-300
                    ${isDark ? 'text-cyan-300' : 'text-blue-200'}
                  `}>
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </Link>

            {/* Holographic Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative group"
                  >
                    <div className={`
                      flex flex-col items-center p-3 rounded-lg transition-all duration-500
                      ${isActive 
                        ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 shadow-lg shadow-cyan-500/25' 
                        : 'hover:bg-gradient-to-b hover:from-gray-800/50 hover:to-gray-700/50 border border-transparent hover:border-gray-600/50'
                      }
                      transform hover:scale-105 hover:-translate-y-1
                    `}>
                      
                      {/* Icon with gradient background */}
                      <div className={`
                        w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} 
                        flex items-center justify-center mb-1
                        ${isActive ? 'animate-pulse' : 'group-hover:animate-bounce'}
                        shadow-lg
                      `}>
                        <Icon className="text-white text-sm" />
                      </div>
                      
                      <span className={`
                        text-xs font-medium transition-all duration-300
                        ${isActive ? 'text-cyan-300' : 'text-gray-400 group-hover:text-white'}
                      `}>
                        {item.name}
                      </span>
                    </div>
                    
                    {/* Active indicator beam */}
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full">
                        <div className="w-full h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-ping" />
                      </div>
                    )}
                    
                    {/* Hover hologram effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
                  </Link>
                );
              })}
            </div>

            {/* Control Panel */}
            <div className="flex items-center space-x-3">
              {/* Search Terminal */}
              <button className={`
                relative p-3 rounded-lg transition-all duration-300 group
                ${isDark
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 hover:border-cyan-400/50'
                  : 'bg-gradient-to-br from-blue-800 to-purple-800 border border-blue-600/50 hover:border-blue-400/50'
                }
              `}>
                <FaSearch className={`
                  transition-colors duration-300
                  ${isDark 
                    ? 'text-gray-400 group-hover:text-cyan-400'
                    : 'text-blue-200 group-hover:text-blue-100'
                  }
                `} />
                <div className={`
                  absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${isDark ? 'bg-cyan-400/10' : 'bg-blue-400/10'}
                `} />
              </button>

              {/* Notification Console */}
              <button className={`
                relative p-3 rounded-lg transition-all duration-300 group
                ${isDark
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 hover:border-red-400/50'
                  : 'bg-gradient-to-br from-blue-800 to-purple-800 border border-blue-600/50 hover:border-red-400/50'
                }
              `}>
                <FaBell className={`
                  transition-colors duration-300
                  ${isDark 
                    ? 'text-gray-400 group-hover:text-red-400'
                    : 'text-blue-200 group-hover:text-red-300'
                  }
                `} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                </div>
                <div className="absolute inset-0 bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Profile System */}
              <div className="relative">
                <button 
                  className={`
                    flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 group
                    ${isDark
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 hover:border-purple-400/50'
                      : 'bg-gradient-to-br from-blue-800 to-purple-800 border border-blue-600/50 hover:border-purple-400/50'
                    }
                  `}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className={`
                      text-sm font-medium transition-colors duration-300
                      ${isDark ? 'text-white' : 'text-blue-100'}
                    `}>Admin</span>
                    <span className={`
                      text-xs transition-colors duration-300
                      ${isDark ? 'text-gray-400' : 'text-blue-200'}
                    `}>Online</span>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className={`
                    absolute right-0 top-full mt-2 w-48 rounded-lg shadow-2xl backdrop-blur-xl border
                    ${isDark
                      ? 'bg-black/90 border-gray-600/50'
                      : 'bg-blue-900/90 border-blue-600/50'
                    }
                  `}>
                    <div className="p-2 space-y-1">
                      <Link to="/profile" className={`
                        flex items-center space-x-2 p-2 rounded-md transition-colors
                        ${isDark
                          ? 'hover:bg-purple-600/20 text-gray-300 hover:text-white'
                          : 'hover:bg-purple-600/20 text-blue-200 hover:text-white'
                        }
                      `}>
                        <FaUser className="text-sm" />
                        <span>Profile</span>
                      </Link>
                      <Link to="/settings" className={`
                        flex items-center space-x-2 p-2 rounded-md transition-colors
                        ${isDark
                          ? 'hover:bg-gray-600/20 text-gray-300 hover:text-white'
                          : 'hover:bg-blue-600/20 text-blue-200 hover:text-white'
                        }
                      `}>
                        <FaCog className="text-sm" />
                        <span>Settings</span>
                      </Link>
                      <button className={`
                        flex items-center space-x-2 p-2 rounded-md transition-colors w-full text-left
                        ${isDark
                          ? 'hover:bg-red-600/20 text-gray-300 hover:text-red-400'
                          : 'hover:bg-red-600/20 text-blue-200 hover:text-red-300'
                        }
                      `}>
                        <FaSignOutAlt className="text-sm" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className={`
                  lg:hidden p-3 rounded-lg transition-all duration-300
                  ${isDark
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 hover:border-cyan-400/50'
                    : 'bg-gradient-to-br from-blue-800 to-purple-800 border border-blue-600/50 hover:border-blue-400/50'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? 
                  <FaTimes className={isDark ? 'text-cyan-400' : 'text-blue-200'} /> : 
                  <FaBars className={isDark ? 'text-gray-400' : 'text-blue-200'} />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Holographic Menu */}
        <div className={`
          lg:hidden transition-all duration-500 ease-out overflow-hidden
          ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          ${isDark 
            ? 'bg-black/95 backdrop-blur-2xl border-t border-cyan-500/30'
            : 'bg-blue-900/95 backdrop-blur-2xl border-t border-blue-500/30'
          }
        `}>
          <div className="p-4 grid grid-cols-2 gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center p-4 rounded-lg transition-all duration-300
                    ${isActive 
                      ? isDark
                        ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border border-cyan-400/50'
                        : 'bg-gradient-to-b from-blue-500/20 to-purple-600/20 border border-blue-400/50'
                      : isDark
                        ? 'bg-gray-800/50 border border-gray-600/30 hover:border-cyan-400/50'
                        : 'bg-blue-800/50 border border-blue-600/30 hover:border-blue-400/50'
                    }
                    transform hover:scale-105
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={`
                    w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} 
                    flex items-center justify-center mb-2
                  `}>
                    <Icon className="text-white" />
                  </div>
                  <span className={`
                    text-sm font-medium transition-colors duration-300
                    ${isActive 
                      ? isDark ? 'text-cyan-300' : 'text-blue-200'
                      : isDark ? 'text-gray-300' : 'text-blue-100'
                    }
                  `}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-12 md:h-20" />
    </>
  );
};

export default Navbar2;

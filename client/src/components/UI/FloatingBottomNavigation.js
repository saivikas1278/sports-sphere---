import React from 'react';
import { Home, Trophy, PlaySquare, Activity, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const FloatingBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Only show navigation on mobile screens
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'compete', icon: Trophy, label: 'Compete', path: '/tournaments' },
    { id: 'feed', icon: PlaySquare, label: 'Feed', path: '/posts' },
    { id: 'train', icon: Activity, label: 'Train', path: '/fitness' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
  ];

  // Helper to determine if a path matches the current location
  const isActiveTab = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(itemPath);
  };

  // Do not show bottom nav if not authenticated to save space for login screen
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5 gap-2 sm:gap-4 rounded-full glass-pill bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgb(0,0,0,0.1)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveTab(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all duration-300 ${
                isActive ? 'text-white' : 'text-slate-500 hover:bg-white/50 hover:text-blue-500'
              }`}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-blue-500 rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingBottomNavigation;

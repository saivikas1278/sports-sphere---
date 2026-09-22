import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Trophy, User } from 'lucide-react';
import api from '../../services/api';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('tournaments'); // 'tournaments' or 'players'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => {
        setIsVisible(true);
        if (inputRef.current) inputRef.current.focus();
      }, 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setQuery('');
        setResults([]);
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        let res;
        if (searchType === 'tournaments') {
          res = await api.get(`/tournaments/search?q=${query}`);
        } else {
          res = await api.get(`/search/users?q=${query}`);
        }
        
        setResults(res.data?.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, searchType]);

  // Keydown listener for ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults = results?.length > 0;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col bg-white/95 backdrop-blur-2xl transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    >
      {/* Close Button Top Right */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-8 md:right-12 p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-all transform hover:scale-105 shadow-sm z-10"
        aria-label="Close search"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Container stays at the top now */}
      <div className="w-full max-w-4xl mx-auto flex flex-col pt-16 sm:pt-24 px-4 sm:px-8">
        
        {/* Category Tabs / Header */}
        <div className={`flex items-center gap-6 mb-8 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <button 
            onClick={() => {
              setSearchType('tournaments');
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className={`pb-2 text-lg sm:text-xl font-extrabold transition-all border-b-4 ${searchType === 'tournaments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
          >
            Near Tournaments
          </button>
          <button 
            onClick={() => {
              setSearchType('players');
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className={`pb-2 text-lg sm:text-xl font-extrabold transition-all border-b-4 ${searchType === 'players' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
          >
            Players
          </button>
        </div>

        {/* Large Search Input */}
        <div className={`relative transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 delay-100'}`}>
          <div className="flex items-center border-b-2 border-slate-300 focus-within:border-blue-500 transition-colors pb-6">
            
            <Search className="w-8 h-8 sm:w-10 sm:h-10 mr-4 shrink-0 transition-colors text-blue-500" />
            
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent border-none outline-none text-3xl sm:text-5xl font-extrabold text-slate-800 placeholder-slate-300 focus:ring-0 p-0"
              placeholder={searchType === 'tournaments' ? 'Search tournaments...' : 'Search players...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-4"
              >
                <X className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-between text-sm font-medium text-slate-400">
            <p>Start typing to search across {searchType === 'tournaments' ? 'tournaments' : 'players'}</p>
            <div className="hidden sm:flex items-center gap-1.5">
              <span>Press</span>
              <kbd className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs text-slate-500 font-sans shadow-sm">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className={`flex-1 overflow-y-auto pt-10 pb-20 transition-all duration-500 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
              <p className="font-semibold text-lg">Searching...</p>
            </div>
          ) : query && !hasResults ? (
            <div className="py-20 text-center text-slate-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="font-bold text-2xl text-slate-700">No results found for "{query}"</p>
              <p className="text-slate-500 mt-2 text-lg">Try adjusting your search terms.</p>
            </div>
          ) : hasResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-10 w-full">
              
              {searchType === 'tournaments' && results.map((tournament) => (
                <div 
                  key={tournament._id}
                  onClick={() => handleNavigate(`/tournaments/${tournament._id}`)}
                  className="flex items-start p-4 rounded-3xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0 mr-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-bold text-lg text-slate-800 truncate group-hover:text-blue-600 transition-colors">{tournament.name}</p>
                    <p className="text-sm font-medium text-slate-500 truncate capitalize mt-0.5">{tournament.sport} • {tournament.location || 'Local'}</p>
                  </div>
                </div>
              ))}

              {searchType === 'players' && results.map((user) => (
                <div 
                  key={user._id}
                  onClick={() => handleNavigate(`/profile/${user._id}`)}
                  className="flex items-center p-4 rounded-3xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.firstName} className="w-14 h-14 rounded-2xl object-cover shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-md" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-xl shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-slate-800 truncate group-hover:text-blue-600 transition-colors">{user.firstName} {user.lastName}</p>
                    <p className="text-sm font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              ))}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;

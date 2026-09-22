import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Flame, 
  Clock, 
  Trophy, 
  ChevronDown, 
  Image as ImageIcon, 
  Video,
  ListFilter
} from 'lucide-react';
import Post from '../../components/Posts/Post';
import PostUploadForm from '../../components/Posts/PostUploadForm';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CategoryFilterScroll from '../../components/UI/CategoryFilterScroll';
import { useTheme } from '../../context/ThemeContext';
import { 
  fetchPosts, 
  selectPosts, 
  selectPostsLoading, 
  selectPostsError,
  clearError
} from '../../redux/slices/postSlice';

const SPORTS = [
  { id: 'all', label: 'All Sports' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'soccer', label: 'Soccer' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'gymnastics', label: 'Gymnastics' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'rugby', label: 'Rugby' }
];

const PostsHub = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const posts = useSelector(selectPosts);
  const loading = useSelector(selectPostsLoading);
  const error = useSelector(selectPostsError);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSport, setActiveSport] = useState('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState(typeParam || 'all');
  const [sort, setSort] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }

    const fetchParams = {
      page: 1,
      limit: 20,
      sort: sort === 'latest' ? '-createdAt' : sort === 'popular' ? '-likesCount' : 'createdAt'
    };

    if (activeSport !== 'all') fetchParams.sport = activeSport;
    if (mediaTypeFilter !== 'all') fetchParams.type = mediaTypeFilter;
    if (searchTerm) fetchParams.search = searchTerm;

    const timeoutId = setTimeout(() => {
      dispatch(fetchPosts(fetchParams));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dispatch, activeSport, mediaTypeFilter, searchTerm, sort, error]);

  const handleNewPost = (newPost) => {
    dispatch(fetchPosts({
      page: 1,
      limit: 20,
      sort: sort === 'latest' ? '-createdAt' : sort === 'popular' ? '-likesCount' : 'createdAt'
    }));
  };

  const mediaTypeFilters = [
    { value: 'all', label: 'All Media', icon: null },
    { value: 'photo', label: 'Photos', icon: ImageIcon },
    { value: 'video', label: 'Videos', icon: Video }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest', icon: Clock },
    { value: 'popular', label: 'Popular', icon: Flame },
    { value: 'oldest', label: 'Oldest', icon: Trophy }
  ];

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-8 p-4 md:p-6 rounded-[32px] glass-panel bg-white/40">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-1 md:mb-2 tracking-tight">Sports Feed</h1>
            <p className="text-sm md:text-lg text-slate-500 font-medium">Share and discover epic sports moments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden flex items-center justify-center w-11 h-11 bg-white/80 text-slate-700 rounded-full shadow-sm hover:bg-white hover:scale-105 transition-all"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <Filter size={20} className={showFilters ? 'text-blue-500' : ''} />
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className={`mb-4 md:mb-8 space-y-4 ${!showFilters && 'hidden md:block'}`}>
          <CategoryFilterScroll 
            categories={SPORTS} 
            activeCategory={activeSport} 
            onSelectCategory={setActiveSport} 
          />
          
          <div className="flex flex-col md:flex-row gap-4 px-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search posts, users, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Media Type */}
              <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-full border border-white/40 shadow-sm">
                {mediaTypeFilters.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setMediaTypeFilter(option.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      mediaTypeFilter === option.value
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {option.icon && <option.icon size={16} />}
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Sort By */}
              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-10 pr-10 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-full text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all cursor-pointer h-full"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <ListFilter size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upload Form */}
        {isAuthenticated && (
          <div className="mb-4 md:mb-8">
            <PostUploadForm onSuccess={handleNewPost} />
          </div>
        )}
        
        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center items-center py-4 md:py-6 md:py-10 md:py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-5 md:p-10 rounded-[40px] glass-panel bg-white/40 text-center">
            <div className="w-12 md:w-20 h-12 md:h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4 md:mb-6">
              <Search size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Error loading posts</h3>
            <p className="text-slate-500 font-medium mb-4 md:mb-8 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => dispatch(fetchPosts({ page: 1, limit: 20 }))}
              className="px-4 md:px-8 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map(post => (
              <Post key={post._id} post={post} />
            ))}
            
            <div className="text-center pt-4 pb-4 md:pb-8">
              <p className="text-slate-500 font-medium mb-2">Showing {posts.length} posts</p>
              {(searchTerm || activeSport !== 'all' || mediaTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSport('all');
                    setMediaTypeFilter('all');
                  }}
                  className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 md:p-10 rounded-[40px] glass-panel bg-white/40 text-center border border-dashed border-slate-300">
            <div className="w-12 md:w-20 h-12 md:h-20 mx-auto rounded-full bg-white/80 flex items-center justify-center mb-4 md:mb-6 shadow-sm">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No posts found</h3>
            <p className="text-slate-500 font-medium mb-4 md:mb-8 max-w-md mx-auto">
              {searchTerm
                ? `We couldn't find any posts matching "${searchTerm}"`
                : activeSport !== 'all'
                ? `No posts found for ${activeSport}`
                : mediaTypeFilter !== 'all'
                ? `No ${mediaTypeFilter}s found`
                : 'Be the first to share a sports moment!'}
            </p>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveSport('all');
                  setMediaTypeFilter('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 md:px-8 py-3 bg-blue-500 text-white font-bold rounded-full shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:bg-blue-600 transition-all"
              >
                Create a Post
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsHub;

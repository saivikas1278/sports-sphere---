import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';
import postService from '../../services/postService';
import { showToast } from '../../utils/toast';

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [filterMode, setFilterMode] = useState('flagged'); // 'flagged' | 'all'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchModerationPosts = async () => {
    try {
      setLoading(true);
      const res = await postService.getPosts({ limit: 50 });
      const list = res.data?.data?.posts || res.data?.posts || [];
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load posts for moderation:', err);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationPosts();
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      showToast('Post deleted from platform', 'success');
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  const handleDismiss = (postId) => {
    showToast('Report dismissed and marked safe', 'info');
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const displayedPosts = posts.filter(post => {
    if (filterMode === 'all') return true;
    return (post.reports && post.reports.length > 0) || post.flagged || post.status === 'flagged';
  });

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Content Moderation
          </h1>
          <p className="text-slate-500 font-medium mt-1">Review flagged community content, enforce guidelines, and maintain community safety.</p>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8 border-b border-slate-200/60 pb-4">
          <div className="flex gap-4">
            <button 
              className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'posts' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('posts')}
            >
              Community Posts & Media
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('flagged')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'flagged' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flagged Only
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Posts ({posts.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="animate-spin text-red-500" size={36} />
          </div>
        ) : (
          <div className="grid gap-3 md:gap-6">
            {displayedPosts.map(post => {
              const authorName = post.author 
                ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || 'Author' 
                : 'Community User';
              const reportCount = post.reports?.length || (post.flagged ? 1 : 0);

              return (
                <div key={post._id} className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase">{post.type || 'Post'}</span>
                        {reportCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center gap-1">
                            <AlertTriangle size={12} /> {reportCount} Flag{reportCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-sm text-slate-500">By <span className="font-bold text-slate-700">{authorName}</span></span>
                        <span className="text-xs text-slate-400">· {new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{post.title || 'Untitled Post'}</h3>
                      <p className="text-slate-600 font-medium mb-3">{post.content}</p>
                      
                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {post.images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img.url} alt="Post attachment" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-200/60">
                    <button 
                      onClick={() => handleDismiss(post._id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm"
                    >
                      <CheckCircle size={18} /> Mark Safe
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trash2 size={18} /> Remove Content
                    </button>
                  </div>
                </div>
              );
            })}

            {displayedPosts.length === 0 && (
              <div className="text-center py-4 md:py-6 md:py-12 glass-panel rounded-2xl md:rounded-3xl">
                <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Clean Feed!</h3>
                <p className="text-slate-500">
                  {filterMode === 'flagged' 
                    ? 'There are no flagged items requiring moderation.' 
                    : 'No posts found in the platform.'}
                </p>
                {filterMode === 'flagged' && posts.length > 0 && (
                  <button
                    onClick={() => setFilterMode('all')}
                    className="mt-4 px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-sm"
                  >
                    View All Community Posts
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentModeration;

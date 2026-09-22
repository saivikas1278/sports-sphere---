import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Image as ImageIcon,
  Send
} from 'lucide-react';
import { toast } from 'react-toastify';
import { formatDate, getRelativeTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MetaTags from '../../components/SEO/MetaTags';
import { 
  fetchPostById, 
  likePost, 
  addComment,
  selectCurrentPost,
  selectPostsLoading,
  selectPostsError,
  clearCurrentPost
} from '../../redux/slices/postSlice';

const PostDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const post = useSelector(selectCurrentPost);
  const loading = useSelector(selectPostsLoading);
  const error = useSelector(selectPostsError);
  const navigate = useNavigate();
  
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    dispatch(fetchPostById(id));
    return () => {
      dispatch(clearCurrentPost());
    };
  }, [dispatch, id]);

  const isVideo = post?.type === 'video';
  const isLiked = post?.isLikedByUser || false;

  const handleLike = () => {
    if (!post) return;
    dispatch(likePost(post._id));
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(saved ? 'Removed from saved posts' : 'Added to saved posts');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: post.title || `Post by ${post.author.firstName} ${post.author.lastName}`,
      text: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Post shared successfully');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Failed to share post');
      }
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim() || !post) return;
    
    dispatch(addComment({ id: post._id, content: comment }));
    setComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex justify-center items-center py-4 md:py-6 md:py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col justify-center items-center py-4 md:py-6 md:py-12 px-4">
        <div className="p-4 md:p-6 md:p-12 rounded-[40px] glass-panel bg-white/40 border border-white text-center max-w-md">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-4">{error ? 'Error Loading Post' : 'Post Not Found'}</h2>
          <p className="text-slate-600 font-medium mb-4 md:mb-8">{error || "The post you're looking for doesn't exist or has been removed."}</p>
          <div className="flex flex-col gap-3">
            {error && (
              <button
                onClick={() => dispatch(fetchPostById(id))}
                className="w-full px-4 md:px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-sm"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => navigate('/posts')}
              className="w-full px-4 md:px-6 py-3 bg-white/60 text-slate-700 font-bold rounded-full hover:bg-white border border-white transition-all shadow-sm"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 relative z-10 max-w-6xl">
      {post && (
        <MetaTags
          title={`${post.title || 'Post'} by ${post.author.firstName} ${post.author.lastName} - SportSphere`}
          description={post.content.length > 160 ? post.content.substring(0, 160) + '...' : post.content}
          image={post.images && post.images.length > 0 ? 
            (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url) : 
            '/logo192.png'
          }
          url={window.location.href}
          type="article"
        />
      )}
      
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => navigate('/posts')}
          className="inline-flex items-center text-slate-500 hover:text-blue-500 font-bold transition-colors group"
        >
          <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
          Back to Posts
        </button>
      </div>
      
      <div className="rounded-[40px] glass-panel bg-white/40 border border-white shadow-lg overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        
        {/* Media Side */}
        <div className="md:w-3/5 bg-slate-900/5 flex items-center justify-center relative min-h-[400px]">
          {isVideo ? (
            post.videos && post.videos.length > 0 ? (
              <video 
                src={typeof post.videos[0] === 'string' ? post.videos[0] : post.videos[0].url} 
                className="w-full h-full object-contain max-h-[85vh] rounded-l-[40px]"
                controls
                autoPlay
              />
            ) : (
              <div className="text-slate-400 font-medium">Video not available</div>
            )
          ) : (
            post.images && post.images.length > 0 ? (
              <img 
                src={typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url} 
                alt="Post content" 
                className="w-full h-full object-cover max-h-[85vh]"
                onError={(e) => {
                  e.target.src = '/placeholder-image.svg';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 md:p-6 md:p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <ImageIcon size={64} className="mb-4 text-slate-300" />
                <p className="font-medium text-lg text-slate-600 mb-2">{post.content}</p>
              </div>
            )
          )}
        </div>
        
        {/* Interaction Side */}
        <div className="md:w-2/5 flex flex-col bg-white/60 backdrop-blur-md border-l border-white/50 h-full max-h-[85vh]">
          
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-white/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${post.author._id}`}>
                <img 
                  src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=3b82f6&color=fff`} 
                  alt={`${post.author.firstName} ${post.author.lastName}`} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm hover:scale-105 transition-transform"
                />
              </Link>
              <div>
                <Link to={`/profile/${post.author._id}`} className="font-extrabold text-slate-800 hover:text-blue-500 transition-colors block leading-tight">
                  {post.author.firstName} {post.author.lastName}
                </Link>
                {post.location && (
                  <p className="text-xs font-bold text-slate-400 flex items-center mt-0.5">
                    <MapPin className="mr-1" size={12} />
                    {post.location}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Scrollable Content & Comments */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            
            {/* Post Details */}
            <div className="mb-4 md:mb-8 pb-6 border-b border-white/60">
              <p className="text-slate-700 font-medium leading-relaxed mb-4 whitespace-pre-line">
                <span className="font-extrabold text-slate-900 mr-2">{post.author.firstName} {post.author.lastName}</span>
                {post.content}
              </p>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <Link 
                      key={tag} 
                      to={`/posts?search=${tag}`} 
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center">
                  <Calendar className="mr-1.5" size={14} />
                  {formatDate(post.createdAt)}
                </span>
                {post.sport && (
                  <span className="flex items-center">
                    <User className="mr-1.5" size={14} />
                    {post.sport}
                  </span>
                )}
              </div>
            </div>
            
            {/* Comments List */}
            <div>
              <h3 className="font-extrabold text-slate-800 mb-4 md:mb-6 flex items-center">
                <MessageCircle className="mr-2 text-slate-400" size={18} />
                Comments
              </h3>
              
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-5">
                  {post.comments.map(comment => (
                    <div key={comment._id} className="flex gap-3 group">
                      <Link to={`/profile/${comment.author._id}`} className="shrink-0 mt-1">
                        <img 
                          src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=3b82f6&color=fff`} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover shadow-sm"
                        />
                      </Link>
                      <div>
                        <div className="bg-white/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-white">
                          <Link to={`/profile/${comment.author._id}`} className="font-bold text-slate-800 text-sm mr-2 hover:text-blue-500">
                            {comment.author.firstName} {comment.author.lastName}
                          </Link>
                          <span className="text-slate-600 text-sm font-medium">{comment.content}</span>
                        </div>
                        <div className="flex items-center mt-1.5 gap-4 px-2 text-xs font-bold text-slate-400">
                          <span>{getRelativeTime(comment.createdAt)}</span>
                          <button className="hover:text-slate-600 transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 md:py-8">
                  <MessageCircle className="mx-auto text-slate-300 mb-3" size={32} />
                  <p className="text-slate-500 font-medium text-sm">No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Bar & Comment Input */}
          <div className="bg-white/80 backdrop-blur-lg border-t border-white/60 p-4 shrink-0">
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike}
                  className={`transition-transform hover:scale-110 active:scale-95 ${isLiked ? 'text-red-500' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <Heart size={26} className={isLiked ? 'fill-current' : ''} />
                </button>
                <button className="text-slate-700 hover:text-slate-900 transition-transform hover:scale-110">
                  <MessageCircle size={26} />
                </button>
                <button 
                  onClick={handleShare}
                  className="text-slate-700 hover:text-slate-900 transition-transform hover:scale-110"
                >
                  <Share2 size={26} />
                </button>
              </div>
              <button 
                onClick={handleSave}
                className={`transition-transform hover:scale-110 active:scale-95 ${saved ? 'text-amber-500' : 'text-slate-700 hover:text-slate-900'}`}
              >
                <Bookmark size={26} className={saved ? 'fill-current' : ''} />
              </button>
            </div>
            
            <p className="font-extrabold text-slate-800 text-sm mb-4 px-2">
              {post.likesCount || 0} likes
            </p>
            
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="flex relative">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-700"
                />
                <button 
                  type="submit" 
                  disabled={!comment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send size={18} className="mr-0.5 mt-0.5" />
                </button>
              </form>
            ) : (
              <div className="text-center py-2 bg-slate-50 rounded-full border border-slate-200">
                <Link to="/login" className="text-sm font-bold text-blue-500 hover:text-blue-700">
                  Log in to join the conversation
                </Link>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default PostDetails;

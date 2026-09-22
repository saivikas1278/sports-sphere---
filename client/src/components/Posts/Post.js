import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaEllipsisH, FaPlay, FaTrash, FaEdit, FaCopy, FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getRelativeTime } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import { likePost, addComment, sharePost, deletePost, savePost, reportPost } from '../../redux/slices/postSlice';

const Post = ({ post }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { isDark } = useTheme();
  
  const [liked, setLiked] = useState(post?.isLiked || false);
  const [saved, setSaved] = useState(post?.isSaved || false);
  const [likes, setLikes] = useState(post?.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post?.comments || []);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const dropdownRef = useRef(null);
  const shareModalRef = useRef(null);
  
  // Close dropdown and share modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (shareModalRef.current && !shareModalRef.current.contains(event.target)) {
        setShowShareModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Early return if post is not provided or invalid - AFTER hooks
  if (!post || !post.author || !post._id) {
    console.warn('[Post] Invalid post data provided:', post);
    return null;
  }
  
  // Determine if this is a video or photo post
  const hasImages = post.images && post.images.length > 0;
  const hasVideos = post.videos && post.videos.length > 0;

  const handleLike = async () => {
    // Optimistic UI update
    const previousLiked = liked;
    const previousLikes = likes;
    
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const result = await dispatch(likePost(post._id)).unwrap();
      // Ensure state matches server response just in case
      setLiked(result.isLiked);
      setLikes(result.likesCount);
    } catch (error) {
      // Revert on error
      setLiked(previousLiked);
      setLikes(previousLikes);
      console.error('Like error:', error);
      toast.error('Failed to like post');
    }
  };

  // Generate shareable URL
  const getShareableUrl = () => {
    // In production, this would be your actual domain
    const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
    return `${baseUrl}/posts/${post._id}`;
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      const shareUrl = getShareableUrl();
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  // Share via Web Share API or fallback to social media
  const handleNativeShare = async () => {
    const shareUrl = getShareableUrl();
    const shareData = {
      title: post.title,
      text: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        await dispatch(sharePost(post._id)).unwrap();
        toast.success('Post shared successfully');
        setShowShareModal(false);
      } else {
        // Fallback to showing share options
        setShowShareModal(true);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Failed to share post');
      }
    }
  };

  // Share to specific social media platforms
  const shareToSocialMedia = (platform) => {
    const shareUrl = getShareableUrl();
    const shareText = `${post.title} - ${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}`;
    
    let socialUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        socialUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
      case 'facebook':
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }

    window.open(socialUrl, '_blank', 'width=600,height=400');
    
    // Update share count
    dispatch(sharePost(post._id));
    setShowShareModal(false);
    toast.success(`Shared to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deletePost(post._id)).unwrap();
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDropdown(false);
    }
  };

  const handleSave = async () => {
    try {
      const result = await dispatch(savePost(post._id)).unwrap();
      setSaved(result.isSaved);
      toast.success(result.isSaved ? 'Post saved' : 'Post removed from saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save post');
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('Please provide a reason for reporting this post:');
    if (reason === null) return; // User cancelled
    if (reason.trim() === '') {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await dispatch(reportPost({ id: post._id, reason: reason.trim() })).unwrap();
      toast.success('Post reported successfully. Thank you.');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to report post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      const result = await dispatch(addComment({ 
        id: post._id, 
        content: comment.trim() 
      })).unwrap();
      
      // The result is { postId: id, comment: response.data }
      // response.data is the comment object from backend
      const newComment = result.comment;
      setComments([newComment, ...comments]);
      setComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async () => {
    await handleNativeShare();
  };

  const renderMedia = () => {
    if (hasImages && post.images.length > 0) {
      return (
        <div className="relative bg-black">
          {post.images.length === 1 ? (
            <img 
              src={typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url}
              alt={typeof post.images[0] === 'string' ? post.title : (post.images[0].alt || post.title)}
              className="w-full object-contain cursor-pointer max-h-96"
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                e.target.src = '/placeholder-image.svg'; // Fallback image
              }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {post.images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={typeof image === 'string' ? image : image.url}
                    alt={typeof image === 'string' ? `${post.title} ${index + 1}` : (image.alt || `${post.title} ${index + 1}`)}
                    className="w-full h-48 object-cover cursor-pointer"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      e.target.src = '/placeholder-image.svg'; // Fallback image
                    }}
                  />
                  {index === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        +{post.images.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (hasVideos && post.videos.length > 0) {
      return (
        <div className="relative bg-black">
          <video 
            src={typeof post.videos[0] === 'string' ? post.videos[0] : post.videos[0].url}
            className="w-full aspect-video object-contain cursor-pointer"
            preload="metadata"
            autoPlay
            muted
            loop
            onError={(e) => {
              console.error('Video failed to load:', e.target.src);
            }}
          >
            Your browser does not support the video tag.
          </video>
          {post.videos.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
              +{post.videos.length - 1} more
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`rounded-xl shadow-md overflow-hidden mb-4 md:mb-6 transition-all duration-300 hover:shadow-lg ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Post header */}
      <div className={`p-4 flex items-center justify-between border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author._id}`}>
            <img 
              src={post.author.avatar || '/default-avatar.png'} 
              alt={`${post.author.firstName || 'User'} ${post.author.lastName || ''}`} 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-100"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.author._id}`} className={`font-medium transition-colors duration-300 ${
              isDark 
                ? 'text-white hover:text-primary-400' 
                : 'text-gray-900 hover:text-primary-600'
            }`}>
              {post.author.firstName || 'User'} {post.author.lastName || ''}
            </Link>
            {post.sport && (
              <p className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {post.sport.charAt(0).toUpperCase() + post.sport.slice(1)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {getRelativeTime(post.createdAt)}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {post.privacy.charAt(0).toUpperCase() + post.privacy.slice(1)}
          </span>
          
          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`transition-colors duration-300 ${
                isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FaEllipsisH />
            </button>
            
            {showDropdown && (
              <div className={`absolute right-0 top-8 w-48 rounded-lg shadow-lg border z-10 transition-colors duration-300 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="py-1">
                  {/* Show edit/delete only for post owner */}
                  {user && post.author._id === user.id && (
                    <>
                      <button
                        className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors duration-300 ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={async () => {
                          setShowDropdown(false);
                          const newContent = window.prompt('Edit your post content:', post.content);
                          if (newContent !== null && newContent.trim() !== '') {
                            try {
                              const { updatePost } = await import('../../redux/slices/postSlice');
                              await dispatch(updatePost({ id: post._id, postData: { content: newContent.trim() } })).unwrap();
                              toast.success('Post updated successfully');
                            } catch (error) {
                              toast.error('Failed to update post');
                            }
                          }
                        }}
                      >
                        <FaEdit />
                        <span>Edit Post</span>
                      </button>
                      <button
                        className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors duration-300 ${
                          isDark 
                            ? 'text-red-400 hover:bg-gray-700' 
                            : 'text-red-600 hover:bg-gray-100'
                        }`}
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        <FaTrash />
                        <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                      </button>
                      <hr className={`my-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                    </>
                  )}
                  
                  {/* Universal options */}
                  <button
                    className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors duration-300 ${
                      isDark 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setShowDropdown(false);
                      setShowShareModal(true);
                    }}
                  >
                    <FaShare />
                    <span>Share Post</span>
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors duration-300 ${
                      isDark 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setShowDropdown(false);
                      handleReport();
                    }}
                  >
                    <span>🚩</span>
                    <span>Report Post</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <div className="px-4 pt-4">
          <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {post.title}
          </h3>
        </div>
      )}

      {/* Post Content */}
      {post.content && (
        <div className="px-4 pb-4">
          <div className={`transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {showFullContent || post.content.length <= 150 ? (
              <p>{post.content}</p>
            ) : (
              <p>
                {post.content.substring(0, 150)}...
                <button 
                  onClick={() => setShowFullContent(true)}
                  className={`ml-1 font-medium transition-colors duration-300 ${
                    isDark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
                  }`}
                >
                  Read more
                </button>
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Media Content */}
      {renderMedia()}
      
      {/* Post actions */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex justify-between mb-3">
          <div className="flex space-x-4">
            <button 
              className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-700'}`}
              onClick={handleLike}
            >
              {liked ? <FaHeart className="w-6 h-6" /> : <FaRegHeart className="w-6 h-6" />}
            </button>
            <button 
              className={`flex items-center space-x-1 transition-colors duration-300 ${
                showComments 
                  ? isDark 
                    ? 'text-primary-400' 
                    : 'text-primary-600'
                  : isDark 
                    ? 'text-gray-300 hover:text-gray-100' 
                    : 'text-gray-700 hover:text-gray-900'
              }`}
              onClick={() => setShowComments(!showComments)}
            >
              <FaComment className="w-6 h-6" />
            </button>
            <button 
              className={`flex items-center space-x-1 transition-colors duration-300 ${
                isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'
              }`}
              onClick={handleShare}
            >
              <FaShare className="w-6 h-6" />
            </button>
          </div>
          <button 
            className={`transition-colors duration-300 ${
              saved 
                ? 'text-primary-600' 
                : isDark 
                  ? 'text-gray-300 hover:text-gray-100' 
                  : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={handleSave}
          >
            {saved ? <FaBookmark className="w-6 h-6" /> : <FaRegBookmark className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Likes count */}
        <p className={`font-medium mb-1 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>{likes} likes</p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.map((tag, index) => (
              <Link 
                key={index} 
                to={`/posts/tags/${tag}`} 
                className={`text-sm hover:underline transition-colors duration-300 ${
                  isDark ? 'text-primary-400' : 'text-primary-600'
                }`}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Post time */}
        <p className={`text-xs transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {getRelativeTime(post.createdAt)}
        </p>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className={`p-4 border-b transition-colors duration-300 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h4 className={`font-medium mb-3 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Comments</h4>
          
          {/* Comment form */}
          <form onSubmit={handleComment} className="flex mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className={`flex-grow border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button 
              type="submit" 
              className="bg-primary-600 text-white px-4 py-2 rounded-r-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={!comment.trim()}
            >
              Post
            </button>
          </form>
          
          {/* Comments list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment._id} className="flex space-x-2">
                  <Link to={`/profile/${comment.user._id}`}>
                    <img 
                      src={comment.user.avatar || '/default-avatar.png'} 
                      alt={`${comment.user.firstName} ${comment.user.lastName}`} 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  </Link>
                  <div>
                    <div className={`px-3 py-2 rounded-lg transition-colors duration-300 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Link to={`/profile/${comment.user._id}`} className={`font-medium text-sm mr-1 transition-colors duration-300 ${
                        isDark 
                          ? 'text-white hover:text-primary-400' 
                          : 'text-gray-900 hover:text-primary-600'
                      }`}>
                        {comment.user.firstName} {comment.user.lastName}
                      </Link>
                      <span className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>{comment.content}</span>
                    </div>
                    <div className={`flex items-center mt-1 space-x-3 text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span>{getRelativeTime(comment.createdAt)}</span>
                      <button className={`transition-colors duration-300 ${
                        isDark ? 'hover:text-gray-200' : 'hover:text-gray-700'
                      }`}>Like</button>
                      <button className={`transition-colors duration-300 ${
                        isDark ? 'hover:text-gray-200' : 'hover:text-gray-700'
                      }`}>Reply</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-center py-2 transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>No comments yet. Be the first to comment!</p>
            )}
          </div>
          
          {comments.length > 3 && (
            <Link to={`/posts/${post._id}`} className={`block text-center mt-3 hover:underline transition-colors duration-300 ${
              isDark ? 'text-primary-400' : 'text-primary-600'
            }`}>
              View all {comments.length} comments
            </Link>
          )}
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={shareModalRef}
            className={`rounded-xl shadow-2xl max-w-md w-full mx-4 transition-colors duration-300 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className={`px-4 md:px-6 py-4 border-b transition-colors duration-300 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Share Post
              </h3>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              {/* Copy Link Option */}
              <button
                onClick={copyToClipboard}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <FaCopy className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Copy Link</div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Copy post link to clipboard
                  </div>
                </div>
              </button>

              {/* Native Share (if supported) */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-300 ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <FaShare className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Share via Apps</div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Use your device's share menu
                    </div>
                  </div>
                </button>
              )}

              {/* Social Media Options */}
              <div className="space-y-2">
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Share to social media
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => shareToSocialMedia('whatsapp')}
                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <FaWhatsapp className="text-green-500" />
                    <span className="text-sm">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => shareToSocialMedia('facebook')}
                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <FaFacebook className="text-blue-600" />
                    <span className="text-sm">Facebook</span>
                  </button>

                  <button
                    onClick={() => shareToSocialMedia('twitter')}
                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <FaTwitter className="text-blue-400" />
                    <span className="text-sm">Twitter</span>
                  </button>

                  <button
                    onClick={() => shareToSocialMedia('linkedin')}
                    className={`flex items-center space-x-2 p-3 rounded-lg transition-colors duration-300 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <FaLinkedin className="text-blue-700" />
                    <span className="text-sm">LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`px-4 md:px-6 py-4 border-t transition-colors duration-300 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowShareModal(false)}
                className={`w-full py-2 px-4 rounded-lg transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;

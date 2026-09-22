import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaEllipsisH } from 'react-icons/fa';
import { formatDate, getRelativeTime } from '../../utils/helpers';

const VideoPost = ({ post }) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [saved, setSaved] = useState(post.saved || false);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setLiked(!liked);
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (comment.trim() === '') return;
    
    const newComment = {
      id: Date.now(),
      user: {
        id: 'current-user',
        name: 'You',
        avatar: '/assets/avatars/default.jpg'
      },
      text: comment,
      timestamp: new Date().toISOString()
    };
    
    setComments([newComment, ...comments]);
    setComment('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 md:mb-6 transition-all duration-300 hover:shadow-lg">
      {/* Post header */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.user.id}`}>
            <img 
              src={post.user.avatar} 
              alt={post.user.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-100"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.user.id}`} className="font-medium text-gray-900 hover:text-primary-600">
              {post.user.name}
            </Link>
            {post.location && (
              <p className="text-xs text-gray-500">{post.location}</p>
            )}
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <FaEllipsisH />
        </button>
      </div>
      
      {/* Video content */}
      <div className="relative bg-black aspect-video">
        <Link to={`/videos/${post.id}`}>
          <video 
            src={post.videoUrl} 
            poster={post.thumbnailUrl}
            className="w-full h-full object-contain cursor-pointer"
            controls
            preload="none"
          >
            Your browser does not support the video tag.
          </video>
        </Link>
      </div>
      
      {/* Post actions */}
      <div className="p-4 border-b">
        <div className="flex justify-between mb-3">
          <div className="flex space-x-4">
            <button 
              className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-gray-700'}`}
              onClick={handleLike}
            >
              {liked ? <FaHeart className="w-6 h-6" /> : <FaRegHeart className="w-6 h-6" />}
            </button>
            <button 
              className="flex items-center space-x-1 text-gray-700"
              onClick={() => setShowComments(!showComments)}
            >
              <FaComment className="w-6 h-6" />
            </button>
            <button className="flex items-center space-x-1 text-gray-700">
              <FaShare className="w-6 h-6" />
            </button>
          </div>
          <button 
            className={saved ? 'text-primary-600' : 'text-gray-700'}
            onClick={handleSave}
          >
            {saved ? <FaBookmark className="w-6 h-6" /> : <FaRegBookmark className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Likes count */}
        <p className="font-medium text-gray-900 mb-1">{likes} likes</p>
        
        {/* Post caption */}
        <div className="mb-2">
          <Link to={`/profile/${post.user.id}`} className="font-medium text-gray-900 mr-2">
            {post.user.name}
          </Link>
          <span className="text-gray-700">{post.caption}</span>
        </div>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.map(tag => (
              <Link 
                key={tag} 
                to={`/videos/tags/${tag}`} 
                className="text-primary-600 text-sm hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Post time */}
        <p className="text-xs text-gray-500">
          {getRelativeTime(post.timestamp)}
        </p>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className="p-4 border-b">
          <h4 className="font-medium text-gray-900 mb-3">Comments</h4>
          
          {/* Comment form */}
          <form onSubmit={handleComment} className="flex mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-grow border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button 
              type="submit" 
              className="bg-primary-600 text-white px-4 py-2 rounded-r-lg hover:bg-primary-700 transition-colors"
              disabled={!comment.trim()}
            >
              Post
            </button>
          </form>
          
          {/* Comments list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.id} className="flex space-x-2">
                  <Link to={`/profile/${comment.user.id}`}>
                    <img 
                      src={comment.user.avatar} 
                      alt={comment.user.name} 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  </Link>
                  <div>
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <Link to={`/profile/${comment.user.id}`} className="font-medium text-gray-900 text-sm mr-1">
                        {comment.user.name}
                      </Link>
                      <span className="text-gray-700 text-sm">{comment.text}</span>
                    </div>
                    <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                      <span>{getRelativeTime(comment.timestamp)}</span>
                      <button className="hover:text-gray-700">Like</button>
                      <button className="hover:text-gray-700">Reply</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
          
          {comments.length > 3 && (
            <Link to={`/videos/${post.id}`} className="block text-center text-primary-600 mt-3 hover:underline">
              View all {comments.length} comments
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPost;

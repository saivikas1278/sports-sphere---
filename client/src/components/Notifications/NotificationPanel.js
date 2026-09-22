import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCircle2, 
  X, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Trophy, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import moment from 'moment';
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  selectNotifications, 
  selectUnreadCount,
  selectNotificationsLoading
} from '../../redux/slices/notificationSlice';
import LoadingSpinner from '../UI/LoadingSpinner';

const NotificationPanel = ({ onClose }) => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications) || [];
  const unreadCount = useSelector(selectUnreadCount) || 0;
  const loading = useSelector(selectNotificationsLoading);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 20 }));
  }, [dispatch]);

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500" />;
      case 'comment':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={16} className="text-green-500" />;
      case 'team_invite':
        return <UserPlus size={16} className="text-purple-500" />;
      case 'tournament_update':
      case 'match_update':
        return <Calendar size={16} className="text-orange-500" />;
      case 'achievement':
        return <Trophy size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-slate-500" />;
    }
  };

  const getNotificationColor = (isRead) => {
    return isRead ? 'bg-white' : 'bg-blue-50/50';
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgb(0,0,255,0.12)] border border-white/60 z-50 overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Mark all as read"
            >
              <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-hide">
        {loading && notifications.length === 0 ? (
          <div className="py-4 md:py-6 md:py-10 flex justify-center">
            <LoadingSpinner size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-4 md:py-6 md:py-10 flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Bell size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No notifications yet</p>
            <p className="text-sm text-slate-400">When you get notifications, they'll show up here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`relative group p-3 rounded-2xl transition-all hover:bg-slate-50 flex items-start space-x-3 cursor-pointer ${getNotificationColor(notification.isRead)}`}
              onClick={() => {
                if (!notification.isRead) handleMarkAsRead(notification._id);
                // Action URL navigation would happen here if we wrap it in a Link, but some might just need to mark as read
              }}
            >
              {/* Unread indicator dot */}
              {!notification.isRead && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
              
              {/* Icon / Avatar */}
              <div className="flex-shrink-0 relative">
                {notification.sender?.avatar ? (
                  <img
                    src={notification.sender.avatar}
                    alt={notification.sender.firstName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}
                {notification.sender?.avatar && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 font-medium line-clamp-2">
                  {notification.message || notification.title}
                </p>
                <span className="text-xs text-slate-400 mt-1 block">
                  {moment(notification.createdAt).fromNow()}
                </span>
              </div>

              {/* Action Link (if exists) */}
              {notification.data?.actionUrl && (
                <Link
                  to={notification.data.actionUrl}
                  className="absolute inset-0 z-10"
                  onClick={(e) => {
                    if (!notification.isRead) handleMarkAsRead(notification._id);
                    onClose && onClose();
                  }}
                  aria-label="View notification details"
                />
              )}

              {/* Mark as read button (visible on hover) */}
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notification._id);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white shadow-sm rounded-full text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-blue-50 hover:scale-110"
                  title="Mark as read"
                >
                  <Check size={14} strokeWidth={3} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
          <Link
            to="/notifications"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

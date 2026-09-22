import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// Create notification
export const createNotification = async (notificationData, io) => {
  try {
    // Create notification
    const notification = new Notification(notificationData);
    await notification.save();
    
    // Populate sender and recipient
    await notification.populate('sender', 'firstName lastName avatar');
    await notification.populate('recipient', 'firstName lastName email');

    // Get recipient's profile to check email preferences
    const recipientProfile = await Profile.findOne({ user: notification.recipient._id });
    
    // Send real-time notification via socket
    if (io) {
      io.to(`user_${notification.recipient._id}`).emit('notification', notification);
    }

    // Email notifications have been disabled
    // We only send socket notifications now

    return notification;
  } catch (error) {
    console.error('Error creating notification with email:', error);
    throw error;
  }
};

// Check if email should be sent based on user preferences
const checkEmailPreference = (notificationType, emailPreferences) => {
  if (!emailPreferences) return true; // Default to true if no preferences set
  
  const typeMapping = {
    'like': 'likes',
    'comment': 'comments',
    'follow': 'follows',
    'team_invite': 'teamInvites',
    'tournament_update': 'tournamentUpdates',
    'match_update': 'matchUpdates'
  };
  
  const prefKey = typeMapping[notificationType];
  return prefKey ? emailPreferences[prefKey] : true;
};

// Bulk notification functions
export const createBulkNotifications = async (notifications, io) => {
  try {
    const results = await Promise.allSettled(
      notifications.map(notificationData => 
        createNotification(notificationData, io)
      )
    );
    
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');
    
    console.log(`Bulk notifications: ${successful.length} successful, ${failed.length} failed`);
    
    return {
      successful: successful.map(result => result.value),
      failed: failed.map(result => result.reason),
      total: notifications.length
    };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Notification types and templates
export const NotificationTypes = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  TEAM_INVITE: 'team_invite',
  TOURNAMENT_UPDATE: 'tournament_update',
  MATCH_UPDATE: 'match_update',
  ACHIEVEMENT: 'achievement',
  SYSTEM: 'system'
};

// Helper functions for common notifications
export const createLikeNotification = async (postAuthorId, likerId, postId, io) => {
  const liker = await User.findById(likerId).select('firstName lastName');
  
  return createNotification({
    recipient: postAuthorId,
    sender: likerId,
    type: NotificationTypes.LIKE,
    title: 'New Like',
    message: `${liker.firstName} ${liker.lastName} liked your post`,
    data: {
      postId,
      actionUrl: `/posts/${postId}`
    }
  }, io);
};

export const createCommentNotification = async (postAuthorId, commenterId, postId, io) => {
  const commenter = await User.findById(commenterId).select('firstName lastName');
  
  return createNotification({
    recipient: postAuthorId,
    sender: commenterId,
    type: NotificationTypes.COMMENT,
    title: 'New Comment',
    message: `${commenter.firstName} ${commenter.lastName} commented on your post`,
    data: {
      postId,
      actionUrl: `/posts/${postId}`
    }
  }, io);
};

export const createFollowNotification = async (userId, followerId, io) => {
  const follower = await User.findById(followerId).select('firstName lastName');
  
  return createNotification({
    recipient: userId,
    sender: followerId,
    type: NotificationTypes.FOLLOW,
    title: 'New Follower',
    message: `${follower.firstName} ${follower.lastName} started following you`,
    data: {
      actionUrl: `/profile/${followerId}`
    }
  }, io);
};

export const createTeamInviteNotification = async (userId, inviterId, teamId, teamName, io) => {
  const inviter = await User.findById(inviterId).select('firstName lastName');
  
  return createNotification({
    recipient: userId,
    sender: inviterId,
    type: NotificationTypes.TEAM_INVITE,
    title: 'Team Invitation',
    message: `${inviter.firstName} ${inviter.lastName} invited you to join ${teamName}`,
    data: {
      teamId,
      actionUrl: `/teams/${teamId}`
    }
  }, io);
};

export const createTournamentNotification = async (userIds, tournamentId, title, message, io) => {
  const notifications = userIds.map(userId => ({
    recipient: userId,
    type: NotificationTypes.TOURNAMENT_UPDATE,
    title,
    message,
    data: {
      tournamentId,
      actionUrl: `/tournaments/${tournamentId}`
    }
  }));
  
  return createBulkNotifications(notifications, io);
};

export const createAchievementNotification = async (userId, achievementTitle, achievementDescription, io) => {
  return createNotification({
    recipient: userId,
    type: NotificationTypes.ACHIEVEMENT,
    title: 'Achievement Unlocked!',
    message: `Congratulations! You've earned "${achievementTitle}": ${achievementDescription}`,
    data: {
      achievementTitle,
      actionUrl: '/profile/achievements'
    }
  }, io);
};

const notificationUtils = {
  createNotification,
  createBulkNotifications,
  createLikeNotification,
  createCommentNotification,
  createFollowNotification,
  createTeamInviteNotification,
  createTournamentNotification,
  createAchievementNotification,
  NotificationTypes
};

export default notificationUtils;

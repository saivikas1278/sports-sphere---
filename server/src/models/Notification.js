import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'like', 'comment', 'follow', 'unfollow',
      'team_join', 'team_leave', 'team_invite',
      'tournament_join', 'tournament_registration', 'tournament_start', 'tournament_started', 'tournament_end',
      'match_start', 'match_end', 'match_score_update',
      'achievement', 'post_mention', 'system', 'tournament_broadcast', 'broadcast'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    url: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isClicked: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });

// Methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

notificationSchema.methods.markAsClicked = function() {
  this.isClicked = true;
  if (!this.isRead) {
    this.isRead = true;
  }
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

export default mongoose.model('Notification', notificationSchema);

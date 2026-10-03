import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Conversation'
  },
  roomType: {
    type: String,
    enum: ['team', 'tournament', 'direct']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true,
    required: function() { return !this.media; }
  },
  media: {
    type: String, // URL to image/video
  },
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ roomType: 1, roomId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);

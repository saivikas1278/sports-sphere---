import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }],
  // For group chats
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true,
    required: function() { return this.isGroup; }
  },
  groupAdmin: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  // To fetch latest message quickly
  lastMessage: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

export default mongoose.model('Conversation', conversationSchema);

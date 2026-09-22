import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  content: {
    type: String,
    required: true,
    maxLength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'achievement', 'workout'],
    default: 'text'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: String,
    publicId: String,
    alt: String
  }],
  videos: [{
    url: String,
    publicId: String,
    thumbnail: String,
    duration: Number
  }],
  tags: [{
    type: String,
    trim: true
  }],
  sport: {
    type: String,
    enum: ['football', 'cricket', 'basketball', 'volleyball', 'badminton', 'kabaddi', 'tennis', 'hockey', 'general']
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxLength: 500
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxLength: 300
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  metadata: {
    device: String,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      },
      address: String
    },
    weather: {
      temperature: Number,
      condition: String,
      humidity: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ sport: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Virtuals
postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

postSchema.virtual('isLikedByUser').get(function() {
  return false; // This will be set during population
});

// Methods
postSchema.methods.like = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (existingLike) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
    return false;
  } else {
    this.likes.push({ user: userId });
    return true;
  }
};

postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.comments[this.comments.length - 1];
};

postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static methods
postSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId }).populate('author', 'firstName lastName avatar');
};

postSchema.statics.findBySport = function(sport) {
  return this.find({ sport }).populate('author', 'firstName lastName avatar');
};

postSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true }).populate('author', 'firstName lastName avatar');
};

export default mongoose.model('Post', postSchema);

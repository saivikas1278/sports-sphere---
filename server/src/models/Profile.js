import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxLength: 500
  },
  dateOfBirth: Date,
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String,
    linkedin: String,
    youtube: String,
    website: String
  },
  preferences: {
    sports: [{
      sport: {
        type: String,
        enum: ['football', 'cricket', 'basketball', 'volleyball', 'badminton', 'kabaddi', 'tennis', 'hockey']
      },
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'professional']
      },
      position: String,
      yearsOfExperience: Number
    }],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      types: {
        likes: {
          type: Boolean,
          default: true
        },
        comments: {
          type: Boolean,
          default: true
        },
        follows: {
          type: Boolean,
          default: true
        },
        teamInvites: {
          type: Boolean,
          default: true
        },
        tournamentUpdates: {
          type: Boolean,
          default: true
        },
        matchUpdates: {
          type: Boolean,
          default: true
        }
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      },
      showLocation: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  achievements: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    icon: String,
    category: {
      type: String,
      enum: ['tournament', 'match', 'fitness', 'social', 'milestone'],
      required: true
    },
    points: {
      type: Number,
      default: 0
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  statistics: {
    totalMatches: {
      type: Number,
      default: 0
    },
    totalWins: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    },
    totalDraws: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    totalTournaments: {
      type: Number,
      default: 0
    },
    totalTeams: {
      type: Number,
      default: 0
    },
    totalPosts: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalFollowers: {
      type: Number,
      default: 0
    },
    totalFollowing: {
      type: Number,
      default: 0
    },
    sportStats: [{
      sport: String,
      matches: Number,
      wins: Number,
      losses: Number,
      draws: Number,
      goals: Number,
      assists: Number,
      points: Number
    }]
  },
  following: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: String,
    enum: ['blue', 'gold', 'diamond'],
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
profileSchema.index({ 'statistics.totalPoints': -1 });
profileSchema.index({ 'preferences.sports.sport': 1 });

// Virtuals
profileSchema.virtual('winRate').get(function() {
  const totalGames = this.statistics.totalMatches;
  return totalGames > 0 ? (this.statistics.totalWins / totalGames * 100).toFixed(1) : 0;
});

profileSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

profileSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Methods
profileSchema.methods.follow = function(userId) {
  const existingFollow = this.followers.find(f => f.user.toString() === userId.toString());
  if (!existingFollow) {
    this.followers.push({ user: userId });
    this.statistics.totalFollowers += 1;
    return true;
  }
  return false;
};

profileSchema.methods.unfollow = function(userId) {
  const existingFollow = this.followers.find(f => f.user.toString() === userId.toString());
  if (existingFollow) {
    this.followers = this.followers.filter(f => f.user.toString() !== userId.toString());
    this.statistics.totalFollowers -= 1;
    return true;
  }
  return false;
};

profileSchema.methods.addAchievement = function(achievement) {
  this.achievements.push(achievement);
  this.statistics.totalPoints += achievement.points || 0;
  return this.save();
};

profileSchema.methods.updateStatistics = function(updates) {
  Object.keys(updates).forEach(key => {
    if (this.statistics[key] !== undefined) {
      this.statistics[key] = updates[key];
    }
  });
  return this.save();
};

// Static methods
profileSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId }).populate('user', 'firstName lastName email avatar');
};

profileSchema.statics.getLeaderboard = function(sport = null) {
  const match = sport ? { 'preferences.sports.sport': sport } : {};
  return this.find(match)
    .sort({ 'statistics.totalPoints': -1 })
    .limit(50)
    .populate('user', 'firstName lastName avatar');
};

export default mongoose.model('Profile', profileSchema);

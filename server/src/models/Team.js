import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: [10, 'Short name cannot exceed 10 characters']
  },
  contactPhone: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['captain', 'player', 'substitute', 'coach'] },
    jerseyNumber: Number,
    position: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  invitations: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['captain', 'player', 'substitute', 'coach'], default: 'player' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    invitedAt: { type: Date, default: Date.now },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['football', 'basketball', 'cricket', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'chess', 'other']
  },
  homeVenue: {
    name: String,
    address: String,
    city: String,
    state: String
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  founded: {
    type: Date
  },
  colors: {
    primary: String,
    secondary: String
  },
  social: {
    website: String,
    facebook: String,
    twitter: String,
    instagram: String
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    matchesLost: { type: Number, default: 0 },
    matchesDrawn: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  },
  registrationDetails: {
    registeredAt: { type: Date, default: Date.now },
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentId: String,
    documents: [{
      type: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for team size
teamSchema.virtual('teamSize').get(function() {
  return this.players.length;
});

// Virtual for win percentage
teamSchema.virtual('winPercentage').get(function() {
  if (this.stats.matchesPlayed === 0) return 0;
  return ((this.stats.matchesWon / this.stats.matchesPlayed) * 100).toFixed(2);
});

// Virtual for goal difference
teamSchema.virtual('goalDifference').get(function() {
  return this.stats.goalsFor - this.stats.goalsAgainst;
});

// Method to add player
teamSchema.methods.addPlayer = function(userId, role = 'player', jerseyNumber = null, position = null) {
  const existingPlayer = this.players.find(p => p.user.toString() === userId.toString());
  if (existingPlayer) {
    throw new Error('Player already exists in team');
  }
  
  this.players.push({
    user: userId,
    role,
    jerseyNumber,
    position
  });
  
  return this.save();
};

// Method to remove player
teamSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Method to update stats after match
teamSchema.methods.updateStats = function(matchResult) {
  this.stats.matchesPlayed += 1;
  
  if (matchResult.result === 'win') {
    this.stats.matchesWon += 1;
    this.stats.points += 3;
  } else if (matchResult.result === 'loss') {
    this.stats.matchesLost += 1;
  } else if (matchResult.result === 'draw') {
    this.stats.matchesDrawn += 1;
    this.stats.points += 1;
  }
  
  if (matchResult.goalsFor !== undefined) {
    this.stats.goalsFor += matchResult.goalsFor;
  }
  if (matchResult.goalsAgainst !== undefined) {
    this.stats.goalsAgainst += matchResult.goalsAgainst;
  }
  
  return this.save();
};

// Indexes
teamSchema.index({ tournament: 1, name: 1 }, { unique: true });
teamSchema.index({ captain: 1 });
teamSchema.index({ sport: 1 });
teamSchema.index({ 'registrationDetails.registrationStatus': 1 });

export default mongoose.model('Team', teamSchema);

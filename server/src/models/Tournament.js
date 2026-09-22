import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: [100, 'Tournament name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: ['football', 'basketball', 'cricket', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'chess', 'other']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    required: [true, 'Tournament format is required'],
    enum: ['single-elimination', 'double-elimination', 'round-robin', 'swiss', 'league']
  },
  maxTeams: {
    type: Number,
    required: [true, 'Maximum teams is required'],
    min: [2, 'At least 2 teams required'],
    max: [64, 'Maximum 64 teams allowed']
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Registration fee cannot be negative']
  },
  prizePool: {
    total: { type: Number, default: 0 },
    distribution: [{
      position: Number,
      amount: Number,
      percentage: Number
    }]
  },
  venue: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    }
  },
  dates: {
    registrationStart: {
      type: Date,
      required: [true, 'Registration start date is required']
    },
    registrationEnd: {
      type: Date,
      required: [true, 'Registration end date is required']
    },
    tournamentStart: {
      type: Date,
      required: [true, 'Tournament start date is required']
    },
    tournamentEnd: {
      type: Date,
      required: [true, 'Tournament end date is required']
    }
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  rules: {
    type: String,
    maxlength: [2000, 'Rules cannot exceed 2000 characters']
  },
  eligibility: {
    ageLimit: {
      min: Number,
      max: Number
    },
    genderRestriction: {
      type: String,
      enum: ['none', 'male', 'female', 'mixed']
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional', 'all']
    }
  },
  logo: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  registeredTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  brackets: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  standings: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    position: Number,
    points: Number,
    played: Number,
    won: Number,
    lost: Number,
    drawn: Number,
    goalsFor: Number,
    goalsAgainst: Number,
    goalDifference: Number
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String,
    tier: { type: String, enum: ['title', 'platinum', 'gold', 'silver', 'bronze'] }
  }],
  livestream: {
    isEnabled: { type: Boolean, default: false },
    url: String,
    platform: String
  },
  settings: {
    allowLateRegistration: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    maxPlayersPerTeam: { type: Number, default: 11 },
    minPlayersPerTeam: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

// Validate dates
tournamentSchema.pre('save', function(next) {
  console.log('[TOURNAMENT MODEL] Validating dates:', {
    registrationStart: this.dates.registrationStart,
    registrationEnd: this.dates.registrationEnd,
    tournamentStart: this.dates.tournamentStart,
    tournamentEnd: this.dates.tournamentEnd
  });
  
  if (this.dates.registrationStart >= this.dates.registrationEnd) {
    return next(new Error('Registration start date must be before end date'));
  }
  
  // Allow registration to end on or before tournament starts (more flexible)
  if (this.dates.registrationEnd > this.dates.tournamentStart) {
    return next(new Error('Registration must end on or before tournament starts'));
  }
  
  if (this.dates.tournamentStart >= this.dates.tournamentEnd) {
    return next(new Error('Tournament start date must be before end date'));
  }
  
  console.log('[TOURNAMENT MODEL] Date validation passed');
  next();
});

// Virtual for registration status
tournamentSchema.virtual('registrationStatus').get(function() {
  const now = new Date();
  if (now < this.dates.registrationStart) return 'upcoming';
  if (now <= this.dates.registrationEnd) return 'open';
  return 'closed';
});

// Virtual for spots remaining
tournamentSchema.virtual('spotsRemaining').get(function() {
  return this.maxTeams - this.registeredTeams.length;
});

// Indexes
tournamentSchema.index({ sport: 1, status: 1 });
tournamentSchema.index({ organizer: 1 });
tournamentSchema.index({ 'dates.registrationStart': 1, 'dates.registrationEnd': 1 });
tournamentSchema.index({ 'venue.city': 1, 'venue.state': 1 });
tournamentSchema.index({ visibility: 1, status: 1 });

export default mongoose.model('Tournament', tournamentSchema);

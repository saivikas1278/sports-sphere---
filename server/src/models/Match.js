import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  round: {
    type: mongoose.Schema.Types.Mixed, // integer round number (1, 2...) or string label
    required: true
  },
  roundName: {
    type: String
  },
  position: {
    type: Number,
    default: 0
  },
  nextMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  nextSlot: {
    type: String,
    enum: ['teamA', 'teamB', null],
    default: null
  },
  loserMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  loserSlot: {
    type: String,
    enum: ['teamA', 'teamB', null],
    default: null
  },
  bracketType: {
    type: String,
    enum: ['winners', 'losers', 'finals', null],
    default: null
  },
  matchNumber: {
    type: Number,
    required: true
  },
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false,
    default: null
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false,
    default: null
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  venue: {
    name: String,
    address: String,
    city: String,
    state: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  sport: {
    type: String,
    lowercase: true,
    trim: true
  },
  sportType: {
    type: String,
    enum: ['standard', 'cricket', 'points'],
    default: 'standard'
  },
  cricketData: {
    innings: [{
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 }
    }],
    currentBatting: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    striker: String,
    nonStriker: String,
    currentBowler: String,
    recentBalls: [String],
    currentInningIndex: { type: Number, default: 0 },
    maxOvers: { type: Number, default: 20 },
    maxWickets: { type: Number, default: 10 },
    target: { type: Number, default: null },
    resultText: { type: String, default: null },
    ballHistory: [mongoose.Schema.Types.Mixed]
  },
  setsData: {
    sets: [{ 
      setNumber: { type: Number, default: 1 },
      homeScore: { type: Number, default: 0 }, 
      awayScore: { type: Number, default: 0 },
      isCompleted: { type: Boolean, default: false },
      winner: { type: String, default: null }
    }],
    currentSet: { type: Number, default: 1 },
    homeSetsWon: { type: Number, default: 0 },
    awaySetsWon: { type: Number, default: 0 },
    sport: { type: String, default: 'badminton' },
    config: mongoose.Schema.Types.Mixed,
    isCompleted: { type: Boolean, default: false },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    resultText: { type: String, default: null },
    pointHistory: [mongoose.Schema.Types.Mixed]
  },
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  detailedScore: {
    sets: [{ // For sports like tennis, volleyball
      home: Number,
      away: Number
    }],
    overs: [{ // For cricket
      over: Number,
      runs: Number,
      wickets: Number,
      team: { type: String, enum: ['home', 'away'] }
    }],
    quarters: [{ // For basketball
      quarter: Number,
      home: Number,
      away: Number
    }],
    halves: [{ // For football
      half: Number,
      home: Number,
      away: Number
    }]
  },
  events: [{
    type: { type: String, enum: ['goal', 'card', 'substitution', 'timeout', 'injury', 'other'] },
    team: { type: String, enum: ['home', 'away'] },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    minute: Number,
    description: String,
    timestamp: { type: Date, default: Date.now }
  }],
  statistics: {
    home: {
      possession: Number,
      shots: Number,
      shotsOnTarget: Number,
      corners: Number,
      fouls: Number,
      cards: { yellow: Number, red: Number },
      substitutions: Number
    },
    away: {
      possession: Number,
      shots: Number,
      shotsOnTarget: Number,
      corners: Number,
      fouls: Number,
      cards: { yellow: Number, red: Number },
      substitutions: Number
    }
  },
  playerStats: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: String, enum: ['home', 'away'] },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 10 }
  }],
  result: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    winType: { type: String, enum: ['regular', 'overtime', 'penalty', 'walkover'] },
    details: { type: String, default: null },
    isDraw: { type: Boolean, default: false }
  },
  referee: {
    main: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assistants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  scorer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number
  },
  attendance: {
    type: Number,
    min: 0
  },
  broadcast: {
    isLive: { type: Boolean, default: false },
    streamUrl: String,
    platform: String,
    viewers: { type: Number, default: 0 }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  actualStartTime: Date,
  actualEndTime: Date
}, {
  timestamps: true
});

// Virtual for match duration
matchSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for total goals
matchSchema.virtual('totalGoals').get(function() {
  return this.score.home + this.score.away;
});

// Method to add event
matchSchema.methods.addEvent = function(eventData) {
  this.events.push(eventData);
  
  // Update score if it's a goal
  if (eventData.type === 'goal') {
    if (eventData.team === 'home') {
      this.score.home += 1;
    } else {
      this.score.away += 1;
    }
  }
  
  return this.save();
};

// Method to update score
matchSchema.methods.updateScore = function(homeScore, awayScore) {
  this.score.home = homeScore;
  this.score.away = awayScore;
  
  // Determine winner
  if (homeScore > awayScore) {
    this.result.winner = this.homeTeam;
    this.result.isDraw = false;
  } else if (awayScore > homeScore) {
    this.result.winner = this.awayTeam;
    this.result.isDraw = false;
  } else {
    this.result.winner = null;
    this.result.isDraw = true;
  }
  
  return this.save();
};

// Method to start match
matchSchema.methods.startMatch = function() {
  this.status = 'live';
  this.actualStartTime = new Date();
  return this.save();
};

// Method to end match
matchSchema.methods.endMatch = function() {
  this.status = 'completed';
  this.actualEndTime = new Date();
  return this.save();
};

// Indexes
matchSchema.index({ tournament: 1, round: 1 });
matchSchema.index({ homeTeam: 1, awayTeam: 1 });
matchSchema.index({ scheduledTime: 1 });
matchSchema.index({ status: 1 });

export default mongoose.model('Match', matchSchema);

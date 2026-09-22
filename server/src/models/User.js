import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not OAuth user
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['player', 'organizer', 'fan', 'admin'],
    default: 'player'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  sports: [{
    name: String,
    position: String,
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional']
    }
  }],
  location: {
    city: String,
    state: String,
    country: String
  },
  dateOfBirth: {
    type: Date
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      showStats: { type: Boolean, default: true }
    }
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    tournamentsParticipated: { type: Number, default: 0 },
    tournamentsWon: { type: Number, default: 0 }
  },
  currentTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  teams: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    status: { type: String, enum: ['active', 'inactive', 'left'], default: 'active' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date }
  }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('[USER MODEL] comparePassword called');
  console.log('[USER MODEL] Has stored password:', !!this.password);
  console.log('[USER MODEL] Candidate password provided:', !!candidatePassword);
  console.log('[USER MODEL] Stored password length:', this.password ? this.password.length : 0);
  console.log('[USER MODEL] Candidate password length:', candidatePassword ? candidatePassword.length : 0);
  
  if (!this.password) {
    console.log('[USER MODEL] No stored password, returning false');
    return false;
  }
  
  if (!candidatePassword) {
    console.log('[USER MODEL] No candidate password provided, returning false');
    return false;
  }
  
  try {
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('[USER MODEL] bcrypt.compare result:', result);
    return result;
  } catch (error) {
    console.error('[USER MODEL] Error comparing passwords:', error);
    return false;
  }
};

// Get full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.googleId;
  return userObject;
};

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ 'location.city': 1, 'location.state': 1 });

export default mongoose.model('User', userSchema);

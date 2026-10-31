import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema({
  platformName: {
    type: String,
    default: 'SportSphere',
    trim: true
  },
  supportEmail: {
    type: String,
    default: 'support@sportsphere.com',
    trim: true,
    lowercase: true
  },
  platformFeePercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  stripeEnabled: {
    type: Boolean,
    default: true
  },
  razorpayEnabled: {
    type: Boolean,
    default: false
  },
  testMode: {
    type: Boolean,
    default: true
  },
  allowUserRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  socketNotifications: {
    type: Boolean,
    default: true
  },
  adminAlerts: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('PlatformSetting', platformSettingSchema);

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    who: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User (who) performing the action is required']
    },
    what: {
      type: String,
      required: [true, 'Action description (what) is required']
    },
    when: {
      type: Date,
      default: Date.now
    },
    target: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Target resource is required']
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ who: 1, when: -1 });
auditLogSchema.index({ 'target.model': 1, 'target.id': 1 });

export default mongoose.model('AuditLog', auditLogSchema);

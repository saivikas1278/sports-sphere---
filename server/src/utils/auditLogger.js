import AuditLog from '../models/AuditLog.js';

/**
 * Persists an administrative action to the AuditLog collection.
 * 
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.who - The user/admin performing the action
 * @param {string} params.what - Description of the action (e.g. 'UPDATED_ROLE')
 * @param {Object|string|mongoose.Types.ObjectId} params.target - The resource being operated on
 * @param {Object} [params.details] - Optional extra metadata or delta
 */
export const logAudit = async ({ who, what, target, details = null }) => {
  try {
    const adminId = who?._id || who?.id || who;
    return await AuditLog.create({
      who: adminId,
      what,
      target,
      when: new Date(),
      details
    });
  } catch (error) {
    console.error('Failed to persist audit log entry:', error);
    return null;
  }
};

export default logAudit;

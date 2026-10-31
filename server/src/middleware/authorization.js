/**
 * Reusable authorization helper to check if a user can modify a specific resource.
 * Allows the owner of the resource OR users with the role 'admin'.
 *
 * @param {Object|string} resource - Target document or owner reference
 * @param {Object|string} user - Requesting user document or user object with role and id
 * @returns {boolean}
 */
export const canModify = (resource, user) => {
  if (!user) return false;

  // Administrators have full permission to modify any resource
  if (user.role === 'admin') return true;

  if (!resource) return false;

  const userId = (user._id || user.id || user).toString();

  // If resource itself is a user document or ID
  const resourceId = (resource._id || resource.id || (typeof resource === 'string' ? resource : null))?.toString();
  if (resourceId === userId) return true;

  // Check known ownership fields
  const ownerId = resource.organizer?._id || resource.organizer ||
                  resource.user?._id || resource.user ||
                  resource.owner?._id || resource.owner ||
                  resource.author?._id || resource.author ||
                  resource.creator?._id || resource.creator;

  if (ownerId && ownerId.toString() === userId) {
    return true;
  }

  return false;
};

/**
 * Express middleware factory to enforce ownership or admin role.
 * 
 * @param {Function|mongoose.Model} getModel - Mongoose model to fetch resource from
 * @param {Function} [getResourceId] - Function to extract resource ID from req (defaults to req.params.id)
 */
export const authorizeModify = (getModel, getResourceId = (req) => req.params.id) => {
  return async (req, res, next) => {
    try {
      const id = getResourceId(req);
      const model = typeof getModel === 'function' && getModel.findById ? getModel : await getModel();
      const resource = await model.findById(id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      if (!canModify(resource, req.user)) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to modify this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default { canModify, authorizeModify };

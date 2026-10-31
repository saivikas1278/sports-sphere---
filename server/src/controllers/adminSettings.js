import PlatformSetting from '../models/PlatformSetting.js';

// @desc    Get platform settings
// @route   GET /api/settings
// @access  Public
export const getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = await PlatformSetting.create({});
    }
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update platform settings
// @route   PUT /api/settings
// @access  Private (Admin only)
export const updatePlatformSettings = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = await PlatformSetting.create(updateData);
    } else {
      settings = await PlatformSetting.findByIdAndUpdate(settings._id, updateData, {
        new: true,
        runValidators: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

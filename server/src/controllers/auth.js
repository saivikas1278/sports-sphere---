import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { sendTokenResponse } from '../utils/jwt.js';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary.js';
import { uploadImage } from '../utils/uploadUtils.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    console.log('[REGISTER] Incoming body:', req.body);
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[REGISTER] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { fullName, email, password, role, dateOfBirth, phoneNumber } = req.body;

    // Split fullName into firstName and lastName
    let firstName = '', lastName = '';
    if (fullName) {
      const nameParts = fullName.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
      if (!lastName) lastName = '-';
    }
    console.log('[REGISTER] Parsed names:', { firstName, lastName });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[REGISTER] User already exists:', email);
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      dateOfBirth,
      phoneNumber
    });
    console.log('[REGISTER] User created:', user._id);

    // Create user profile
    const profile = new Profile({
      user: user._id,
      preferences: {
        sports: [],
        notifications: {
          email: true,
          push: true,
          sms: false,
          types: {
            likes: true,
            comments: true,
            follows: true,
            teamInvites: true,
            tournamentUpdates: true,
            matchUpdates: true
          }
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: true
        }
      }
    });
    await profile.save();
    console.log('[REGISTER] Profile created for user:', user._id);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('[REGISTER] Exception:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    console.log('[LOGIN] Request received:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[LOGIN] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('[LOGIN] Looking for user with email:', email);
    console.log('[LOGIN] Password provided:', password ? `${password.substring(0, 3)}***` : 'NONE');

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log('[LOGIN] User found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('[LOGIN] User details:', {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
    }
    
    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.password) {
      console.log('[LOGIN] User has no password set');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('[LOGIN] Comparing password...');
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('[LOGIN] Password match:', isMatch);
    
    if (!isMatch) {
      console.log('[LOGIN] Password does not match');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Populate currentTeam before sending response
    await user.populate('currentTeam', 'name shortName');

    console.log('[LOGIN] Login successful, sending token response');
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('[LOGIN] Exception:', error);
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('currentTeam', 'name shortName');

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {};
    const allowedFields = [
      'firstName', 'lastName', 'bio', 'sports', 'location', 
      'dateOfBirth', 'phoneNumber', 'preferences'
    ];

    // Only update allowed fields that are provided
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/auth/avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    const file = req.files.avatar;
    let avatarUrl = '';
    let publicId = '';

    try {
      // Upload to cloudinary
      const result = await uploadImage(file.tempFilePath, {
        folder: 'avatars',
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'face'
      });
      avatarUrl = result.secure_url;
      publicId = result.public_id;
    } catch (cloudinaryError) {
      console.error('[AVATAR] Cloudinary upload failed, falling back to local storage:', cloudinaryError);
      
      // Fallback: save to local uploads folder
      const uploadsDir = path.join(__dirname, '../../uploads/avatars');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const fileName = `user_${req.user.id}_${Date.now()}${path.extname(file.name)}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Move file from temp to uploads
      await file.mv(filePath);
      
      // Generate local URL (assuming backend is on same domain, or construct full URL)
      // For local development, using relative path to API host
      avatarUrl = `http://localhost:${process.env.PORT || 5000}/uploads/avatars/${fileName}`;
      publicId = fileName;
    }

    // Update user with new avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        avatar: avatarUrl,
        avatarPublicId: publicId
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      // Here you would normally send email
      // await sendEmail({
      //   email: user.email,
      //   subject: 'Password reset token',
      //   message
      // });

      res.status(200).json({
        success: true,
        message: 'Email sent',
        resetToken // Remove this in production
      });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'Email could not be sent'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth
// @route   GET /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  // Handled by passport in routes
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleAuthCallback = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
    
    const token = user.getSignedJwtToken();
    
    // Option 1: Set cookie then redirect
    const options = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }
    res.cookie('token', token, options);
    
    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${token}`);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
  }
};

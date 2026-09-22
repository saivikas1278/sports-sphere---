import { validationResult } from 'express-validator';
import FitnessContent from '../models/FitnessContent.js';
import { uploadVideoToCloudinary, uploadImageToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// @desc    Get all fitness content
// @route   GET /api/fitness
// @access  Public
export const getFitnessContent = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    let query = { isPublished: true };

    // Filters
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.equipment) {
      query.equipment = { $in: [req.query.equipment] };
    }

    if (req.query.targetMuscles) {
      query.targetMuscles = { $in: [req.query.targetMuscles] };
    }

    if (req.query.goals) {
      query.goals = { $in: [req.query.goals] };
    }

    if (req.query.duration) {
      const [min, max] = req.query.duration.split('-').map(Number);
      query.duration = { $gte: min, $lte: max };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    
    if (req.query.sort === 'rating') {
      sortOption = { averageRating: -1 };
    } else if (req.query.sort === 'views') {
      sortOption = { views: -1 };
    } else if (req.query.sort === 'duration') {
      sortOption = { duration: 1 };
    }

    const content = await FitnessContent.find(query)
      .populate('instructor', 'firstName lastName avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip(startIndex);

    const total = await FitnessContent.countDocuments(query);

    // Pagination result
    const pagination = {};

    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: content.length,
      total,
      pagination,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fitness content
// @route   GET /api/fitness/:id
// @access  Public
export const getFitnessContentById = async (req, res, next) => {
  try {
    const content = await FitnessContent.findById(req.params.id)
      .populate('instructor', 'firstName lastName avatar bio')
      .populate('ratings.user', 'firstName lastName avatar')
      .populate('series.seriesId', 'title');

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    // Increment view count
    await content.incrementViews();

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create fitness content
// @route   POST /api/fitness
// @access  Private (Organizer/Instructor only)
export const createFitnessContent = async (req, res, next) => {
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

    const contentData = {
      ...req.body,
      instructor: req.user.id
    };

    // Handle file uploads
    if (req.files) {
      // Upload video
      if (req.files.video && req.files.video[0]) {
        const videoUpload = await uploadVideoToCloudinary(req.files.video[0].buffer, {
          folder: `sportsphere/fitness/videos/${req.user.id}`,
          public_id: `fitness_video_${Date.now()}`
        });
        contentData.videoUrl = videoUpload.secure_url;
        contentData.duration = Math.round(videoUpload.duration / 60); // Convert to minutes
      }

      // Upload thumbnail
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const thumbnailUpload = await uploadImageToCloudinary(req.files.thumbnail[0].buffer, {
          folder: `sportsphere/fitness/thumbnails/${req.user.id}`,
          public_id: `fitness_thumbnail_${Date.now()}`
        });
        contentData.thumbnailUrl = thumbnailUpload.secure_url;
      }
    }

    // Parse JSON fields if they're strings
    if (typeof contentData.equipment === 'string') {
      contentData.equipment = JSON.parse(contentData.equipment);
    }
    if (typeof contentData.targetMuscles === 'string') {
      contentData.targetMuscles = JSON.parse(contentData.targetMuscles);
    }
    if (typeof contentData.goals === 'string') {
      contentData.goals = JSON.parse(contentData.goals);
    }
    if (typeof contentData.exercises === 'string') {
      contentData.exercises = JSON.parse(contentData.exercises);
    }
    if (typeof contentData.workoutStructure === 'string') {
      contentData.workoutStructure = JSON.parse(contentData.workoutStructure);
    }

    const content = await FitnessContent.create(contentData);

    // Populate instructor data
    await content.populate('instructor', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update fitness content
// @route   PUT /api/fitness/:id
// @access  Private (Instructor only)
export const updateFitnessContent = async (req, res, next) => {
  try {
    let content = await FitnessContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    // Make sure user is the instructor
    if (content.instructor.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this content'
      });
    }

    const fieldsToUpdate = {};
    const allowedFields = [
      'title', 'description', 'category', 'subCategory', 'difficulty',
      'duration', 'equipment', 'targetMuscles', 'goals', 'content',
      'exercises', 'workoutStructure', 'caloriesBurned', 'tags',
      'isPublished', 'isPremium', 'prerequisites', 'warnings',
      'benefits', 'tips', 'variations'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    content = await FitnessContent.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate('instructor', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete fitness content
// @route   DELETE /api/fitness/:id
// @access  Private (Instructor only)
export const deleteFitnessContent = async (req, res, next) => {
  try {
    const content = await FitnessContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    // Make sure user is the instructor
    if (content.instructor.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this content'
      });
    }

    await content.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Fitness content deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate fitness content
// @route   POST /api/fitness/:id/rate
// @access  Private
export const rateFitnessContent = async (req, res, next) => {
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

    const content = await FitnessContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    await content.addRating(req.user.id, req.body.rating, req.body.review);

    res.status(200).json({
      success: true,
      message: 'Rating added successfully',
      averageRating: content.averageRating,
      ratingCount: content.ratingCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark/Unbookmark fitness content
// @route   POST /api/fitness/:id/bookmark
// @access  Private
export const bookmarkFitnessContent = async (req, res, next) => {
  try {
    const content = await FitnessContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    await content.toggleBookmark(req.user.id);

    const isBookmarked = content.bookmarks.some(
      bookmark => bookmark.user.toString() === req.user.id
    );

    res.status(200).json({
      success: true,
      message: isBookmarked ? 'Content bookmarked' : 'Bookmark removed',
      bookmarked: isBookmarked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track progress
// @route   POST /api/fitness/:id/progress
// @access  Private
export const trackProgress = async (req, res, next) => {
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

    const content = await FitnessContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    await content.updateProgress(
      req.user.id,
      req.body.progress,
      req.body.timeSpent,
      req.body.notes
    );

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user progress
// @route   GET /api/fitness/:id/progress
// @access  Private
export const getUserProgress = async (req, res, next) => {
  try {
    const content = await FitnessContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Fitness content not found'
      });
    }

    const userProgress = content.userProgress.find(
      progress => progress.user.toString() === req.user.id
    );

    res.status(200).json({
      success: true,
      data: userProgress || { progress: 0, timeSpent: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search fitness content
// @route   GET /api/fitness/search
// @access  Public
export const searchFitnessContent = async (req, res, next) => {
  try {
    const { q, category, difficulty, equipment, targetMuscles, goals } = req.query;
    const limit = parseInt(req.query.limit, 10) || 12;

    let query = { isPublished: true };

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (equipment) query.equipment = { $in: [equipment] };
    if (targetMuscles) query.targetMuscles = { $in: [targetMuscles] };
    if (goals) query.goals = { $in: [goals] };

    const content = await FitnessContent.find(query)
      .populate('instructor', 'firstName lastName avatar')
      .sort({ averageRating: -1, views: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured fitness content
// @route   GET /api/fitness/featured
// @access  Public
export const getFeaturedContent = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    const content = await FitnessContent.find({
      isPublished: true,
      averageRating: { $gte: 4.0 }
    })
      .populate('instructor', 'firstName lastName avatar')
      .sort({ averageRating: -1, views: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get content by category
// @route   GET /api/fitness/category/:category
// @access  Public
export const getContentByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit, 10) || 12;

    const content = await FitnessContent.find({
      category,
      isPublished: true
    })
      .populate('instructor', 'firstName lastName avatar')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user fitness stats
// @route   GET /api/fitness/stats
// @access  Private
export const getUserStats = async (req, res, next) => {
  try {
    // This is a stub that could aggregate actual user progress data.
    // For now, returning empty stats to satisfy the frontend gracefully.
    res.status(200).json({
      success: true,
      data: {
        workouts: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Workouts Completed',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        },
        calories: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Calories Burned',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1
          }]
        },
        duration: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Workout Duration (minutes)',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 1
          }]
        },
        workoutTypes: {
          labels: ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Sports'],
          datasets: [{
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 101, 101, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(251, 191, 36, 0.8)'
            ],
            borderWidth: 2
          }]
        },
        bodyMeasurements: [],
        personalRecords: []
      }
    });
  } catch (error) {
    next(error);
  }
};

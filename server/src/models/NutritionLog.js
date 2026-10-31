import mongoose from 'mongoose';

const mealItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'breakfast'
  },
  calories: {
    type: Number,
    required: true,
    default: 0
  },
  protein: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

const nutritionLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  meals: [mealItemSchema],
  waterIntake: {
    type: Number,
    default: 0
  },
  goals: {
    calories: { type: Number, default: 2200 },
    protein: { type: Number, default: 165 },
    carbs: { type: Number, default: 275 },
    fat: { type: Number, default: 73 },
    water: { type: Number, default: 8 }
  }
}, {
  timestamps: true
});

// Ensure a user only has one log per calendar day
nutritionLogSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('NutritionLog', nutritionLogSchema);

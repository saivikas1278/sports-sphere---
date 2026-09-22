import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const createSecondTestUser = async () => {
  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB');

    await User.deleteOne({ email: 'john.smith@example.com' });

    const testUser = new User({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      password: 'Test@123',
      role: 'player'
    });

    await testUser.save();
    console.log('✅ Second test user john.smith@example.com created successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

createSecondTestUser();

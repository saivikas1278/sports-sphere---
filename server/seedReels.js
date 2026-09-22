import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './src/models/Post.js';
import User from './src/models/User.js';

dotenv.config();

const seedReels = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected.');

    // Get an existing user to act as author, or create a mock author if none exists
    let author = await User.findOne({ role: 'organizer' });
    if (!author) {
      author = await User.findOne({});
    }
    if (!author) {
      console.log('No users found in database. Cannot seed posts.');
      process.exit(1);
    }

    const fitnessReels = [
      {
        title: 'Morning Agility Drills',
        content: 'Morning agility drills for cricketers. Explosive speed is key for running between wickets and boundary saves! 🏏💪 #CricketFitness #Agility',
        type: 'video',
        author: author._id,
        sport: 'cricket',
        privacy: 'public',
        videos: [{ url: 'https://res.cloudinary.com/demo/video/upload/v1689253488/docs_video/running_track.mp4' }],
        tags: ['CricketFitness', 'Agility'],
      },
      {
        title: 'Core Workout for Fast Bowlers',
        content: 'Core workout specifically designed for fast bowlers. Build that rotational power and prevent back injuries! 🔥 #FastBowling #CricketTraining',
        type: 'video',
        author: author._id,
        sport: 'cricket',
        privacy: 'public',
        videos: [{ url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4' }], 
        tags: ['FastBowling', 'CricketTraining'],
      }
    ];

    await Post.insertMany(fitnessReels);
    console.log('Cricket fitness reels successfully seeded to MongoDB!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding reels:', error);
    process.exit(1);
  }
};

seedReels();

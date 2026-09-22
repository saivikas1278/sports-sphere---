import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from './src/models/Tournament.js';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const seedTournaments = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    let organizer = await User.findOne({ role: 'admin' }) || await User.findOne();
    if (!organizer) {
      organizer = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin_wg@test.com',
        password: 'Password123',
        role: 'admin'
      });
    }

    const wgCities = ['Bhimavaram', 'Eluru', 'Tadepalligudem', 'Tanuku', 'Palakollu'];
    const sports = ['cricket', 'volleyball', 'badminton', 'football', 'basketball'];
    const statuses = ['open', 'ongoing', 'completed'];

    const tournaments = Array.from({ length: 10 }).map((_, i) => {
      const now = new Date();
      const status = statuses[i % statuses.length];
      
      let dates = {};
      if (status === 'open') {
        dates = {
          registrationStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          registrationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          tournamentStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          tournamentEnd: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
        };
      } else if (status === 'ongoing') {
        dates = {
          registrationStart: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
          registrationEnd: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          tournamentStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          tournamentEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        };
      } else { // completed
        dates = {
          registrationStart: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
          registrationEnd: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          tournamentStart: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          tournamentEnd: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
        };
      }

      return {
        name: `West Godavari ${wgCities[i % wgCities.length]} ${sports[i % sports.length]} Championship 2026`,
        description: `An exciting ${sports[i % sports.length]} tournament in West Godavari district bringing together top talent.`,
        sport: sports[i % sports.length],
        organizer: organizer._id,
        format: 'single-elimination',
        maxTeams: 16,
        registrationFee: 500 + i * 100,
        prizePool: { total: 10000 + i * 2000 },
        venue: {
          name: `${wgCities[i % wgCities.length]} Sports Complex`,
          address: `Main Road, ${wgCities[i % wgCities.length]}`,
          city: wgCities[i % wgCities.length],
          state: 'Andhra Pradesh',
          country: 'India',
        },
        dates,
        status,
        visibility: 'public'
      };
    });

    await Tournament.insertMany(tournaments);
    console.log(`Successfully seeded 10 tournaments in West Godavari!`);
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedTournaments();

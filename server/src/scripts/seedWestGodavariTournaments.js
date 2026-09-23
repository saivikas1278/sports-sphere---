import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';

dotenv.config();

const seedWestGodavariTournaments = async () => {
  try {
    console.log('🌱 Starting West Godavari tournament seeding...');
    await connectDB();
    
    // Find an organizer user
    let organizer = await User.findOne({ email: 'john.smith@example.com' });
    if (!organizer) {
      organizer = await User.create({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        password: 'Test@123',
        role: 'organizer',
        sports: [{ name: 'cricket', position: 'Organizer', experience: 'advanced' }],
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
      });
    }

    const now = new Date();
    
    const locations = [
      { city: 'Bhimavaram', coordinates: { lat: 16.5449, lng: 81.5212 } },
      { city: 'Eluru', coordinates: { lat: 16.7107, lng: 81.1031 } },
      { city: 'Tadepalligudem', coordinates: { lat: 16.8073, lng: 81.5316 } },
      { city: 'Tanuku', coordinates: { lat: 16.7554, lng: 81.6784 } },
      { city: 'Palakollu', coordinates: { lat: 16.5255, lng: 81.7283 } },
      { city: 'Narasapuram', coordinates: { lat: 16.4343, lng: 81.7001 } },
      { city: 'Kovvur', coordinates: { lat: 17.0135, lng: 81.7303 } },
      { city: 'Nidadavole', coordinates: { lat: 16.9079, lng: 81.6729 } },
      { city: 'Jangareddygudem', coordinates: { lat: 17.1213, lng: 81.2917 } },
      { city: 'Chintalapudi', coordinates: { lat: 17.0506, lng: 80.9926 } }
    ];

    const sports = ['cricket', 'volleyball', 'badminton', 'football', 'basketball', 'chess', 'table-tennis', 'tennis'];
    const formats = ['single-elimination', 'double-elimination', 'round-robin'];

    const tournaments = [];

    for (let i = 1; i <= 20; i++) {
      const location = locations[i % locations.length];
      const sport = sports[i % sports.length];
      const format = formats[i % formats.length];
      
      const regStartDays = Math.floor(Math.random() * 10) - 5; // -5 to +5 days from now
      const regEndDays = regStartDays + 15;
      const tournStartDays = regEndDays + 5;
      const tournEndDays = tournStartDays + 7;

      tournaments.push({
        name: `${location.city} District ${sport.charAt(0).toUpperCase() + sport.slice(1)} Cup 2026 - #${i}`,
        description: `Annual ${sport} tournament happening in the heart of ${location.city}, West Godavari district.`,
        sport: sport,
        organizer: organizer._id,
        format: format,
        maxTeams: 16,
        registrationFee: 1000 + (Math.random() * 2000),
        prizePool: {
          total: 50000,
          distribution: [
            { position: 1, amount: 25000, percentage: 50 },
            { position: 2, amount: 15000, percentage: 30 },
            { position: 3, amount: 10000, percentage: 20 }
          ]
        },
        venue: {
          name: `${location.city} Municipal Stadium`,
          address: `Main Road, ${location.city}`,
          city: location.city,
          state: 'Andhra Pradesh',
          country: 'India',
          coordinates: location.coordinates,
          location: {
            type: 'Point',
            coordinates: [location.coordinates.lng, location.coordinates.lat] // GeoJSON format is [longitude, latitude]
          }
        },
        dates: {
          registrationStart: new Date(now.getTime() + regStartDays * 24 * 60 * 60 * 1000),
          registrationEnd: new Date(now.getTime() + regEndDays * 24 * 60 * 60 * 1000),
          tournamentStart: new Date(now.getTime() + tournStartDays * 24 * 60 * 60 * 1000),
          tournamentEnd: new Date(now.getTime() + tournEndDays * 24 * 60 * 60 * 1000)
        },
        status: 'open',
        visibility: 'public',
        rules: `Standard rules of ${sport} apply.`,
        registeredTeams: [],
        settings: {
          allowLateRegistration: true,
          requireApproval: false,
          maxPlayersPerTeam: 15,
          minPlayersPerTeam: 1
        }
      });
    }

    for (const data of tournaments) {
      await Tournament.create(data);
      console.log(`✅ Created: ${data.name} in ${data.venue.city}`);
    }

    console.log(`🎉 Successfully seeded 20 tournaments near West Godavari district!`);
  } catch (error) {
    console.error('❌ Tournament seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

seedWestGodavariTournaments();

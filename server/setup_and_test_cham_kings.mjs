import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/models/User.js';
import Profile from './src/models/Profile.js';
import Team from './src/models/Team.js';
import Tournament from './src/models/Tournament.js';

async function setupAndTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  // 1. Provision Organizer Account (Pass plaintext password; Mongoose pre-save hook hashes it)
  console.log('\n--- 1. PROVISIONING ORGANIZER ACCOUNT ---');
  let organizer = await User.findOne({ email: 'cham_organizer@sportsphere.com' });
  if (!organizer) {
    organizer = await User.create({
      name: 'Cham Organizer',
      firstName: 'Cham',
      lastName: 'Organizer',
      email: 'cham_organizer@sportsphere.com',
      password: 'Password123!',
      role: 'organizer',
      isVerified: true
    });
    console.log(`Created new Organizer: ${organizer.email} (ID: ${organizer._id})`);
  } else {
    organizer.password = 'Password123!';
    organizer.role = 'organizer';
    organizer.isVerified = true;
    await organizer.save();
    console.log(`Updated existing Organizer: ${organizer.email} (ID: ${organizer._id})`);
  }

  // 2. Provision Player Account
  console.log('\n--- 2. PROVISIONING PLAYER ACCOUNT ---');
  let player = await User.findOne({ email: 'cham_player@sportsphere.com' });
  if (!player) {
    player = await User.create({
      name: 'Cham Player',
      firstName: 'Cham',
      lastName: 'Player',
      email: 'cham_player@sportsphere.com',
      password: 'Password123!',
      role: 'player',
      isVerified: true
    });
    console.log(`Created new Player: ${player.email} (ID: ${player._id})`);
  } else {
    player.password = 'Password123!';
    player.role = 'player';
    player.isVerified = true;
    await player.save();
    console.log(`Updated existing Player: ${player.email} (ID: ${player._id})`);
  }

  // 3. Ensure Player Profile Exists
  let playerProfile = await Profile.findOne({ user: player._id });
  if (!playerProfile) {
    playerProfile = await Profile.create({
      user: player._id,
      bio: 'Opening batsman and passionate cricket player for CHAM Strikers.',
      sports: [{ sport: 'cricket', skillLevel: 'advanced', yearsExperience: 5 }],
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
    });
    console.log(`Created Profile for Player: ${player.name}`);
  } else {
    playerProfile.bio = 'Opening batsman and passionate cricket player for CHAM Strikers.';
    await playerProfile.save();
    console.log(`Updated Profile for Player: ${player.name}`);
  }

  // 4. Provision Rival Player & Team for Tournament Matchup
  let rival = await User.findOne({ email: 'cham_rival@sportsphere.com' });
  if (!rival) {
    rival = await User.create({
      name: 'Rival Captain',
      firstName: 'Rival',
      lastName: 'Captain',
      email: 'cham_rival@sportsphere.com',
      password: 'Password123!',
      role: 'player',
      isVerified: true
    });
  }

  // 5. Create Player's Cricket Team: CHAM Strikers
  console.log('\n--- 3. CREATING PLAYER TEAM: CHAM Strikers ---');
  let playerTeam = await Team.findOne({ name: 'CHAM Strikers' });
  if (!playerTeam) {
    playerTeam = await Team.create({
      name: 'CHAM Strikers',
      sport: 'cricket',
      captain: player._id,
      description: 'The premier championship cricket squad led by Cham Player.',
      members: [
        { user: player._id, role: 'captain', status: 'active' }
      ]
    });
    console.log(`Created Team: CHAM Strikers (ID: ${playerTeam._id})`);
  } else {
    playerTeam.captain = player._id;
    await playerTeam.save();
    console.log(`Existing Team: CHAM Strikers (ID: ${playerTeam._id})`);
  }

  // Create Rival Team: CHAM Royals
  let rivalTeam = await Team.findOne({ name: 'CHAM Royals' });
  if (!rivalTeam) {
    rivalTeam = await Team.create({
      name: 'CHAM Royals',
      sport: 'cricket',
      captain: rival._id,
      description: 'The fierce competitors from Mumbai Cricket League.',
      members: [
        { user: rival._id, role: 'captain', status: 'active' }
      ]
    });
  }

  // 6. Create Organizer's Cricket Tournament: CHAM KINGS
  console.log('\n--- 4. CREATING CRICKET TOURNAMENT: CHAM KINGS ---');
  const now = new Date();
  let tournament = await Tournament.findOne({ name: 'CHAM KINGS' });
  if (tournament) {
    await Tournament.findByIdAndDelete(tournament._id);
    console.log('Cleaned up previous CHAM KINGS instance for a fresh state.');
  }

  tournament = await Tournament.create({
    name: 'CHAM KINGS',
    description: 'The Official CHAM KINGS Cricket Championship 2026. Top regional teams compete in a high-stakes T20 knockout battle for the ultimate crown and trophy!',
    sport: 'cricket',
    format: 'single-elimination',
    organizer: organizer._id,
    maxTeams: 8,
    entryFee: 50,
    prizePool: 2500,
    visibility: 'public',
    status: 'open',
    isVerified: true,
    venue: {
      name: 'Kings National Stadium',
      address: 'Marine Drive Sports Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    dates: {
      registrationStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      registrationEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      tournamentStart: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      tournamentEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    },
    registeredTeams: [
      { team: playerTeam._id, status: 'approved', registeredAt: new Date() },
      { team: rivalTeam._id, status: 'approved', registeredAt: new Date() }
    ]
  });

  console.log(`✓ Created Live Tournament: CHAM KINGS (ID: ${tournament._id})`);
  console.log(`✓ Registered and Approved Teams: CHAM Strikers & CHAM Royals`);

  // 7. Verify Tournament State
  console.log('\n--- 5. VERIFYING ROLES AND PERMISSIONS ---');
  const tourneyDoc = await Tournament.findById(tournament._id).populate('registeredTeams.team');
  console.assert(tourneyDoc.name === 'CHAM KINGS', 'Tournament name matches');
  console.assert(tourneyDoc.sport === 'cricket', 'Tournament sport is cricket');
  console.assert(tourneyDoc.organizer.toString() === organizer._id.toString(), 'Organizer correctly assigned');
  console.assert(tourneyDoc.registeredTeams.length === 2, 'Has 2 approved teams');
  console.assert(tourneyDoc.registeredTeams[0].status === 'approved', 'Player team is approved');

  console.log('\n======================================================');
  console.log('🎉 SETUP & TESTING COMPLETE: CREDENTIALS SUMMARY');
  console.log('======================================================');
  console.log(`Tournament URL:        http://localhost:3000/tournaments/${tournament._id}`);
  console.log(`Tournament Dashboard:  http://localhost:3000/tournaments/${tournament._id}/dashboard`);
  console.log('------------------------------------------------------');
  console.log('ORGANIZER CREDENTIALS:');
  console.log('  Email:    cham_organizer@sportsphere.com');
  console.log('  Password: Password123!');
  console.log('  Role:     organizer');
  console.log('  Actions:  Manage "CHAM KINGS", approve teams, schedule matches, start brackets');
  console.log('------------------------------------------------------');
  console.log('PLAYER CREDENTIALS:');
  console.log('  Email:    cham_player@sportsphere.com');
  console.log('  Password: Password123!');
  console.log('  Role:     player');
  console.log('  Team:     CHAM Strikers (Captain)');
  console.log('  Actions:  Inspect profile, view team roster, check registered tournaments');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

setupAndTest().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});

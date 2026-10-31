import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testTournamentFormats() {
  console.log('--- Testing Tournament Formats: Double-Elimination and Round-Robin ---');

  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('./src/models/User.js')).default;
  const Tournament = (await import('./src/models/Tournament.js')).default;
  const Team = (await import('./src/models/Team.js')).default;
  const Match = (await import('./src/models/Match.js')).default;

  const timestamp = Date.now();

  // 1. Create an organizer
  const orgUser = await User.create({
    firstName: 'Format',
    lastName: 'Tester',
    fullName: `Format Tester ${timestamp}`,
    email: `format_tester_${timestamp}@test.com`,
    password: 'Password123!',
    role: 'organizer'
  });

  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: `format_tester_${timestamp}@test.com`,
    password: 'Password123!'
  });
  const orgToken = loginRes.data.token;
  const authHeader = { headers: { Authorization: `Bearer ${orgToken}` } };

  // ==========================================
  // TEST 1: Double-Elimination Tournament Flow
  // ==========================================
  console.log('\n[TEST 1] Testing Double-Elimination Tournament Flow...');
  const doubleElimTournament = await Tournament.create({
    name: `Double Elim Cup ${timestamp}`,
    description: 'Testing double elimination scheduling engine',
    sport: 'football',
    format: 'double-elimination',
    organizer: orgUser._id,
    maxTeams: 4,
    status: 'open',
    registrationStatus: 'open',
    dates: {
      registrationStart: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      registrationEnd: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      tournamentStart: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      tournamentEnd: new Date(Date.now() + 5 * 24 * 3600 * 1000)
    }
  });

  // Create 4 approved teams
  const deTeams = [];
  for (let i = 1; i <= 4; i++) {
    const team = await Team.create({
      name: `DE Team ${i} ${timestamp}`,
      sport: 'football',
      captain: orgUser._id,
      tournament: doubleElimTournament._id
    });
    deTeams.push(team);
    doubleElimTournament.registeredTeams.push({
      team: team._id,
      registeredAt: new Date(),
      status: 'approved'
    });
  }
  await doubleElimTournament.save();

  // Call POST /api/tournaments/:id/start to generate schedule & bracket
  const startDeRes = await axios.post(`${API_URL}/tournaments/${doubleElimTournament._id}/start`, {}, authHeader);
  if (startDeRes.status === 200 && startDeRes.data.success) {
    console.log('[PASS] Double-Elimination tournament started successfully.');
  } else {
    console.error('[FAIL] Double-Elimination start failed:', startDeRes.data);
    process.exit(1);
  }

  // Verify created matches and bracket in DB
  const deUpdated = await Tournament.findById(doubleElimTournament._id);
  const deMatches = await Match.find({ tournament: doubleElimTournament._id }).sort({ matchNumber: 1 });

  console.log(`[PASS] Generated ${deMatches.length} Double-Elimination matches (Expected >= 5)`);
  console.log(`       Bracket Format: ${deUpdated.brackets?.format}`);
  console.log(`       Rounds: ${deUpdated.brackets?.rounds?.map(r => r.name).join(', ')}`);

  const hasWinnersR1 = deMatches.some(m => m.roundName === 'Winners Round 1');
  const hasWinnersFinals = deMatches.some(m => m.roundName === 'Winners Finals');
  const hasLosersR1 = deMatches.some(m => m.roundName === 'Losers Round 1');
  const hasLosersFinals = deMatches.some(m => m.roundName === 'Losers Finals');
  const hasGrandFinals = deMatches.some(m => m.roundName === 'Grand Finals');

  if (!hasWinnersR1 || !hasWinnersFinals || !hasLosersR1 || !hasLosersFinals || !hasGrandFinals) {
    console.error('[FAIL] Missing one or more expected double-elimination rounds:', {
      hasWinnersR1, hasWinnersFinals, hasLosersR1, hasLosersFinals, hasGrandFinals
    });
    process.exit(1);
  }
  console.log('[PASS] All Double-Elimination rounds verified (Winners, Losers, Grand Finals)');

  // ==========================================
  // TEST 2: Round-Robin Tournament Flow
  // ==========================================
  console.log('\n[TEST 2] Testing Round-Robin Tournament Flow...');
  const roundRobinTournament = await Tournament.create({
    name: `Round Robin League ${timestamp}`,
    description: 'Testing round robin schedule and structured rounds',
    sport: 'cricket',
    format: 'round-robin',
    organizer: orgUser._id,
    maxTeams: 4,
    status: 'open',
    registrationStatus: 'open',
    dates: {
      registrationStart: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      registrationEnd: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      tournamentStart: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      tournamentEnd: new Date(Date.now() + 5 * 24 * 3600 * 1000)
    }
  });

  const rrTeams = [];
  for (let i = 1; i <= 4; i++) {
    const team = await Team.create({
      name: `RR Team ${i} ${timestamp}`,
      sport: 'cricket',
      captain: orgUser._id,
      tournament: roundRobinTournament._id
    });
    rrTeams.push(team);
    roundRobinTournament.registeredTeams.push({
      team: team._id,
      registeredAt: new Date(),
      status: 'approved'
    });
  }
  await roundRobinTournament.save();

  const startRrRes = await axios.post(`${API_URL}/tournaments/${roundRobinTournament._id}/start`, {}, authHeader);
  if (startRrRes.status === 200 && startRrRes.data.success) {
    console.log('[PASS] Round-Robin tournament started successfully.');
  } else {
    console.error('[FAIL] Round-Robin start failed:', startRrRes.data);
    process.exit(1);
  }

  const rrUpdated = await Tournament.findById(roundRobinTournament._id);
  const rrMatches = await Match.find({ tournament: roundRobinTournament._id }).sort({ matchNumber: 1 });

  // 4 teams pairwise matches = 4 * 3 / 2 = 6 matches
  console.log(`[PASS] Generated ${rrMatches.length} Round-Robin matches (Expected: 6)`);
  console.log(`       Bracket Format: ${rrUpdated.brackets?.format}`);
  console.log(`       Rounds: ${rrUpdated.brackets?.rounds?.map(r => r.name).join(', ')}`);

  if (rrMatches.length !== 6) {
    console.error(`[FAIL] Expected 6 round robin matches, got ${rrMatches.length}`);
    process.exit(1);
  }

  if (!rrUpdated.brackets?.rounds || rrUpdated.brackets.rounds.length === 0) {
    console.error('[FAIL] Expected round-robin tournament to have structured bracket rounds');
    process.exit(1);
  }
  console.log('[PASS] Round-Robin tournament generated valid structured rounds for BracketComponent');

  // Cleanup
  await Match.deleteMany({ tournament: { $in: [doubleElimTournament._id, roundRobinTournament._id] } });
  await Team.deleteMany({ _id: { $in: [...deTeams.map(t => t._id), ...rrTeams.map(t => t._id)] } });
  await Tournament.deleteMany({ _id: { $in: [doubleElimTournament._id, roundRobinTournament._id] } });
  await User.findByIdAndDelete(orgUser._id);
  await mongoose.disconnect();

  console.log('\n--- ALL TOURNAMENT FORMAT TESTS PASSED SUCCESSFULLY ---\n');
}

testTournamentFormats().catch(err => {
  console.error('[FAIL] Tournament formats test error:', err.response?.data || err);
  process.exit(1);
});

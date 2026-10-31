import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { io } = require('../client/node_modules/socket.io-client');
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

async function testRealtimeSocketSync() {
  console.log('--- Testing Real-Time WebSocket Match & Scoring Synchronization ---');

  // 1. Connect a simulated spectator socket
  const spectatorSocket = io(SOCKET_URL, {
    transports: ['websocket'],
    timeout: 5000
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Connection timed out'));
    }, 5000);

    spectatorSocket.on('connect', () => {
      console.log(`[PASS] Spectator socket connected: ${spectatorSocket.id}`);
      clearTimeout(timer);
      resolve();
    });

    spectatorSocket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  // Connect to DB to create test fixture
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('./src/models/User.js')).default;
  const Tournament = (await import('./src/models/Tournament.js')).default;
  const Team = (await import('./src/models/Team.js')).default;
  const Match = (await import('./src/models/Match.js')).default;

  const timestamp = Date.now();
  const orgUser = await User.create({
    firstName: 'Socket',
    lastName: 'Organizer',
    fullName: `Socket Organizer ${timestamp}`,
    email: `socket_org_${timestamp}@test.com`,
    password: 'Password123!',
    role: 'organizer'
  });

  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: `socket_org_${timestamp}@test.com`,
    password: 'Password123!'
  });
  const orgToken = loginRes.data.token;

  // Create an active tournament & match
  const testTournament = await Tournament.create({
    name: `Socket Test Cup ${timestamp}`,
    description: 'Testing real-time scoring synchronization',
    sport: 'cricket',
    format: 'single-elimination',
    organizer: orgUser._id,
    maxTeams: 4,
    status: 'ongoing',
    dates: {
      registrationStart: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      registrationEnd: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      tournamentStart: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      tournamentEnd: new Date(Date.now() + 5 * 24 * 3600 * 1000)
    }
  });

  const team1 = await Team.create({
    name: `Team Alpha ${timestamp}`,
    sport: 'cricket',
    captain: orgUser._id,
    tournament: testTournament._id
  });

  const team2 = await Team.create({
    name: `Team Beta ${timestamp}`,
    sport: 'cricket',
    captain: orgUser._id,
    tournament: testTournament._id
  });

  const testMatch = await Match.create({
    tournament: testTournament._id,
    homeTeam: team1._id,
    awayTeam: team2._id,
    round: 1,
    matchNumber: 1,
    sportType: 'cricket',
    status: 'live',
    score: { home: 0, away: 0 },
    scheduledTime: new Date()
  });

  console.log(`[PASS] Fixture match created: ${testMatch._id} in Tournament: ${testTournament._id}`);

  // Join the real match rooms on the spectator socket
  spectatorSocket.emit('join-match', testMatch._id.toString());
  spectatorSocket.emit('join-tournament', testTournament._id.toString());
  await new Promise(r => setTimeout(r, 400));

  let liveDeliveryReceived = false;
  let scoreUpdatedReceived = false;
  let colonScoreUpdatedReceived = false;

  spectatorSocket.on('match-score-updated', (payload) => {
    if (String(payload.matchId) === testMatch._id.toString()) {
      liveDeliveryReceived = true;
      console.log('[PASS] Spectator received match-score-updated for cricket delivery:', {
        score: payload.score,
        runs: payload.cricketData?.innings?.[0]?.runs,
        wickets: payload.cricketData?.innings?.[0]?.wickets
      });
    }
  });

  spectatorSocket.on('score-updated', (payload) => {
    if (String(payload.matchId) === testMatch._id.toString()) {
      scoreUpdatedReceived = true;
      console.log(`[PASS] Spectator received 'score-updated' event.`);
    }
  });

  spectatorSocket.on('match:score_updated', (payload) => {
    if (String(payload.matchId) === testMatch._id.toString()) {
      colonScoreUpdatedReceived = true;
      console.log(`[PASS] Spectator received 'match:score_updated' colon event.`);
    }
  });

  // 5. Trigger live cricket ball score update via PUT /api/tournaments/:id/matches/:matchId/cricket-ball
  const ballRes = await axios.put(
    `${API_URL}/tournaments/${testTournament._id}/matches/${testMatch._id}/cricket-ball`,
    {
      action: 'delivery',
      runs: 4,
      isExtra: false,
      isWicket: false
    },
    {
      headers: {
        Authorization: `Bearer ${orgToken}`
      }
    }
  );

  if (ballRes.status === 200 && ballRes.data.success) {
    console.log('[PASS] PUT cricket-ball API call succeeded (Runs: 4, Status 200)');
  } else {
    console.error('[FAIL] PUT cricket-ball failed:', ballRes.data);
    process.exit(1);
  }

  // Wait for socket propagation
  await new Promise(r => setTimeout(r, 1000));

  if (!liveDeliveryReceived) {
    console.error('[FAIL] Spectator socket did not receive match-score-updated for cricket delivery');
    process.exit(1);
  }

  if (!scoreUpdatedReceived) {
    console.error('[FAIL] Spectator socket did not receive score-updated event');
    process.exit(1);
  }

  if (!colonScoreUpdatedReceived) {
    console.error('[FAIL] Spectator socket did not receive match:score_updated colon event');
    process.exit(1);
  }

  // Cleanup test documents
  await Match.findByIdAndDelete(testMatch._id);
  await Team.deleteMany({ _id: { $in: [team1._id, team2._id] } });
  await Tournament.findByIdAndDelete(testTournament._id);
  await User.findByIdAndDelete(orgUser._id);
  await mongoose.disconnect();

  spectatorSocket.disconnect();
  console.log('\n--- ALL REAL-TIME SOCKET TESTS PASSED SUCCESSFULLY ---\n');
}

testRealtimeSocketSync().catch(err => {
  console.error('[FAIL] Socket sync test error:', err);
  process.exit(1);
});

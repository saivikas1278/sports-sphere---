import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from '../../client/node_modules/socket.io-client/build/esm/index.js';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import Match from '../src/models/Match.js';
import Tournament from '../src/models/Tournament.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { setupSocketHandlers, emitScoreUpdate, emitBracketUpdate } from '../src/utils/socketHandlers.js';

describe('Live Tournament Board Socket.io Rooms & Scorer Authorization', () => {
  let httpServer;
  let ioServer;
  let port;
  let organizerUser, organizerToken;
  let scorerUser, scorerToken;
  let spectatorUser, spectatorToken;
  let testTournament;
  let testMatch;

  beforeAll(async () => {
    await connectTestDb();

    // Spin up isolated test HTTP & Socket.io server
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: { origin: '*' }
    });
    setupSocketHandlers(ioServer);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (ioServer) ioServer.close();
    if (httpServer) httpServer.close();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // 1. Create Organizer
    organizerUser = await User.create({
      firstName: 'Alice',
      lastName: 'Organizer',
      email: 'alice.org@example.com',
      password: 'Password123!',
      role: 'organizer'
    });
    organizerToken = jwt.sign({ id: organizerUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 2. Create Assigned Scorer
    scorerUser = await User.create({
      firstName: 'Bob',
      lastName: 'Scorer',
      email: 'bob.scorer@example.com',
      password: 'Password123!',
      role: 'player'
    });
    scorerToken = jwt.sign({ id: scorerUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 3. Create Unrelated Normal User
    spectatorUser = await User.create({
      firstName: 'Charlie',
      lastName: 'Spectator',
      email: 'charlie.spec@example.com',
      password: 'Password123!',
      role: 'player'
    });
    spectatorToken = jwt.sign({ id: spectatorUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 4. Create Tournament
    const now = new Date();
    testTournament = await Tournament.create({
      name: 'City Badminton Championship 2026',
      description: 'Championship cup with real-time scoring.',
      sport: 'badminton',
      format: 'single-elimination',
      maxTeams: 4,
      organizer: organizerUser._id,
      status: 'ongoing',
      dates: {
        registrationStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        registrationEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        tournamentStart: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        tournamentEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // 5. Create Match with assigned scorer
    testMatch = await Match.create({
      tournament: testTournament._id,
      matchNumber: 1,
      round: 1,
      roundName: 'Semi-Final 1',
      position: 0,
      sportType: 'points',
      status: 'scheduled',
      scheduledTime: new Date(),
      scorer: scorerUser._id,
      score: { home: 0, away: 0 }
    });
  });

  const createClient = (token = null) => {
    return ioClient(`http://localhost:${port}`, {
      auth: token ? { token } : {},
      transports: ['websocket'],
      forceNew: true
    });
  };

  it('should allow public anonymous connection with no token (spectator mode)', (done) => {
    const anonymousClient = createClient(null);

    anonymousClient.on('connect', () => {
      expect(anonymousClient.connected).toBe(true);
      anonymousClient.disconnect();
      done();
    });
  });

  it('should allow anonymous spectator to join tournament and match rooms', (done) => {
    const spectatorClient = createClient(null);

    spectatorClient.on('connect', () => {
      // Spectator joins tournament and match room
      spectatorClient.emit('join-tournament', testTournament._id.toString());
      spectatorClient.emit('join-match', testMatch._id.toString());

      setTimeout(() => {
        // Server emits score update to tournament room
        emitScoreUpdate(ioServer, testMatch._id.toString(), testTournament._id.toString(), 21, 19, 'Set 1 won');
      }, 50);
    });

    spectatorClient.on('match-score-updated', (data) => {
      expect(data.matchId).toBe(testMatch._id.toString());
      expect(data.homeScore).toBe(21);
      expect(data.awayScore).toBe(19);
      expect(data.event).toBe('Set 1 won');
      spectatorClient.disconnect();
      done();
    });
  });

  it('should reject score-update from unauthenticated client with error event', (done) => {
    const anonymousClient = createClient(null);

    anonymousClient.on('connect', () => {
      anonymousClient.emit('score-update', {
        matchId: testMatch._id.toString(),
        tournamentId: testTournament._id.toString(),
        homeScore: 10,
        awayScore: 5
      });
    });

    anonymousClient.on('error', (err) => {
      expect(err.message).toMatch(/Authentication required/i);
      anonymousClient.disconnect();
      done();
    });
  });

  it('should reject score-update from non-scorer and non-organizer user', (done) => {
    const unauthorizedClient = createClient(spectatorToken);

    unauthorizedClient.on('connect', () => {
      unauthorizedClient.emit('score-update', {
        matchId: testMatch._id.toString(),
        tournamentId: testTournament._id.toString(),
        homeScore: 15,
        awayScore: 12
      });
    });

    unauthorizedClient.on('error', (err) => {
      expect(err.message).toMatch(/Not authorized.*scorer or tournament organizer/i);
      unauthorizedClient.disconnect();
      done();
    });
  });

  it('should allow assigned scorer to emit score-update and broadcast to watching spectators', (done) => {
    const spectatorClient = createClient(null);
    const scorerClient = createClient(scorerToken);

    let spectatorReady = false;

    spectatorClient.on('connect', () => {
      spectatorClient.emit('join-tournament', testTournament._id.toString());
      spectatorClient.emit('join-match', testMatch._id.toString());
      spectatorReady = true;
    });

    spectatorClient.on('score-updated', (data) => {
      expect(data.matchId).toBe(testMatch._id.toString());
      expect(data.homeScore).toBe(11);
      expect(data.awayScore).toBe(9);
      spectatorClient.disconnect();
      scorerClient.disconnect();
      done();
    });

    scorerClient.on('connect', () => {
      const interval = setInterval(() => {
        if (spectatorReady) {
          clearInterval(interval);
          scorerClient.emit('score-update', {
            matchId: testMatch._id.toString(),
            tournamentId: testTournament._id.toString(),
            homeScore: 11,
            awayScore: 9,
            event: 'Badminton rally point'
          });
        }
      }, 30);
    });
  });

  it('should allow tournament organizer to emit score-update and broadcast to rooms', (done) => {
    const spectatorClient = createClient(null);
    const organizerClient = createClient(organizerToken);

    let spectatorReady = false;

    spectatorClient.on('connect', () => {
      spectatorClient.emit('join-tournament', testTournament._id.toString());
      spectatorReady = true;
    });

    spectatorClient.on('match-score-updated', (data) => {
      expect(data.matchId).toBe(testMatch._id.toString());
      expect(data.homeScore).toBe(20);
      expect(data.awayScore).toBe(20);
      spectatorClient.disconnect();
      organizerClient.disconnect();
      done();
    });

    organizerClient.on('connect', () => {
      const interval = setInterval(() => {
        if (spectatorReady) {
          clearInterval(interval);
          organizerClient.emit('score-update', {
            matchId: testMatch._id.toString(),
            tournamentId: testTournament._id.toString(),
            homeScore: 20,
            awayScore: 20,
            event: 'Deuce'
          });
        }
      }, 30);
    });
  });

  it('should broadcast bracket-updated when emitBracketUpdate is called', (done) => {
    const spectatorClient = createClient(null);

    spectatorClient.on('connect', () => {
      spectatorClient.emit('join-tournament', testTournament._id.toString());
      setTimeout(() => {
        const dummyBracket = { rounds: [{ name: 'Final', matches: 1 }] };
        emitBracketUpdate(ioServer, testTournament._id.toString(), dummyBracket);
      }, 50);
    });

    spectatorClient.on('bracket-updated', (data) => {
      expect(data.tournamentId).toBe(testTournament._id.toString());
      expect(data.bracket.rounds[0].name).toBe('Final');
      spectatorClient.disconnect();
      done();
    });
  });
});

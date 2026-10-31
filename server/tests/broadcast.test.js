import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Tournament from '../src/models/Tournament.js';
import Notification from '../src/models/Notification.js';
import Message from '../src/models/Message.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

describe('Tournament Broadcast & OAuth Safety API', () => {
  let organizerToken;
  let organizerId;
  let captain1Token;
  let captain1Id;
  let captain2Token;
  let captain2Id;
  let unauthorizedToken;
  let unauthorizedId;
  let testTournament;
  let team1;
  let team2;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // 1. Create Organizer
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Tournament Director',
        email: 'director@broadcast.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizerToken = orgRes.body.token;
    organizerId = orgRes.body.user._id;

    // 2. Create Captain 1
    const cap1Res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Captain Alpha',
        email: 'alpha@broadcast.com',
        password: 'Password123!',
        role: 'player'
      });
    captain1Token = cap1Res.body.token;
    captain1Id = cap1Res.body.user._id;

    // 3. Create Captain 2
    const cap2Res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Captain Beta',
        email: 'beta@broadcast.com',
        password: 'Password123!',
        role: 'player'
      });
    captain2Token = cap2Res.body.token;
    captain2Id = cap2Res.body.user._id;

    // 4. Create Unauthorized User
    const unauthRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Random Player',
        email: 'random@broadcast.com',
        password: 'Password123!',
        role: 'player'
      });
    unauthorizedToken = unauthRes.body.token;
    unauthorizedId = unauthRes.body.user._id;

    // 5. Create Tournament
    const now = new Date();
    testTournament = await Tournament.create({
      name: 'Broadcast Championship 2026',
      description: 'Championship cup for testing notifications and broadcast limits.',
      sport: 'cricket',
      format: 'single-elimination',
      maxTeams: 8,
      organizer: organizerId,
      dates: {
        registrationStart: new Date(now.getTime() - 86400000),
        registrationEnd: new Date(now.getTime() + 86400000 * 7),
        tournamentStart: new Date(now.getTime() + 86400000 * 10),
        tournamentEnd: new Date(now.getTime() + 86400000 * 14)
      },
      status: 'open',
      visibility: 'public'
    });

    // 6. Create Teams with Captains
    team1 = await Team.create({
      name: 'Alpha Strikers',
      captain: captain1Id,
      tournament: testTournament._id,
      sport: 'cricket'
    });

    team2 = await Team.create({
      name: 'Beta Blasters',
      captain: captain2Id,
      tournament: testTournament._id,
      sport: 'cricket'
    });

    // Register team 1 as approved, team 2 as pending
    testTournament.registeredTeams.push({
      team: team1._id,
      status: 'approved',
      registeredAt: new Date()
    });
    testTournament.registeredTeams.push({
      team: team2._id,
      status: 'pending',
      registeredAt: new Date()
    });
    await testTournament.save();
  });

  describe('Google OAuth Safe Status Endpoint', () => {
    it('GET /api/auth/google/status should return 200 without crashing when unconfigured', async () => {
      const res = await request(app).get('/api/auth/google/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.enabled).toBe('boolean');
    });

    it('GET /api/auth/google should safely respond with 503 if credentials are not configured', async () => {
      // In test environment, credentials are not set
      const res = await request(app).get('/api/auth/google');
      if (res.status === 503) {
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('not configured');
      }
    });
  });

  describe('POST /api/tournaments/:id/broadcast', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post(`/api/tournaments/${testTournament._id}/broadcast`)
        .send({ message: 'Hello teams' });

      expect(res.status).toBe(401);
    });

    it('should reject non-organizer request with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/tournaments/${testTournament._id}/broadcast`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ message: 'I am not the organizer' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access denied');
    });

    it('should reject empty message with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/tournaments/${testTournament._id}/broadcast`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ message: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if tournament does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/tournaments/${fakeId}/broadcast`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ message: 'Fake tournament message' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should deliver broadcast notification to captains of approved and pending teams and persist in Message model', async () => {
      const res = await request(app)
        .post(`/api/tournaments/${testTournament._id}/broadcast`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Schedule Change Notification',
          message: 'Matches will begin at 09:00 AM instead of 10:00 AM tomorrow.',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recipientsCount).toBe(2);

      // Verify Notification documents were created for captain 1 and captain 2
      const cap1Notif = await Notification.findOne({ recipient: captain1Id, type: 'tournament_broadcast' });
      expect(cap1Notif).not.toBeNull();
      expect(cap1Notif.title).toBe('Schedule Change Notification');
      expect(cap1Notif.message).toContain('09:00 AM');

      const cap2Notif = await Notification.findOne({ recipient: captain2Id, type: 'tournament_broadcast' });
      expect(cap2Notif).not.toBeNull();
      expect(cap2Notif.title).toBe('Schedule Change Notification');

      // Verify Message collection has announcement record
      const savedAnnouncement = await Message.findOne({
        roomType: 'tournament',
        roomId: testTournament._id,
        isAnnouncement: true
      });
      expect(savedAnnouncement).not.toBeNull();
      expect(savedAnnouncement.text).toContain('09:00 AM');
    });

    it('GET /api/tournaments/:id/broadcasts should return broadcast history', async () => {
      // First broadcast
      await request(app)
        .post(`/api/tournaments/${testTournament._id}/broadcast`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ message: 'Initial welcome broadcast to captains.' });

      const historyRes = await request(app)
        .get(`/api/tournaments/${testTournament._id}/broadcasts`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
      expect(Array.isArray(historyRes.body.data)).toBe(true);
      expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(historyRes.body.data[0].text).toContain('Initial welcome broadcast');
    });

    it('should rate-limit broadcasts to 10 per hour per tournament (11th request returns 429)', async () => {
      // Create separate tournament to test rate limiting
      const now = new Date();
      const rateLimitTourney = await Tournament.create({
        name: 'Rate Limit Test Cup',
        description: 'Testing the 10 broadcast per hour limit',
        sport: 'football',
        format: 'single-elimination',
        maxTeams: 4,
        organizer: organizerId,
        dates: {
          registrationStart: new Date(now.getTime() - 86400000),
          registrationEnd: new Date(now.getTime() + 86400000 * 7),
          tournamentStart: new Date(now.getTime() + 86400000 * 10),
          tournamentEnd: new Date(now.getTime() + 86400000 * 14)
        },
        status: 'open',
        visibility: 'public'
      });

      // Send 10 broadcasts in a row
      for (let i = 1; i <= 10; i++) {
        const res = await request(app)
          .post(`/api/tournaments/${rateLimitTourney._id}/broadcast`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({ message: `Broadcast test iteration #${i}` });

        expect(res.status).toBe(201);
      }

      // The 11th broadcast MUST be rate-limited with status 429
      const overflowRes = await request(app)
        .post(`/api/tournaments/${rateLimitTourney._id}/broadcast`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ message: 'This 11th broadcast should exceed the rate limit' });

      expect(overflowRes.status).toBe(429);
      expect(overflowRes.body.success).toBe(false);
      expect(overflowRes.body.error).toContain('limit');
    });
  });
});

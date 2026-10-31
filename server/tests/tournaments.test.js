import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Tournament from '../src/models/Tournament.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

const makeTournamentPayload = (name = 'QA Premier Cricket Cup 2026') => {
  const now = new Date();
  const regStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const regEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tournStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const tournEnd = new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000);

  return {
    name,
    description: 'Official verification tournament for sports competitions.',
    sport: 'cricket',
    format: 'single-elimination',
    maxTeams: 16,
    registrationFee: 75,
    prizePool: { total: 1000 },
    venue: {
      name: 'QA National Stadium',
      address: '100 Stadium Boulevard',
      city: 'Metropolis',
      state: 'NY',
      country: 'US'
    },
    dates: {
      registrationStart: regStart.toISOString(),
      registrationEnd: regEnd.toISOString(),
      tournamentStart: tournStart.toISOString(),
      tournamentEnd: tournEnd.toISOString()
    },
    status: 'open',
    visibility: 'public'
  };
};

describe('Tournaments API (Create, Validate, Discover, Access Control)', () => {
  let organizerToken;
  let playerToken;
  let organizerId;
  let playerId;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    // Create Organizer
    const resOrg = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Tournament Organizer',
        email: 'organizer@tourney.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizerToken = resOrg.body.token;
    organizerId = resOrg.body.user._id || resOrg.body.user.id;

    // Create Player
    const resPlayer = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Tournament Player',
        email: 'player@tourney.com',
        password: 'Password123!',
        role: 'player'
      });
    playerToken = resPlayer.body.token;
    playerId = resPlayer.body.user._id || resPlayer.body.user.id;
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('POST /api/tournaments should reject invalid payload with 400 validation error', async () => {
    const res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: '',
        description: 'short',
        sport: 'cricket',
        format: 'single-elimination',
        maxTeams: 1
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/tournaments should allow organizer to create a tournament', async () => {
    const payload = makeTournamentPayload('Premier Cricket Cup 2026');

    const res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Premier Cricket Cup 2026');

    // Verify DB persistence
    const saved = await Tournament.findById(res.body.data._id);
    expect(saved).not.toBeNull();
    expect(String(saved.organizer)).toBe(String(organizerId));
  });

  test('GET /api/tournaments and GET /api/tournaments/:id should allow public discovery', async () => {
    const payload = makeTournamentPayload('Open Badminton Championship');
    payload.sport = 'badminton';

    const createRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(payload);

    expect(createRes.status).toBe(201);
    const tournamentId = createRes.body.data._id;

    // Discover in public list
    const listRes = await request(app).get('/api/tournaments');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    // Get tournament details
    const detailRes = await request(app).get(`/api/tournaments/${tournamentId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.name).toBe('Open Badminton Championship');
  });

  test('PUT and DELETE /api/tournaments/:id should block unauthorized players', async () => {
    const payload = makeTournamentPayload('Secured Football Cup');
    payload.sport = 'football';

    const createRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(payload);

    expect(createRes.status).toBe(201);
    const tournamentId = createRes.body.data._id;

    // Player attempts to update
    const putRes = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ name: 'Hacked Name' });
    expect([401, 403]).toContain(putRes.status);

    // Player attempts to delete
    const delRes = await request(app)
      .delete(`/api/tournaments/${tournamentId}`)
      .set('Authorization', `Bearer ${playerToken}`);
    expect([401, 403]).toContain(delRes.status);
  });
});

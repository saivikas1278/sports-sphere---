import request from 'supertest';
import app from '../src/app.js';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

const makeTournamentPayload = (name = 'Registration Flow Cup 2026') => {
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
    visibility: 'public',
    settings: {
      requireApproval: true
    }
  };
};

describe('Tournament Registration & Approval Flow', () => {
  let organizerToken;
  let playerToken;
  let playerId;
  let tournamentId;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    // 1. Create Organizer
    const resOrg = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Flow Organizer',
        email: 'organizer@flow.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizerToken = resOrg.body.token;

    // 2. Create Player
    const resPlayer = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Flow Player',
        email: 'player@flow.com',
        password: 'Password123!',
        role: 'player'
      });
    playerToken = resPlayer.body.token;
    playerId = resPlayer.body.user._id || resPlayer.body.user.id;

    // 3. Create Tournament
    const payload = makeTournamentPayload('Registration Flow Cup 2026');
    const resTourn = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(payload);

    tournamentId = resTourn.body.data._id;
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('POST /api/tournaments/:id/register should allow player to register a team', async () => {
    const regPayload = {
      name: 'Thunderbolts XI',
      shortName: 'TBXI',
      contactPhone: '555-0199',
      players: [{ user: playerId, role: 'captain' }]
    };

    const res = await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send(regPayload);

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);

    // Verify team was created in Team collection
    const createdTeam = await Team.findOne({ name: 'Thunderbolts XI' });
    expect(createdTeam).not.toBeNull();
    expect(createdTeam.shortName).toBe('TBXI');

    // Verify team was registered inside the Tournament document
    const updatedTourn = await Tournament.findById(tournamentId);
    expect(updatedTourn.registeredTeams.length).toBe(1);
    expect(String(updatedTourn.registeredTeams[0].team)).toBe(String(createdTeam._id));
    expect(updatedTourn.registeredTeams[0].status).toBe('pending');
  });

  test('PUT /api/tournaments/:id/registrations/:teamId/approve should allow organizer to approve team', async () => {
    // 1. Register Team
    await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        name: 'Thunderbolts XI',
        shortName: 'TBXI',
        contactPhone: '555-0199',
        players: [{ user: playerId, role: 'captain' }]
      });

    const team = await Team.findOne({ name: 'Thunderbolts XI' });
    expect(team).not.toBeNull();

    // 2. Organizer Approves Registration
    const approveRes = await request(app)
      .put(`/api/tournaments/${tournamentId}/registrations/${team._id}/approve`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({});

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);

    // 3. Verify Database Persistence of Approved Status
    const afterApproval = await Tournament.findById(tournamentId);
    const registeredEntry = afterApproval.registeredTeams.find(
      rt => String(rt.team) === String(team._id)
    );
    expect(registeredEntry).toBeDefined();
    expect(registeredEntry.status).toBe('approved');
  });

  test('GET /api/tournaments/my?type=registrations should return registered tournament with status and team info', async () => {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        name: 'Thunderbolts XI',
        shortName: 'TBXI',
        contactPhone: '555-0199',
        players: [{ user: playerId, role: 'captain' }]
      });

    const res = await request(app)
      .get('/api/tournaments/my?type=registrations')
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(tournamentId);
    expect(res.body.data[0].registrationStatus).toBe('pending');
    expect(res.body.data[0].myRole).toContain('Thunderbolts XI');
  });
});

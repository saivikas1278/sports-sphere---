import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Tournament from '../src/models/Tournament.js';
import Message from '../src/models/Message.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

describe('Team Chat API (Access Control, History Retrieval, Message Persistence)', () => {
  let captainToken;
  let captainId;
  let playerToken;
  let playerId;
  let outsiderToken;
  let outsiderId;
  let testTeam;
  let testTournament;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // 1. Create Captain
    const captainRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Captain Rogers',
        email: 'captain@avengers.com',
        password: 'Password123!',
        role: 'player'
      });
    captainToken = captainRes.body.token;
    captainId = captainRes.body.user._id;

    // 2. Create Team Player
    const playerRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Peter Parker',
        email: 'spidey@avengers.com',
        password: 'Password123!',
        role: 'player'
      });
    playerToken = playerRes.body.token;
    playerId = playerRes.body.user._id;

    // 3. Create Outsider (non-team member)
    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Bruce Wayne',
        email: 'bruce@wayne.com',
        password: 'Password123!',
        role: 'player'
      });
    outsiderToken = outsiderRes.body.token;
    outsiderId = outsiderRes.body.user._id;

    // 4. Create Organizer & Tournament
    const now = new Date();
    testTournament = await Tournament.create({
      name: 'Super Cup 2026',
      description: 'Championship cup',
      sport: 'football',
      format: 'single-elimination',
      maxTeams: 8,
      organizer: captainId,
      dates: {
        registrationStart: new Date(now.getTime() - 86400000),
        registrationEnd: new Date(now.getTime() + 86400000 * 7),
        tournamentStart: new Date(now.getTime() + 86400000 * 10),
        tournamentEnd: new Date(now.getTime() + 86400000 * 14)
      },
      status: 'open',
      visibility: 'public'
    });

    // 5. Create Team with Captain & Peter Parker in players list
    testTeam = await Team.create({
      name: 'Avengers FC',
      captain: captainId,
      tournament: testTournament._id,
      sport: 'football',
      players: [
        {
          user: playerId,
          role: 'player',
          jerseyNumber: 10,
          position: 'Striker'
        }
      ]
    });
  });

  describe('GET /api/chat/team/:roomId (Authorization & History)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .get(`/api/chat/team/${testTeam._id}`);

      expect(res.status).toBe(401);
    });

    it('should block non-member user with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/chat/team/${testTeam._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Not authorized');
    });

    it('should return 404 if team does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/chat/team/${fakeId}`)
        .set('Authorization', `Bearer ${captainToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Team not found');
    });

    it('should allow team captain to fetch messages', async () => {
      // Pre-seed a message
      await Message.create({
        roomType: 'team',
        roomId: testTeam._id,
        sender: captainId,
        text: 'Assemble at 6 PM sharp!'
      });

      const res = await request(app)
        .get(`/api/chat/team/${testTeam._id}`)
        .set('Authorization', `Bearer ${captainToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].text).toBe('Assemble at 6 PM sharp!');
      expect(res.body.data[0].sender.firstName).toBe('Captain');
    });

    it('should allow team player to fetch messages', async () => {
      const res = await request(app)
        .get(`/api/chat/team/${testTeam._id}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/chat/team/:roomId (Message Persistence & Authorization)', () => {
    it('should block non-member from sending message with 403', async () => {
      const res = await request(app)
        .post(`/api/chat/team/${testTeam._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ text: 'I want to join your chat!' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject message with empty text/media with 400', async () => {
      const res = await request(app)
        .post(`/api/chat/team/${testTeam._id}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .send({ text: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow team member to send message and persist in Message model', async () => {
      const res = await request(app)
        .post(`/api/chat/team/${testTeam._id}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ text: 'Bringing extra water bottles!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Bringing extra water bottles!');
      expect(res.body.data.sender.firstName).toBe('Peter');

      // Verify persisted in MongoDB
      const saved = await Message.findById(res.body.data._id);
      expect(saved).not.toBeNull();
      expect(saved.roomType).toBe('team');
      expect(saved.roomId.toString()).toBe(testTeam._id.toString());
      expect(saved.sender.toString()).toBe(playerId.toString());
      expect(saved.text).toBe('Bringing extra water bottles!');
    });
  });
});

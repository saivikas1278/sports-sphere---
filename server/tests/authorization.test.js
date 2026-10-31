import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Tournament from '../src/models/Tournament.js';
import AuditLog from '../src/models/AuditLog.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';
import { canModify } from '../src/middleware/authorization.js';

describe('Authorization & Audit Logging (canModify, Admin Role Management, Tournament Verification)', () => {
  let adminToken, adminUser;
  let organizer1Token, organizer1User;
  let organizer2Token, organizer2User;
  let playerToken, playerUser;
  let tournament1;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    // 1. Create Admin User (register as player, promote to admin in DB)
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Super Admin',
        email: 'admin@example.com',
        password: 'Password123!',
        role: 'player'
      });
    adminToken = adminRes.body.token;
    adminUser = adminRes.body.user;
    await User.findByIdAndUpdate(adminUser._id || adminUser.id, { role: 'admin' });
    adminUser.role = 'admin';

    // 2. Create Organizer 1
    const org1Res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Organizer One',
        email: 'org1@example.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizer1Token = org1Res.body.token;
    organizer1User = org1Res.body.user;

    // 3. Create Organizer 2
    const org2Res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Organizer Two',
        email: 'org2@example.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizer2Token = org2Res.body.token;
    organizer2User = org2Res.body.user;

    // 4. Create Normal Player
    const playerRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Normal Player',
        email: 'player@example.com',
        password: 'Password123!',
        role: 'player'
      });
    playerToken = playerRes.body.token;
    playerUser = playerRes.body.user;

    // 5. Create Tournament owned by Organizer 1
    const now = new Date();
    tournament1 = await Tournament.create({
      name: 'Organizer 1 Badminton Open',
      description: 'Championship hosted by Organizer 1 for badminton lovers.',
      sport: 'badminton',
      format: 'single-elimination',
      maxTeams: 8,
      organizer: organizer1User._id || organizer1User.id,
      status: 'open',
      dates: {
        registrationStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        registrationEnd: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        tournamentStart: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        tournamentEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      }
    });
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Pure canModify helper unit checks', () => {
    it('should return true for admin on any resource', () => {
      const dummyResource = { organizer: 'some_other_id' };
      expect(canModify(dummyResource, { role: 'admin', id: 'admin_id' })).toBe(true);
    });

    it('should return true for owner of resource', () => {
      const dummyTournament = { organizer: 'user_123' };
      expect(canModify(dummyTournament, { role: 'organizer', id: 'user_123' })).toBe(true);
    });

    it('should return false for non-owner and non-admin', () => {
      const dummyTournament = { organizer: 'user_123' };
      expect(canModify(dummyTournament, { role: 'organizer', id: 'user_456' })).toBe(false);
      expect(canModify(dummyTournament, { role: 'player', id: 'user_789' })).toBe(false);
    });
  });

  describe('User Role Modification & Audit Logging', () => {
    it('admin can change role and action is logged in AuditLog', async () => {
      const res = await request(app)
        .put(`/api/users/${playerUser._id || playerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'organizer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('organizer');

      // Verify DB update
      const dbUser = await User.findById(playerUser._id || playerUser.id);
      expect(dbUser.role).toBe('organizer');

      // Verify AuditLog entry
      const auditEntry = await AuditLog.findOne({
        who: adminUser._id || adminUser.id,
        'target.id': dbUser._id
      });
      expect(auditEntry).not.toBeNull();
      expect(auditEntry.what).toContain('organizer');
      expect(auditEntry.when).toBeDefined();
    });

    it('normal user cannot change role (blocked with 403)', async () => {
      // Player tries to promote self to admin
      const selfRes = await request(app)
        .put(`/api/users/${playerUser._id || playerUser.id}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ role: 'admin' });

      expect(selfRes.status).toBe(403);
      expect(selfRes.body.success).toBe(false);
      expect(selfRes.body.error).toMatch(/administrators/i);

      // Verify DB role was not modified
      const dbUser = await User.findById(playerUser._id || playerUser.id);
      expect(dbUser.role).toBe('player');

      // Player tries to change another user's role
      const otherRes = await request(app)
        .put(`/api/users/${organizer1User._id || organizer1User.id}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ role: 'player' });

      expect(otherRes.status).toBe(403);
    });

    it('prevent an admin from demoting themselves if they are the last admin', async () => {
      // Currently only 1 admin exists (adminUser)
      const demoteRes = await request(app)
        .put(`/api/users/${adminUser._id || adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'player' });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.success).toBe(false);
      expect(demoteRes.body.error).toMatch(/last remaining administrator/i);

      // Admin role must remain unchanged
      const dbAdmin = await User.findById(adminUser._id || adminUser.id);
      expect(dbAdmin.role).toBe('admin');
    });

    it('allows an admin to demote if another admin exists', async () => {
      // Create second admin
      const secondAdminRes = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Second Admin',
          email: 'admin2@example.com',
          password: 'Password123!',
          role: 'player'
        });
      const secondAdminId = secondAdminRes.body.user._id || secondAdminRes.body.user.id;
      await User.findByIdAndUpdate(secondAdminId, { role: 'admin' });

      // Now 2 admins exist, so demoting adminUser should succeed
      const demoteRes = await request(app)
        .put(`/api/users/${adminUser._id || adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'organizer' });

      expect(demoteRes.status).toBe(200);
      expect(demoteRes.body.data.role).toBe('organizer');
    });
  });

  describe('Tournament Authorization & Admin Verification', () => {
    it('organizer cannot edit another organizers tournament (blocked with 403/401)', async () => {
      const res = await request(app)
        .put(`/api/tournaments/${tournament1._id}`)
        .set('Authorization', `Bearer ${organizer2Token}`)
        .send({ name: 'Hacked by Organizer 2' });

      expect([401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Verify name was not modified in DB
      const dbTourn = await Tournament.findById(tournament1._id);
      expect(dbTourn.name).toBe('Organizer 1 Badminton Open');
    });

    it('admin can edit another organizers tournament and verify it', async () => {
      const res = await request(app)
        .put(`/api/tournaments/${tournament1._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isVerified: true, status: 'open' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(true);

      // Verify DB update
      const dbTourn = await Tournament.findById(tournament1._id);
      expect(dbTourn.isVerified).toBe(true);

      // Verify AuditLog entry for tournament verification
      const auditEntry = await AuditLog.findOne({
        who: adminUser._id || adminUser.id,
        'target.id': tournament1._id
      });
      expect(auditEntry).not.toBeNull();
      expect(auditEntry.what).toMatch(/Verified tournament/i);
    });
  });
});

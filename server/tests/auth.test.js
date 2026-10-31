import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import crypto from 'crypto';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

describe('Authentication API (Register, Login, Password Reset)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('POST /api/auth/register should create organizer account and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Organizer',
        email: 'organizer@test.com',
        password: 'Password123!',
        role: 'organizer'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('organizer');

    const dbUser = await User.findOne({ email: 'organizer@test.com' });
    expect(dbUser).not.toBeNull();
    expect(dbUser.role).toBe('organizer');
  });

  test('POST /api/auth/register should create player account and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Player',
        email: 'player@test.com',
        password: 'Password123!',
        role: 'player'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('player');
  });

  test('POST /api/auth/login should authenticate with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Login User',
        email: 'login@test.com',
        password: 'Password123!',
        role: 'player'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@test.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
  });

  test('POST /api/auth/login should reject invalid credentials with 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Login User',
        email: 'login@test.com',
        password: 'Password123!',
        role: 'player'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@test.com',
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/forgot-password returns generic 200 message and does not leak token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Reset User',
        email: 'reset@test.com',
        password: 'Password123!',
        role: 'player'
      });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('If that email exists, a reset link has been sent');
    expect(res.body.resetToken).toBeUndefined();

    // Verify SHA-256 hash was stored in DB
    const userDoc = await User.findOne({ email: 'reset@test.com' });
    expect(userDoc.resetPasswordToken).toBeDefined();
    expect(userDoc.resetPasswordToken).toHaveLength(64);
    expect(userDoc.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
  });

  test('PUT /api/auth/reset-password/:resetToken sets new password and invalidates token', async () => {
    const user = await User.create({
      firstName: 'Reset',
      lastName: 'Tester',
      email: 'resettester@test.com',
      password: 'OldPassword123!'
    });

    const plainToken = 'raw-test-token-value-123456';
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Reset password
    const resetRes = await request(app)
      .put(`/api/auth/reset-password/${plainToken}`)
      .send({ password: 'BrandNewPassword123!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify token is invalidated in DB
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.resetPasswordToken).toBeUndefined();
    expect(updatedUser.resetPasswordExpire).toBeUndefined();

    // Verify token cannot be reused
    const reuseRes = await request(app)
      .put(`/api/auth/reset-password/${plainToken}`)
      .send({ password: 'AnotherPassword123!' });
    expect(reuseRes.status).toBe(400);

    // Verify login with new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'resettester@test.com',
        password: 'BrandNewPassword123!'
      });
    expect(loginRes.status).toBe(200);
  });
});

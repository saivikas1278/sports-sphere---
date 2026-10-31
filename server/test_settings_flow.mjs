import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';

async function testSettingsFlow() {
  console.log('Testing Admin Platform Settings Flow...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = (await import('./src/models/User.js')).default;

    const timestamp = Date.now();

    // 1. Public read
    const pubRes = await axios.get(`${API_BASE}/settings`);
    console.log('Public GET /api/settings status:', pubRes.status, 'Platform:', pubRes.data?.data?.platformName);

    // 2. Register Player (non-admin)
    const playerRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Regular Player',
      email: `player_${timestamp}@test.com`,
      password: 'Password@123',
      role: 'player'
    });
    const playerToken = playerRes.data.token;

    // 3. Player attempts to update settings (must be blocked 403)
    let blocked = false;
    try {
      await axios.put(
        `${API_BASE}/settings`,
        { platformName: 'Hacked Name' },
        { headers: { Authorization: `Bearer ${playerToken}` } }
      );
    } catch (err) {
      if (err.response?.status === 403) {
        blocked = true;
        console.log('Player blocked from updating platform settings with 403 Forbidden');
      }
    }
    if (!blocked) {
      console.error('FAILURE: Player was not blocked with 403');
      process.exit(1);
    }

    // 4. Register Admin (register, then promote in DB)
    const adminRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Platform Admin',
      email: `admin_${timestamp}@test.com`,
      password: 'Password@123',
      role: 'player'
    });
    const adminId = adminRes.data.user?._id || adminRes.data.user?.id;
    await User.findByIdAndUpdate(adminId, { role: 'admin' });
    
    // Login to get fresh JWT token with admin role
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: `admin_${timestamp}@test.com`,
      password: 'Password@123'
    });
    const adminToken = loginRes.data.token;

    // 5. Admin updates settings
    const updateRes = await axios.put(
      `${API_BASE}/settings`,
      {
        platformName: 'SportSphere Global',
        supportEmail: 'ops@sportsphere.com',
        platformFeePercentage: 7,
        maintenanceMode: false,
        stripeEnabled: true
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Admin PUT /api/settings status:', updateRes.status, 'Updated Name:', updateRes.data?.data?.platformName);

    // 6. Verify persistence via public GET
    const verifyRes = await axios.get(`${API_BASE}/settings`);
    if (
      verifyRes.data?.data?.platformName === 'SportSphere Global' &&
      verifyRes.data?.data?.platformFeePercentage === 7 &&
      verifyRes.data?.data?.supportEmail === 'ops@sportsphere.com'
    ) {
      console.log('SUCCESS: Platform settings verified and persisted in MongoDB!');
    } else {
      console.error('FAILURE: Settings do not match expected state:', verifyRes.data);
      process.exit(1);
    }

    await mongoose.disconnect();
    console.log('--- ALL PLATFORM SETTINGS TESTS PASSED ---');
  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
    if (mongoose.connection.readyState) await mongoose.disconnect();
    process.exit(1);
  }
}

testSettingsFlow();

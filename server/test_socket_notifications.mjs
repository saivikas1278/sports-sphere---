import axios from 'axios';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { io: Client } = require('../client/node_modules/socket.io-client');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function testSocketNotifications() {
  console.log('Testing Real-Time WebSocket Notification Dispatch via Live Server...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = (await import('./src/models/User.js')).default;

    const timestamp = Date.now();

    // 1. Register recipient user
    const recipientRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Recipient Athlete',
      email: `recipient_${timestamp}@test.com`,
      password: 'Password@123',
      role: 'player'
    });
    const recipientToken = recipientRes.data.token;
    const recipientId = recipientRes.data.user?._id || recipientRes.data.user?.id;
    console.log('Recipient registered successfully with ID:', recipientId);

    // 2. Connect client socket authenticated with recipient token
    const clientSocket = Client(SOCKET_URL, {
      auth: { token: recipientToken },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 6000);
      clientSocket.on('connect', () => {
        clearTimeout(timeout);
        console.log('Recipient client socket connected successfully:', clientSocket.id);
        resolve();
      });
      clientSocket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // 3. Set up notification event listener promise
    const notificationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Notification not received via socket within timeout')), 8000);
      
      const onNotification = (data) => {
        const notifData = data.notification || data;
        console.log('SUCCESS: Real-time notification received on client socket:', notifData.title);
        clearTimeout(timeout);
        resolve(notifData);
      };

      clientSocket.on('notification', onNotification);
      clientSocket.on('notification-received', onNotification);
    });

    // 4. Create an Admin account to trigger POST /api/notifications
    const adminRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'System Notifier',
      email: `admin_notifier_${timestamp}@test.com`,
      password: 'Password@123',
      role: 'player'
    });
    const adminId = adminRes.data.user?._id || adminRes.data.user?.id;
    await User.findByIdAndUpdate(adminId, { role: 'admin' });

    // Login as admin
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: `admin_notifier_${timestamp}@test.com`,
      password: 'Password@123'
    });
    const adminToken = loginRes.data.token;

    console.log('Admin authenticated. Triggering POST /api/notifications on live running server...');
    const postNotifRes = await axios.post(
      `${API_BASE}/notifications`,
      {
        recipient: recipientId,
        type: 'system',
        title: 'Championship Live Alert',
        message: 'Your tournament bracket has been generated and is ready for play!'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Notification API responded with status:', postNotifRes.status);

    // 5. Await socket message receipt
    const receivedNotification = await notificationPromise;
    clientSocket.disconnect();
    await mongoose.disconnect();

    if (receivedNotification.title === 'Championship Live Alert') {
      console.log('SUCCESS: Real-time WebSocket notification dispatch verified with 100% accuracy!');
      console.log('--- ALL NOTIFICATION SOCKET TESTS PASSED ---');
      process.exit(0);
    } else {
      console.error('FAILURE: Unexpected notification payload:', receivedNotification);
      process.exit(1);
    }
  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
    if (mongoose.connection.readyState) await mongoose.disconnect();
    process.exit(1);
  }
}

testSocketNotifications();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import tournamentRoutes from './routes/tournaments.js';
import matchRoutes from './routes/matches.js';
import teamRoutes from './routes/teams.js';
import videoRoutes from './routes/videos.js';
import fitnessRoutes from './routes/fitness.js';
import postRoutes from './routes/posts.js';
import profileRoutes from './routes/profiles.js';
import notificationRoutes from './routes/notifications.js';
import contactRoutes from './routes/contact.js';
import searchRoutes from './routes/search.js';
import testRoutes from './routes/test.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './utils/socketHandlers.js';
import passport from 'passport';
import './config/passport.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // Allow specific origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowEIO3: true
  },
  transports: ['websocket', 'polling']
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // Allow specific origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize passport
app.use(passport.initialize());

// Serve static files (like uploaded avatars)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Socket.io setup
setupSocketHandlers(io);
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/test', testRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SportSphere API is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const FALLBACK_PORTS = [5000, 5001, 5002, 5003, 5004];

const startServer = async (ports) => {
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const serverInstance = server.listen(port, () => {
          console.log(`🚀 SportSphere server running on port ${port}`);
          console.log(`📊 Environment: ${process.env.NODE_ENV}`);
          resolve();
        });

        serverInstance.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is in use, trying next port...`);
            serverInstance.close();
            reject(err);
          } else {
            console.error('Server error:', err);
            reject(err);
          }
        });
      });
      // If we reach here, the server started successfully
      return;
    } catch (err) {
      if (port === ports[ports.length - 1]) {
        console.error('❌ All ports are in use. Please free up a port or specify a different port in .env');
        process.exit(1);
      }
      // Continue to next port
    }
  }
};

// Start the server with fallback ports
startServer(FALLBACK_PORTS);

export default app;

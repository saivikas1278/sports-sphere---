import app, { startServer, FALLBACK_PORTS } from './app.js';
import connectDB from './config/database.js';

// Connect to MongoDB and start HTTP listener if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  startServer(FALLBACK_PORTS);
}

export default app;

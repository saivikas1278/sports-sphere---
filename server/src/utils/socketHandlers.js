import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocketHandlers = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        // Allow anonymous connections in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔌 Anonymous connection allowed in development: ${socket.id}`);
          socket.user = null;
          return next();
        }
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }
        
        socket.user = user;
        console.log(`🔐 Authenticated user connected: ${user.firstName} ${user.lastName} (${socket.id})`);
        next();
      } catch (jwtError) {
        // Allow anonymous connections in development with invalid tokens
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔌 Invalid token, allowing anonymous connection in development: ${socket.id}`);
          socket.user = null;
          return next();
        }
        return next(new Error('Authentication error: Invalid token'));
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    // Send authentication status
    socket.emit('auth_status', {
      authenticated: !!socket.user,
      user: socket.user ? {
        id: socket.user._id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        email: socket.user.email,
        role: socket.user.role
      } : null
    });

    // Join tournament room
    socket.on('join-tournament', (tournamentId) => {
      socket.join(`tournament-${tournamentId}`);
      console.log(`📺 User ${socket.id} joined tournament ${tournamentId}`);
    });

    // Leave tournament room
    socket.on('leave-tournament', (tournamentId) => {
      socket.leave(`tournament-${tournamentId}`);
      console.log(`📺 User ${socket.id} left tournament ${tournamentId}`);
    });

    // Join match room
    socket.on('join-match', (matchId) => {
      socket.join(`match-${matchId}`);
      console.log(`⚽ User ${socket.id} joined match ${matchId}`);
    });

    // Leave match room
    socket.on('leave-match', (matchId) => {
      socket.leave(`match-${matchId}`);
      console.log(`⚽ User ${socket.id} left match ${matchId}`);
    });

    // Handle live score updates
    socket.on('score-update', (data) => {
      const { matchId, homeScore, awayScore, event } = data;
      
      // Broadcast to all users watching this match
      socket.to(`match-${matchId}`).emit('score-updated', {
        matchId,
        homeScore,
        awayScore,
        event,
        timestamp: new Date()
      });

      // Also broadcast to tournament room
      if (data.tournamentId) {
        socket.to(`tournament-${data.tournamentId}`).emit('match-score-updated', {
          matchId,
          homeScore,
          awayScore,
          event,
          timestamp: new Date()
        });
      }
    });

    // Handle match events (goals, cards, etc.)
    socket.on('match-event', (data) => {
      const { matchId, event, tournamentId } = data;
      
      // Broadcast to match room
      socket.to(`match-${matchId}`).emit('match-event-added', {
        matchId,
        event,
        timestamp: new Date()
      });

      // Broadcast to tournament room
      if (tournamentId) {
        socket.to(`tournament-${tournamentId}`).emit('tournament-match-event', {
          matchId,
          event,
          timestamp: new Date()
        });
      }
    });

    // Handle match status changes
    socket.on('match-status-change', (data) => {
      const { matchId, status, tournamentId } = data;
      
      socket.to(`match-${matchId}`).emit('match-status-changed', {
        matchId,
        status,
        timestamp: new Date()
      });

      if (tournamentId) {
        socket.to(`tournament-${tournamentId}`).emit('tournament-match-status-changed', {
          matchId,
          status,
          timestamp: new Date()
        });
      }
    });

    // Handle live video streaming
    socket.on('join-live-stream', (streamId) => {
      socket.join(`stream-${streamId}`);
      console.log(`📹 User ${socket.id} joined live stream ${streamId}`);
    });

    socket.on('leave-live-stream', (streamId) => {
      socket.leave(`stream-${streamId}`);
      console.log(`📹 User ${socket.id} left live stream ${streamId}`);
    });

    // Handle live chat during streams
    socket.on('stream-chat-message', (data) => {
      const { streamId, message, user } = data;
      
      socket.to(`stream-${streamId}`).emit('stream-chat-message-received', {
        message,
        user,
        timestamp: new Date()
      });
    });

    // Handle notifications
    socket.on('join-user-notifications', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`🔔 User ${socket.id} joined notifications for user ${userId}`);
    });

    socket.on('leave-user-notifications', (userId) => {
      socket.leave(`user-${userId}`);
      console.log(`🔔 User ${socket.id} left notifications for user ${userId}`);
    });

    // Handle tournament bracket updates
    socket.on('bracket-update', (data) => {
      const { tournamentId, bracket } = data;
      
      socket.to(`tournament-${tournamentId}`).emit('bracket-updated', {
        tournamentId,
        bracket,
        timestamp: new Date()
      });
    });

    // Handle direct messaging (chat)
    socket.on('join-chat', (conversationId) => {
      socket.join(`chat-${conversationId}`);
      console.log(`💬 User ${socket.id} joined chat ${conversationId}`);
    });

    socket.on('leave-chat', (conversationId) => {
      socket.leave(`chat-${conversationId}`);
      console.log(`💬 User ${socket.id} left chat ${conversationId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
};

// Helper functions to emit events from controllers
export const emitScoreUpdate = (io, matchId, tournamentId, homeScore, awayScore, event) => {
  io.to(`match-${matchId}`).emit('score-updated', {
    matchId,
    homeScore,
    awayScore,
    event,
    timestamp: new Date()
  });

  if (tournamentId) {
    io.to(`tournament-${tournamentId}`).emit('match-score-updated', {
      matchId,
      homeScore,
      awayScore,
      event,
      timestamp: new Date()
    });
  }
};

export const emitMatchEvent = (io, matchId, tournamentId, event) => {
  io.to(`match-${matchId}`).emit('match-event-added', {
    matchId,
    event,
    timestamp: new Date()
  });

  if (tournamentId) {
    io.to(`tournament-${tournamentId}`).emit('tournament-match-event', {
      matchId,
      event,
      timestamp: new Date()
    });
  }
};

export const emitNotification = (io, userId, notification) => {
  io.to(`user-${userId}`).emit('notification-received', {
    notification,
    timestamp: new Date()
  });
};

export const emitBracketUpdate = (io, tournamentId, bracket) => {
  io.to(`tournament-${tournamentId}`).emit('bracket-updated', {
    tournamentId,
    bracket,
    timestamp: new Date()
  });
};

export const emitChatMessage = (io, conversationId, message) => {
  io.to(`chat-${conversationId}`).emit('new-message', {
    conversationId,
    message,
    timestamp: new Date()
  });
};

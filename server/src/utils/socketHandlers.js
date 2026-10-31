import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';

export const setupSocketHandlers = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        // Public anonymous connection allowed (for live boards and spectators)
        socket.user = null;
        return next();
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        socket.user = user || null;
        if (user) {
          console.log(`🔐 Authenticated user connected: ${user.firstName} ${user.lastName} (${socket.id})`);
        }
        next();
      } catch (jwtError) {
        // Allow anonymous connection even if token expired or invalid
        socket.user = null;
        return next();
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.user = null;
      next();
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

    // Auto-join personal user room for direct notification push
    if (socket.user) {
      const uid = String(socket.user._id || socket.user.id);
      socket.join(`user_${uid}`);
      socket.join(`user-${uid}`);
      console.log(`👤 User ${uid} auto-joined notification rooms user_${uid} / user-${uid}`);
    }

    // Listen for explicit user notification room registration
    const joinUserRoom = (userData) => {
      const uid = extractId(userData);
      if (uid) {
        socket.join(`user_${uid}`);
        socket.join(`user-${uid}`);
        console.log(`👤 Socket ${socket.id} joined user room user_${uid}`);
      }
    };
    socket.on('join_user', joinUserRoom);
    socket.on('join-user', joinUserRoom);
    socket.on('join_user_room', joinUserRoom);

    // Helper to extract ID from string, number, or object payload
    const extractId = (val) => {
      if (!val) return null;
      if (typeof val === 'string' || typeof val === 'number') return String(val);
      if (typeof val === 'object') {
        return val.tournamentId || val.matchId || val.roomId || val.id || val._id || null;
      }
      return String(val);
    };

    // Join tournament room (support both hyphen and underscore)
    const joinTournamentRoom = (tournamentId) => {
      const id = extractId(tournamentId);
      if (id) {
        socket.join(`tournament-${id}`);
        socket.join(`tournament_${id}`);
        console.log(`📺 User ${socket.id} joined tournament ${id}`);
      }
    };
    socket.on('join-tournament', joinTournamentRoom);
    socket.on('join_tournament', joinTournamentRoom);

    // Leave tournament room
    const leaveTournamentRoom = (tournamentId) => {
      const id = extractId(tournamentId);
      if (id) {
        socket.leave(`tournament-${id}`);
        socket.leave(`tournament_${id}`);
        console.log(`📺 User ${socket.id} left tournament ${id}`);
      }
    };
    socket.on('leave-tournament', leaveTournamentRoom);
    socket.on('leave_tournament', leaveTournamentRoom);

    // Join match room (support both hyphen and underscore)
    const joinMatchRoom = (matchId) => {
      const id = extractId(matchId);
      if (id) {
        socket.join(`match-${id}`);
        socket.join(`match_${id}`);
        console.log(`⚽ User ${socket.id} joined match ${id}`);
      }
    };
    socket.on('join-match', joinMatchRoom);
    socket.on('join_match', joinMatchRoom);

    // Leave match room
    const leaveMatchRoom = (matchId) => {
      const id = extractId(matchId);
      if (id) {
        socket.leave(`match-${id}`);
        socket.leave(`match_${id}`);
        console.log(`⚽ User ${socket.id} left match ${id}`);
      }
    };
    socket.on('leave-match', leaveMatchRoom);
    socket.on('leave_match', leaveMatchRoom);

    // Helper to validate that socket emitter is assigned scorer, tournament organizer, or admin
    const validateScorerOrOrganizer = async (matchId, tournamentId) => {
      if (!socket.user) {
        return { authorized: false, error: 'Authentication required to update score' };
      }

      const match = await Match.findById(matchId);
      if (!match) {
        return { authorized: false, error: 'Match not found' };
      }

      const tourneyId = tournamentId || match.tournament;
      const tournament = tourneyId ? await Tournament.findById(tourneyId) : null;

      const userId = (socket.user._id || socket.user.id).toString();
      const isAdmin = socket.user.role === 'admin';
      const isOrganizer = tournament?.organizer?.toString() === userId;
      const isScorer = (match.scorer && match.scorer.toString() === userId) ||
                       (match.referee?.main && match.referee.main.toString() === userId);

      if (!isAdmin && !isOrganizer && !isScorer) {
        return {
          authorized: false,
          error: 'Not authorized: You must be the assigned scorer or tournament organizer'
        };
      }

      return { authorized: true, match, tournament: tournament || { _id: tourneyId } };
    };

    // Handle live score updates (supporting score-update and match:update_score)
    const handleLiveScoreUpdate = async (data) => {
      const { matchId, homeScore, awayScore, event, tournamentId, setsData, cricketData, status } = data || {};
      const check = await validateScorerOrOrganizer(matchId, tournamentId);
      if (!check.authorized) {
        return socket.emit('error', { message: check.error });
      }

      const tourneyId = tournamentId || check.match?.tournament;
      const payload = {
        matchId,
        homeScore,
        awayScore,
        score: { home: homeScore, away: awayScore },
        event,
        setsData,
        cricketData,
        status,
        timestamp: new Date()
      };
      
      // Broadcast to all users watching this match (support kebab and colon events)
      socket.to(`match-${matchId}`).emit('score-updated', payload);
      socket.to(`match_${matchId}`).emit('score-updated', payload);
      socket.to(`match-${matchId}`).emit('match:score_updated', payload);
      socket.to(`match_${matchId}`).emit('match:score_updated', payload);

      // Also broadcast to tournament room
      if (tourneyId) {
        socket.to(`tournament-${tourneyId}`).emit('match-score-updated', payload);
        socket.to(`tournament_${tourneyId}`).emit('match-score-updated', payload);
        socket.to(`tournament-${tourneyId}`).emit('score-updated', payload);
        socket.to(`tournament_${tourneyId}`).emit('score-updated', payload);
        socket.to(`tournament-${tourneyId}`).emit('match:score_updated', payload);
        socket.to(`tournament_${tourneyId}`).emit('match:score_updated', payload);
      }
    };
    socket.on('score-update', handleLiveScoreUpdate);
    socket.on('match:update_score', handleLiveScoreUpdate);

    // Handle match events (goals, cards, etc.)
    socket.on('match-event', async (data) => {
      const { matchId, event, tournamentId } = data || {};
      const check = await validateScorerOrOrganizer(matchId, tournamentId);
      if (!check.authorized) {
        return socket.emit('error', { message: check.error });
      }

      const tourneyId = tournamentId || check.match?.tournament;
      const payload = {
        matchId,
        event,
        timestamp: new Date()
      };
      
      // Broadcast to match room
      socket.to(`match-${matchId}`).emit('match-event-added', payload);
      socket.to(`match_${matchId}`).emit('match-event-added', payload);

      // Broadcast to tournament room
      if (tourneyId) {
        socket.to(`tournament-${tourneyId}`).emit('tournament-match-event', payload);
        socket.to(`tournament_${tourneyId}`).emit('tournament-match-event', payload);
      }
    });

    // Handle match status changes
    socket.on('match-status-change', async (data) => {
      const { matchId, status, tournamentId } = data || {};
      const check = await validateScorerOrOrganizer(matchId, tournamentId);
      if (!check.authorized) {
        return socket.emit('error', { message: check.error });
      }

      const tourneyId = tournamentId || check.match?.tournament;
      const payload = {
        matchId,
        status,
        timestamp: new Date()
      };
      
      socket.to(`match-${matchId}`).emit('match-status-changed', payload);
      socket.to(`match_${matchId}`).emit('match-status-changed', payload);

      if (tourneyId) {
        socket.to(`tournament-${tourneyId}`).emit('tournament-match-status-changed', payload);
        socket.to(`tournament_${tourneyId}`).emit('tournament-match-status-changed', payload);
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

    // Handle Team/Tournament Chat Rooms
    socket.on('join_room', async ({ roomType, roomId }) => {
      try {
        if (roomType === 'team') {
          if (!socket.user) {
            socket.emit('error', { message: 'Authentication required to join team chat' });
            return;
          }

          const team = await Team.findById(roomId);
          if (!team) {
            socket.emit('error', { message: 'Team not found' });
            return;
          }

          const userId = socket.user._id.toString();
          const isCaptain = team.captain.toString() === userId;
          const isPlayer = team.players && team.players.some(p => p.user && p.user.toString() === userId);
          const isAdmin = socket.user.role === 'admin';

          if (!isCaptain && !isPlayer && !isAdmin) {
            socket.emit('error', { message: 'Not authorized to join this team chat' });
            return;
          }
        }

        socket.join(`${roomType}_${roomId}`);
        console.log(`💬 User ${socket.id} joined ${roomType} room ${roomId}`);
      } catch (err) {
        console.error('Error joining room:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('leave_room', ({ roomType, roomId }) => {
      socket.leave(`${roomType}_${roomId}`);
      console.log(`💬 User ${socket.id} left ${roomType} room ${roomId}`);
    });

    socket.on('send_message', async (data, callback) => {
      try {
        const { roomType, roomId, text, senderId, isAnnouncement } = data;
        const actualSenderId = socket.user?._id || senderId;

        if (!actualSenderId) {
          const errPayload = { message: 'Authentication required to send message' };
          socket.emit('error', errPayload);
          if (typeof callback === 'function') callback({ success: false, error: errPayload.message });
          return;
        }

        if (roomType === 'team') {
          const team = await Team.findById(roomId);
          if (!team) {
            const errPayload = { message: 'Team not found' };
            socket.emit('error', errPayload);
            if (typeof callback === 'function') callback({ success: false, error: errPayload.message });
            return;
          }

          const userId = actualSenderId.toString();
          const isCaptain = team.captain.toString() === userId;
          const isPlayer = team.players && team.players.some(p => p.user && p.user.toString() === userId);
          const isAdmin = socket.user && socket.user.role === 'admin';

          if (!isCaptain && !isPlayer && !isAdmin) {
            const errPayload = { message: 'Not authorized to send messages to this team chat' };
            socket.emit('error', errPayload);
            if (typeof callback === 'function') callback({ success: false, error: errPayload.message });
            return;
          }
        }

        // Save to MongoDB
        const newMessage = await Message.create({
          roomType,
          roomId,
          text,
          sender: actualSenderId,
          isAnnouncement: isAnnouncement || false
        });
        
        // Populate sender info
        await newMessage.populate('sender', 'firstName lastName avatar');
        
        // Emit to room
        io.to(`${roomType}_${roomId}`).emit('new_message', newMessage);

        if (typeof callback === 'function') {
          callback({ success: true, data: newMessage });
        }
      } catch (err) {
        console.error('Error saving room message:', err);
        socket.emit('error', { message: 'Failed to send message' });
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to send message' });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
};

// Helper functions to emit events from controllers
export const emitScoreUpdate = (io, matchId, tournamentId, homeScore, awayScore, event, extraData = {}) => {
  const payload = {
    matchId,
    homeScore,
    awayScore,
    score: { home: homeScore, away: awayScore },
    event,
    timestamp: new Date(),
    ...extraData
  };
  io.to(`match-${matchId}`).emit('score-updated', payload);
  io.to(`match_${matchId}`).emit('score-updated', payload);
  io.to(`match-${matchId}`).emit('match:score_updated', payload);
  io.to(`match_${matchId}`).emit('match:score_updated', payload);

  if (tournamentId) {
    io.to(`tournament-${tournamentId}`).emit('match-score-updated', payload);
    io.to(`tournament_${tournamentId}`).emit('match-score-updated', payload);
    io.to(`tournament-${tournamentId}`).emit('score-updated', payload);
    io.to(`tournament_${tournamentId}`).emit('score-updated', payload);
    io.to(`tournament-${tournamentId}`).emit('match:score_updated', payload);
    io.to(`tournament_${tournamentId}`).emit('match:score_updated', payload);
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
  if (!io || !userId) return;
  const uid = String(userId);
  const payload = notification?.toObject ? notification.toObject() : notification;
  io.to(`user_${uid}`).emit('notification', payload);
  io.to(`user-${uid}`).emit('notification', payload);
  io.to(`user_${uid}`).emit('notification-received', { notification: payload, timestamp: new Date() });
  io.to(`user-${uid}`).emit('notification-received', { notification: payload, timestamp: new Date() });
};

export const emitBracketUpdate = (io, tournamentId, bracket) => {
  const payload = {
    tournamentId,
    bracket,
    timestamp: new Date()
  };
  io.to(`tournament-${tournamentId}`).emit('bracket-updated', payload);
  io.to(`tournament_${tournamentId}`).emit('bracket-updated', payload);
  io.to(`tournament-${tournamentId}`).emit('tournament:bracket_updated', bracket);
  io.to(`tournament_${tournamentId}`).emit('tournament:bracket_updated', bracket);
};

export const emitChatMessage = (io, conversationId, message) => {
  io.to(`chat-${conversationId}`).emit('new-message', {
    conversationId,
    message,
    timestamp: new Date()
  });
};

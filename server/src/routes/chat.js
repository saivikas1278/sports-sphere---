import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  getRoomMessages,
  sendRoomMessage
} from '../controllers/chat.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/conversations')
  .get(getConversations)
  .post(createConversation);

router.route('/messages/:conversationId')
  .get(getMessages)
  .post(sendMessage);

router.route('/:roomType/:roomId')
  .get(getRoomMessages)
  .post(sendRoomMessage);

export default router;

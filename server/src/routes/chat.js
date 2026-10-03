import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  getRoomMessages
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

router.get('/:roomType/:roomId', getRoomMessages);

export default router;

import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage
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

export default router;

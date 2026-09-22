import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { emitChatMessage } from '../utils/socketHandlers.js';

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'firstName lastName avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create or get a direct conversation
// @route   POST /api/chat/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'Participant ID is required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user.id, participantId] }
    }).populate('participants', 'firstName lastName avatar');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
        isGroup: false
      });
      conversation = await conversation.populate('participants', 'firstName lastName avatar');
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId
    })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages/:conversationId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text, media } = req.body;
    const conversationId = req.params.conversationId;

    if (!text && !media) {
      return res.status(400).json({ success: false, message: 'Message text or media is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify user is part of conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this conversation' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      text,
      media
    });

    await message.populate('sender', 'firstName lastName avatar');

    // Update last message in conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      emitChatMessage(io, conversationId, message);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

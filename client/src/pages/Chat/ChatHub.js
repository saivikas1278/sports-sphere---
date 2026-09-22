import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConversations } from '../../redux/slices/chatSlice';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import socketService from '../../services/socket';
import { addRealtimeMessage } from '../../redux/slices/chatSlice';

const ChatHub = () => {
  const dispatch = useDispatch();
  const { activeConversation, conversations } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getConversations());
  }, [dispatch]);

  // Setup socket listeners
  useEffect(() => {
    if (user && conversations.length > 0) {
      // Join chat rooms for all conversations
      conversations.forEach(conv => {
        socketService.emit('join-chat', conv._id);
      });

      const handleNewMessage = (data) => {
        dispatch(addRealtimeMessage(data));
      };

      socketService.on('new-message', handleNewMessage);

      return () => {
        conversations.forEach(conv => {
          socketService.emit('leave-chat', conv._id);
        });
        socketService.off('new-message', handleNewMessage);
      };
    }
  }, [conversations, user, dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
      <div className="flex bg-white rounded-lg shadow-sm overflow-hidden h-full border border-gray-200">
        <ConversationList />
        
        {activeConversation ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHub;

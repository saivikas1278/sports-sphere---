import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMessages, sendMessage } from '../../redux/slices/chatSlice';
import moment from 'moment';

const ChatWindow = () => {
  const dispatch = useDispatch();
  const { activeConversation, messages } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const activeMessages = React.useMemo(() => 
    messages[activeConversation?._id] || [], 
    [messages, activeConversation?._id]
  );
  
  const otherParticipant = activeConversation?.participants?.find(
    (p) => p?._id !== currentUser?._id
  );

  useEffect(() => {
    if (activeConversation) {
      dispatch(getMessages(activeConversation._id));
    }
  }, [activeConversation, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    dispatch(sendMessage({
      conversationId: activeConversation._id,
      text: newMessage
    }));
    setNewMessage('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center shadow-sm z-10 bg-white">
        <img
          src={otherParticipant?.avatar || 'https://via.placeholder.com/48'}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="ml-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {otherParticipant?.firstName} {otherParticipant?.lastName}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
        {activeMessages.map((msg, index) => {
          const isMine = msg.sender._id === currentUser._id;
          const showTime = index === 0 || 
            new Date(msg.createdAt).getTime() - new Date(activeMessages[index-1].createdAt).getTime() > 300000;

          return (
            <div key={msg._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {showTime && (
                <span className="text-xs text-gray-400 mb-1 mx-2">
                  {moment(msg.createdAt).format('MMM D, h:mm a')}
                </span>
              )}
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isMine
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSend} className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

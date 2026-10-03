import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Send, Pin, MessageSquare } from 'lucide-react';
import socket from '../../services/socket';
import api from '../../services/api';

const ChatRoom = ({ roomType, roomId, roomName, isModerator = false }) => {
  const { user } = useSelector(state => state.auth);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/${roomType}/${roomId}`);
        if (response.data.success) {
          setMessages(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    if (roomId) {
      fetchMessages();
    }
  }, [roomType, roomId]);

  // Socket logic
  useEffect(() => {
    if (!roomId) return;
    
    const socketInstance = socket.getSocket();
    if (socketInstance) {
      socketInstance.emit('join_room', { roomType, roomId });

      const handleNewMessage = (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
      };

      socketInstance.on('new_message', handleNewMessage);

      return () => {
        socketInstance.emit('leave_room', { roomType, roomId });
        socketInstance.off('new_message', handleNewMessage);
      };
    }
  }, [roomType, roomId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const socketInstance = socket.getSocket();
    if (socketInstance) {
      socketInstance.emit('send_message', {
        roomType,
        roomId,
        text: inputText,
        senderId: user._id,
        isAnnouncement: isModerator ? isAnnouncement : false
      });
      setInputText('');
      setIsAnnouncement(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{roomName} Chat</h3>
            <p className="text-xs font-semibold text-green-500 uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Live Room
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender?._id === user?._id;
          
          if (msg.isAnnouncement) {
            return (
              <div key={idx} className="bg-amber-100 border border-amber-300 rounded-2xl p-4 flex flex-col gap-2 relative shadow-sm">
                <div className="absolute top-0 right-4 -mt-3 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Pin size={10} /> Announcement
                </div>
                <div className="text-amber-800 font-bold whitespace-pre-wrap">{msg.text}</div>
                <div className="text-[10px] text-amber-600 font-bold text-right uppercase tracking-wider">
                  — {msg.sender?.firstName} {msg.sender?.lastName}
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className={`flex flex-col max-w-[80%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {msg.sender?.firstName} {msg.sender?.lastName}
                </span>
                <span className="text-[9px] text-slate-400">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                isOwn ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex gap-2 items-end relative">
          <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all p-2">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm p-2"
              placeholder="Type your message..."
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            
            {isModerator && (
              <div className="px-2 pb-1">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                    className="rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                  />
                  Send as Announcement
                </label>
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white h-14 w-14 flex items-center justify-center rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:shadow-none mb-1"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;

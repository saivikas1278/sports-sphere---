import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, Smile, Paperclip, MoreVertical, ArrowLeft } from 'lucide-react';

const TeamChat = () => {
  const { id } = useParams();
  const [message, setMessage] = useState('');

  // Mock messages
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey team, practice tomorrow at 6 PM!', sender: 'Alex Turner', time: '10:00 AM', isMe: false, avatar: null },
    { id: 2, text: 'Got it. I will bring the extra gear.', sender: 'Sarah Connor', time: '10:05 AM', isMe: false, avatar: null },
    { id: 3, text: 'Sounds good to me!', sender: 'You', time: '10:12 AM', isMe: true, avatar: null }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      text: message,
      sender: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      avatar: null
    }]);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-screen pt-4 md:pt-8 md:pt-16 md:pt-20 bg-slate-50/50">
      {/* Header */}
      <div className="glass-panel border-b-0 rounded-none rounded-b-3xl px-4 md:px-6 py-4 flex items-center justify-between z-10 sticky top-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to={`/teams/${id}`} className="p-2 text-slate-400 hover:text-blue-600 bg-white/60 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Neon Strikers Team Chat</h1>
            <p className="text-sm font-medium text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 5 Members Online
            </p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 bg-white/60 rounded-full transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <span className="px-3 py-1 bg-white/60 text-slate-400 text-xs font-bold rounded-full border border-slate-200">Today</span>
        </div>
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[80%] md:max-w-[60%] ${msg.isMe ? 'flex-row-reverse' : ''}`}>
              {!msg.isMe && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {msg.sender.charAt(0)}
                </div>
              )}
              <div>
                {!msg.isMe && <p className="text-xs text-slate-500 font-medium mb-1 ml-1">{msg.sender}</p>}
                <div className={`px-5 py-3 rounded-2xl md:rounded-3xl ${msg.isMe ? 'bg-blue-500 text-white rounded-br-sm shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
                <p className={`text-[10px] text-slate-400 font-medium mt-1 ${msg.isMe ? 'text-right mr-1' : 'ml-1'}`}>{msg.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] relative z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 p-2 rounded-2xl md:rounded-3xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <button type="button" className="p-3 text-slate-400 hover:text-blue-500 transition-colors">
            <Paperclip size={20} />
          </button>
          <textarea 
            className="flex-1 bg-transparent border-none outline-none resize-none py-3 text-slate-700 text-sm max-h-32 min-h-[44px]"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="button" className="p-3 text-slate-400 hover:text-amber-500 transition-colors">
            <Smile size={20} />
          </button>
          <button 
            type="submit" 
            disabled={!message.trim()}
            className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors shadow-sm"
          >
            <Send size={18} className={message.trim() ? "ml-1" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;

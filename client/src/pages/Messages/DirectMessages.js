import React, { useState } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Edit } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const DirectMessages = () => {
  const [activeChat, setActiveChat] = useState(1);
  const [message, setMessage] = useState('');

  const contacts = [
    { id: 1, name: 'Alex Turner', role: 'Tournament Organizer', lastMessage: 'Great, see you at 6 PM.', time: '10:45 AM', unread: 2, online: true },
    { id: 2, name: 'Sarah Connor', role: 'Captain - Thunderbolts', lastMessage: 'Can we reschedule the match?', time: 'Yesterday', unread: 0, online: false },
    { id: 3, name: 'Michael Chen', role: 'Referee', lastMessage: 'Scores have been updated.', time: 'Tuesday', unread: 0, online: true }
  ];

  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi, I had a question about the registration fee.', sender: 'Me', time: '10:00 AM', isMe: true },
    { id: 2, text: 'Hello! The registration fee is $100 per team. You can pay via the portal.', sender: 'Alex Turner', time: '10:05 AM', isMe: false },
    { id: 3, text: 'Perfect, I will do that now. Thanks!', sender: 'Me', time: '10:12 AM', isMe: true },
    { id: 4, text: 'Great, see you at 6 PM for the captain\'s meeting.', sender: 'Alex Turner', time: '10:45 AM', isMe: false }
  ]);

  const activeContact = contacts.find(c => c.id === activeChat);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages([...messages, {
      id: Date.now(), text: message, sender: 'Me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isMe: true
    }]);
    setMessage('');
  };

  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 pb-4 overflow-hidden bg-slate-50/50 flex flex-col">
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1 flex flex-col relative z-10 h-[calc(100vh-100px)]">
        
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* Sidebar (Contacts) */}
          <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${activeContact ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-800">Messages</h2>
              <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                <Edit size={18} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search messages..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => setActiveChat(contact.id)}
                  className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex gap-3
                    ${activeChat === contact.id ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {contact.name.charAt(0)}
                    </div>
                    {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-slate-800 text-sm truncate">{contact.name}</h3>
                      <span className={`text-[10px] font-bold ${contact.unread ? 'text-blue-600' : 'text-slate-400'}`}>{contact.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate mr-2 ${contact.unread ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{contact.lastMessage}</p>
                      {contact.unread > 0 && (
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Chat Area */}
          <div className={`flex-1 flex flex-col ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
            
            {activeContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {activeContact.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{activeContact.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{activeContact.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"><Phone size={18} /></button>
                    <button className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"><Video size={18} /></button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"><MoreVertical size={18} /></button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30">
                  <div className="text-center">
                    <span className="px-3 py-1 bg-white text-slate-400 text-xs font-bold rounded-full border border-slate-200">Today</span>
                  </div>
                  
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3 rounded-2xl ${
                          msg.isMe 
                          ? 'bg-blue-500 text-white rounded-br-sm shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                        }`}>
                          <p className="text-[14px] leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 px-1">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm"
                    />
                    <button 
                      type="submit" 
                      disabled={!message.trim()}
                      className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm"
                    >
                      <Send size={18} className={message.trim() ? "ml-1" : ""} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-12 md:w-20 h-12 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Send size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Your Messages</h3>
                <p className="text-sm font-medium">Select a conversation to start chatting</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;

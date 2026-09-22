import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, Megaphone, MessageSquare, ArrowLeft } from 'lucide-react';
import FloatingElements from '../../components/UI/FloatingElements';

const CommunicationCenter = () => {
  const { id } = useParams();
  const [messageType, setMessageType] = useState('broadcast'); // broadcast, direct
  const [message, setMessage] = useState('');
  
  return (
    <div className="min-h-screen relative pt-4 md:pt-8 md:pt-16 md:pt-20 md:pt-24 pb-6 md:pb-12 overflow-hidden">
      <FloatingElements />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link to={`/tournaments/${id}/dashboard`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4 md:mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Back to Dashboard
        </Link>
        
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Megaphone className="text-blue-500" size={32} /> Communication Center
          </h1>
          <p className="text-slate-500 font-medium mt-2">Send announcements or message specific teams directly.</p>
        </div>

        <div className="glass-panel p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/60">
          {/* Message Type Selector */}
          <div className="flex gap-4 mb-4 md:mb-8">
            <button 
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${messageType === 'broadcast' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
              onClick={() => setMessageType('broadcast')}
            >
              <Megaphone size={20} /> Broadcast Announcement
            </button>
            <button 
              className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${messageType === 'direct' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}
              onClick={() => setMessageType('direct')}
            >
              <MessageSquare size={20} /> Direct Message
            </button>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); setMessage(''); }}>
            {messageType === 'direct' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Team</label>
                <select className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="">Choose a team...</option>
                  <option value="1">Neon Strikers</option>
                  <option value="2">Urban Legends</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Message Content</label>
              <textarea 
                rows="6"
                className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder={messageType === 'broadcast' ? 'Write an announcement to all participants...' : 'Write your direct message...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                className="px-4 md:px-8 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] hover:-translate-y-0.5 hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Send size={18} /> Send Message
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default CommunicationCenter;

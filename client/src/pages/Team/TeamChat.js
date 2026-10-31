import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  MessageSquare,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { getSocket, initializeSocket } from '../../services/socket';

const TeamChat = () => {
  const { id } = useParams();
  const currentUser = useSelector((state) => state.auth?.user);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load team details & message history, setup socket
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // 1. Fetch team details
    api.get(`/teams/${id}`)
      .then((res) => {
        if (isMounted && res.data) {
          setTeam(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load team metadata:', err?.response?.data?.message || err.message);
      });

    // 2. Fetch message history
    api.get(`/chat/team/${id}`)
      .then((res) => {
        if (isMounted) {
          setMessages(res.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load team chat messages:', err);
          if (err?.response?.status === 403) {
            setError(err.response?.data?.error || 'Access denied: Only members of this team can view or participate in team chat.');
          } else if (err?.response?.status === 404) {
            setError('Team chat room not found.');
          } else {
            setError(err?.response?.data?.error || 'Failed to load team chat history. Please try again.');
          }
          setLoading(false);
        }
      });

    // 3. Socket setup
    let socket = getSocket();
    if (!socket) {
      socket = initializeSocket();
    }

    if (socket) {
      socket.emit('join_room', { roomType: 'team', roomId: id });

      const handleNewMessage = (newMsg) => {
        if (!newMsg) return;
        const msgRoomId = newMsg.roomId?._id || newMsg.roomId;
        if (newMsg.roomType === 'team' && String(msgRoomId) === String(id)) {
          setMessages((prev) => {
            if (prev.some((m) => (m._id && newMsg._id && String(m._id) === String(newMsg._id)))) {
              return prev;
            }
            return [...prev, newMsg];
          });
          setIsSending(false);
        }
      };

      const handleSocketError = (err) => {
        console.error('[Socket Chat Error]:', err);
        if (err?.message && err.message.toLowerCase().includes('not authorized')) {
          setError(err.message);
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('error', handleSocketError);

      return () => {
        socket.emit('leave_room', { roomType: 'team', roomId: id });
        socket.off('new_message', handleNewMessage);
        socket.off('error', handleSocketError);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const textToSend = message.trim();
    setIsSending(true);

    const socketInstance = getSocket() || initializeSocket();
    const currentUserId = currentUser?._id || currentUser?.id;

    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(
        'send_message',
        {
          roomType: 'team',
          roomId: id,
          text: textToSend,
          senderId: currentUserId
        },
        (res) => {
          if (res?.success && res?.data) {
            setMessages((prev) => {
              if (prev.some((m) => String(m._id) === String(res.data._id))) return prev;
              return [...prev, res.data];
            });
          }
          setIsSending(false);
        }
      );

      setMessage('');
      // Safety reset in case no server ack fires
      setTimeout(() => {
        setIsSending(false);
      }, 2000);
    } else {
      // REST API fallback
      api.post(`/chat/team/${id}`, { text: textToSend })
        .then((res) => {
          if (res?.data) {
            setMessages((prev) => {
              if (prev.some((m) => String(m._id) === String(res.data._id))) return prev;
              return [...prev, res.data];
            });
          }
          setMessage('');
        })
        .catch((err) => {
          console.error('Error sending message via API:', err);
          alert(err?.response?.data?.error || 'Failed to send message.');
        })
        .finally(() => {
          setIsSending(false);
        });
    }
  };

  const currentUserId = currentUser?._id || currentUser?.id;

  const totalMembersCount = team?.players
    ? team.players.length + (team.captain ? 1 : 0)
    : null;

  return (
    <div className="flex flex-col h-screen pt-4 md:pt-8 md:pt-16 md:pt-20 bg-slate-50/50">
      {/* Header */}
      <div className="glass-panel border-b-0 rounded-none rounded-b-3xl px-4 md:px-6 py-4 flex items-center justify-between z-10 sticky top-20 shadow-sm bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            to={`/teams/${id}`}
            className="p-2 text-slate-400 hover:text-blue-600 bg-white/60 rounded-full transition-colors border border-slate-200"
            title="Back to Team"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              {team?.name ? `${team.name} Team Chat` : 'Team Chat'}
            </h1>
            <p className="text-sm font-medium text-emerald-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {totalMembersCount ? `${totalMembersCount} Team Members` : 'Live Chat Room'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/teams/${id}`}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Users size={14} /> Team Roster
          </Link>
          <button className="p-2 text-slate-400 hover:text-slate-600 bg-white/60 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-slate-500">Loading team conversation...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border border-slate-200 shadow-lg bg-white">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{error}</p>
            <Link
              to={`/teams/${id}`}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
            >
              Return to Team Page
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="text-center">
              <span className="px-3 py-1 bg-white/80 text-slate-400 text-xs font-bold rounded-full border border-slate-200 shadow-sm">
                Team Room
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                  <MessageSquare size={28} />
                </div>
                <h3 className="font-bold text-slate-700 text-base">No messages yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Be the first to say hello and coordinate strategies with your teammates!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const senderObj = typeof msg.sender === 'object' ? msg.sender : null;
                const senderId = senderObj?._id || msg.sender;
                const isMe = Boolean(
                  currentUserId &&
                  senderId &&
                  String(senderId) === String(currentUserId)
                );

                const senderName = isMe
                  ? 'You'
                  : senderObj
                  ? `${senderObj.firstName || ''} ${senderObj.lastName || ''}`.trim() || 'Team Member'
                  : 'Team Member';

                const avatarUrl = senderObj?.avatar;
                const initial = (senderName.charAt(0) || 'M').toUpperCase();

                const formattedTime = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={msg._id || msg.id || `${senderId}-${msg.createdAt}`}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] md:max-w-[60%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={senderName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {initial}
                          </div>
                        )
                      )}
                      <div>
                        {!isMe && (
                          <p className="text-xs text-slate-500 font-semibold mb-1 ml-1">
                            {senderName}
                          </p>
                        )}
                        <div
                          className={`px-5 py-3 rounded-2xl md:rounded-3xl ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-sm shadow-[0_4px_14px_0_rgb(37,99,235,0.3)]'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {formattedTime && (
                          <p className={`text-[10px] text-slate-400 font-medium mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                            {formattedTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Sending indicator */}
            {isSending && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl text-xs text-slate-500 font-medium">
                  <Loader2 size={12} className="animate-spin text-blue-600" />
                  <span>Sending message...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] relative z-10">
            <form
              onSubmit={handleSend}
              className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 p-2 rounded-2xl md:rounded-3xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
            >
              <button
                type="button"
                className="p-3 text-slate-400 hover:text-blue-500 transition-colors"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <textarea
                className="flex-1 bg-transparent border-none outline-none resize-none py-3 text-slate-700 text-sm max-h-32 min-h-[44px]"
                placeholder="Type a team message..."
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
              <button
                type="button"
                className="p-3 text-slate-400 hover:text-amber-500 transition-colors"
                title="Add emoji"
              >
                <Smile size={20} />
              </button>
              <button
                type="submit"
                disabled={!message.trim() || isSending}
                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors shadow-sm flex items-center justify-center"
                title={isSending ? 'Sending...' : 'Send message'}
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className={message.trim() ? 'ml-0.5' : ''} />
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamChat;

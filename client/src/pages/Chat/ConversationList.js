import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveConversation, createConversation } from '../../redux/slices/chatSlice';
import moment from 'moment';
import api from '../../services/api'; // For user search

const ConversationList = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversation } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      setIsSearching(true);
      try {
        const response = await api.get(`/search/users?q=${query}`);
        setSearchResults(response.data.data.filter(u => u._id !== currentUser._id));
      } catch (error) {
        console.error('Search failed', error);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const startConversation = (participantId) => {
    dispatch(createConversation(participantId));
    setSearchQuery('');
    setIsSearching(false);
  };

  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users to chat..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="p-2">
            {searchResults.map(user => (
              <div
                key={user._id}
                onClick={() => startConversation(user._id)}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-lg"
              >
                <img
                  src={user.avatar || 'https://via.placeholder.com/40'}
                  alt={user.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No users found</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => {
              const otherParticipant = conv.participants?.find(
                (p) => p?._id !== currentUser?._id
              );
              
              const isActive = activeConversation?._id === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => dispatch(setActiveConversation(conv))}
                  className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-indigo-50' : ''
                  }`}
                >
                  <img
                    src={otherParticipant?.avatar || 'https://via.placeholder.com/48'}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-gray-900 truncate">
                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-500">
                          {moment(conv.lastMessage.createdAt).fromNow()}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conv.lastMessage?.text || 'Start chatting...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;

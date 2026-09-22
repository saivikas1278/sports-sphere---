import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaTrophy, 
  FaUsers, 
  FaClock, 
  FaMapMarkerAlt,
  FaPlay,
  FaPause,
  FaStop,
  FaSave,
  FaPlus,
  FaMinus,
  FaCheck,
  FaTimes,
  FaEdit,
  FaCamera,
  FaCommentAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import matchService from '../../services/matchService';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import AnimatedCard from '../../components/UI/AnimatedCard';
import GradientButton from '../../components/UI/GradientButton';

const MatchScorecard = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('scorecard');
  const [isLive, setIsLive] = useState(false);
  
  // Score tracking
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [period, setPeriod] = useState(1);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  
  // Events tracking
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ type: '', team: '', player: '', time: '', description: '' });
  
  // Match details
  const [matchNotes, setMatchNotes] = useState('');
  const [weather, setWeather] = useState('');
  const [venue, setVenue] = useState('');

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const fetchMatchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await matchService.getMatch(matchId);
      const matchData = response.data;
      setMatch(matchData);
      
      // Initialize scores if match has result
      if (matchData.result) {
        setHomeScore(matchData.result.homeScore || 0);
        setAwayScore(matchData.result.awayScore || 0);
      }
      
      // Set match status
      setIsLive(matchData.status === 'ongoing');
      
      // Initialize events
      setEvents(matchData.events || []);
      
      // Initialize other fields
      setMatchNotes(matchData.notes || '');
      setWeather(matchData.weather || '');
      setVenue(matchData.venue?.name || '');
      
    } catch (error) {
      console.error('Error fetching match data:', error);
      toast.error('Failed to load match data');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  const handleStartMatch = async () => {
    try {
      setUpdating(true);
      await matchService.startMatch(matchId);
      setIsLive(true);
      setTimerRunning(true);
      toast.success('Match started!');
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Failed to start match');
    } finally {
      setUpdating(false);
    }
  };

  const handleEndMatch = async () => {
    try {
      setUpdating(true);
      const result = {
        homeScore,
        awayScore,
        winner: homeScore > awayScore ? match.homeTeam._id : 
                homeScore < awayScore ? match.awayTeam._id : null,
        events,
        notes: matchNotes,
        weather,
        venue
      };
      
      await matchService.updateMatchResult(matchId, result);
      setIsLive(false);
      setTimerRunning(false);
      toast.success('Match completed!');
      navigate(`/tournaments/${match.tournament}`);
    } catch (error) {
      console.error('Error ending match:', error);
      toast.error('Failed to end match');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveScore = async () => {
    try {
      setUpdating(true);
      const result = {
        homeScore,
        awayScore,
        events,
        notes: matchNotes,
        weather,
        venue
      };
      
      await matchService.updateScore(matchId, result);
      toast.success('Score saved!');
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error('Failed to save score');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.type || !newEvent.team) {
      toast.error('Please fill in required fields');
      return;
    }
    
    const event = {
      ...newEvent,
      time: timer,
      timestamp: new Date(),
      id: Date.now().toString()
    };
    
    setEvents([...events, event]);
    setNewEvent({ type: '', team: '', player: '', time: '', description: '' });
    toast.success('Event added!');
  };

  const handleRemoveEvent = (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast.success('Event removed!');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'goal': return '⚽';
      case 'point': return '🏆';
      case 'foul': return '⚠️';
      case 'card': return '🟨';
      case 'substitution': return '🔄';
      case 'timeout': return '⏱️';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Match not found</h2>
          <GradientButton onClick={() => navigate(-1)}>
            Go Back
          </GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* Match Header */}
        <AnimatedCard className="mb-4 md:mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-3xl font-bold mb-2">Match #{match.matchNumber}</h1>
                <p className="text-green-100">{match.tournament?.name}</p>
                <p className="text-green-100 capitalize">{match.round} - {match.sport}</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  isLive ? 'bg-red-500 text-white animate-pulse' : 
                  match.status === 'completed' ? 'bg-green-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {isLive ? 'LIVE' : match.status.toUpperCase()}
                </div>
                {isLive && (
                  <div className="mt-2 text-2xl font-mono font-bold">
                    {formatTime(timer)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Scoreboard */}
          <div className="bg-white p-4 md:p-6 rounded-b-xl">
            <div className="grid grid-cols-3 gap-4 md:gap-8 items-center">
              {/* Home Team */}
              <div className="text-center">
                <img
                  src={match.homeTeam?.logo || '/default-team-logo.png'}
                  alt={match.homeTeam?.name}
                  className="w-12 md:w-20 h-12 md:h-20 rounded-full mx-auto mb-3"
                />
                <h3 className="text-xl font-bold mb-2">{match.homeTeam?.name}</h3>
                <div className="text-2xl md:text-4xl font-bold text-blue-600">{homeScore}</div>
              </div>
              
              {/* VS/Score Controls */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-4">VS</div>
                {isLive && (
                  <div className="space-y-3">
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <FaMinus />
                      </button>
                      <button
                        onClick={() => setHomeScore(homeScore + 1)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <FaPlus />
                      </button>
                    </div>
                    
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`p-2 rounded-lg text-white ${
                          timerRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {timerRunning ? <FaPause /> : <FaPlay />}
                      </button>
                      
                      <button
                        onClick={handleSaveScore}
                        disabled={updating}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <FaSave />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Away Team */}
              <div className="text-center">
                <img
                  src={match.awayTeam?.logo || '/default-team-logo.png'}
                  alt={match.awayTeam?.name}
                  className="w-12 md:w-20 h-12 md:h-20 rounded-full mx-auto mb-3"
                />
                <h3 className="text-xl font-bold mb-2">{match.awayTeam?.name}</h3>
                <div className="text-2xl md:text-4xl font-bold text-red-600">{awayScore}</div>
                {isLive && (
                  <div className="mt-3 flex justify-center space-x-4">
                    <button
                      onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <FaMinus />
                    </button>
                    <button
                      onClick={() => setAwayScore(awayScore + 1)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <FaPlus />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Match Controls */}
            <div className="mt-4 md:mt-6 flex justify-center space-x-4">
              {match.status === 'scheduled' && (
                <GradientButton onClick={handleStartMatch} disabled={updating}>
                  <FaPlay className="mr-2" />
                  Start Match
                </GradientButton>
              )}
              
              {isLive && (
                <GradientButton onClick={handleEndMatch} disabled={updating} variant="danger">
                  <FaStop className="mr-2" />
                  End Match
                </GradientButton>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Navigation Tabs */}
        <div className="mb-4 md:mb-8">
          <nav className="flex space-x-8">
            {['scorecard', 'events', 'details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'scorecard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Live Events */}
            <div className="lg:col-span-2">
              <AnimatedCard className="p-4 md:p-6">
                <h3 className="text-xl font-semibold mb-4">Match Events</h3>
                
                {/* Add Event Form */}
                {isLive && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 md:mb-6">
                    <h4 className="font-medium mb-3">Add Event</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <select
                        value={newEvent.type}
                        onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                        className="border rounded-lg px-3 py-2"
                      >
                        <option value="">Event Type</option>
                        <option value="goal">Goal</option>
                        <option value="point">Point</option>
                        <option value="foul">Foul</option>
                        <option value="card">Card</option>
                        <option value="substitution">Substitution</option>
                        <option value="timeout">Timeout</option>
                        <option value="other">Other</option>
                      </select>
                      
                      <select
                        value={newEvent.team}
                        onChange={(e) => setNewEvent({...newEvent, team: e.target.value})}
                        className="border rounded-lg px-3 py-2"
                      >
                        <option value="">Select Team</option>
                        <option value={match.homeTeam._id}>{match.homeTeam.name}</option>
                        <option value={match.awayTeam._id}>{match.awayTeam.name}</option>
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Player"
                        value={newEvent.player}
                        onChange={(e) => setNewEvent({...newEvent, player: e.target.value})}
                        className="border rounded-lg px-3 py-2"
                      />
                      
                      <input
                        type="text"
                        placeholder="Description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        className="border rounded-lg px-3 py-2"
                      />
                    </div>
                    
                    <GradientButton size="sm" onClick={handleAddEvent}>
                      <FaPlus className="mr-2" />
                      Add Event
                    </GradientButton>
                  </div>
                )}
                
                {/* Events List */}
                <div className="space-y-3">
                  {events.length > 0 ? (
                    events.map((event, index) => (
                      <div key={event.id || index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getEventIcon(event.type)}</span>
                          <div>
                            <p className="font-medium capitalize">{event.type}</p>
                            <p className="text-sm text-gray-600">
                              {formatTime(event.time)} - {event.player || 'Unknown'} ({event.team === match.homeTeam._id ? match.homeTeam.name : match.awayTeam.name})
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-500">{event.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {isLive && (
                          <button
                            onClick={() => handleRemoveEvent(event.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 md:py-8 text-gray-500">
                      No events recorded yet
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </div>

            {/* Match Info Sidebar */}
            <div className="space-y-6">
              <AnimatedCard className="p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Match Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Time
                    </label>
                    <div className="flex items-center text-gray-600">
                      <FaClock className="mr-2" />
                      {new Date(match.scheduledTime).toLocaleDateString()} at{' '}
                      {new Date(match.scheduledTime).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue
                    </label>
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2" />
                      {venue || 'TBD'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Round
                    </label>
                    <p className="text-gray-600 capitalize">{match.round}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport
                    </label>
                    <p className="text-gray-600 capitalize">{match.sport}</p>
                  </div>
                </div>
              </AnimatedCard>
              
              {/* Quick Stats */}
              <AnimatedCard className="p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Events:</span>
                    <span className="font-medium">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Match Duration:</span>
                    <span className="font-medium">{formatTime(timer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Score Difference:</span>
                    <span className="font-medium">{Math.abs(homeScore - awayScore)}</span>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <AnimatedCard className="p-4 md:p-6">
            <h3 className="text-xl font-semibold mb-4">Match Timeline</h3>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id || index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl md:text-3xl">{getEventIcon(event.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{event.type}</h4>
                      <span className="text-sm text-gray-500">{formatTime(event.time)}</span>
                    </div>
                    <p className="text-gray-600">
                      {event.player} ({event.team === match.homeTeam._id ? match.homeTeam.name : match.awayTeam.name})
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="text-center py-4 md:py-6 md:py-12 text-gray-500">
                  No events recorded for this match
                </div>
              )}
            </div>
          </AnimatedCard>
        )}

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <AnimatedCard className="p-4 md:p-6">
              <h3 className="text-xl font-semibold mb-4">Match Notes</h3>
              <textarea
                value={matchNotes}
                onChange={(e) => setMatchNotes(e.target.value)}
                placeholder="Add match notes, observations, or comments..."
                className="w-full h-32 border rounded-lg px-3 py-2 resize-none"
                disabled={!isLive && match.status !== 'scheduled'}
              />
              {(isLive || match.status === 'scheduled') && (
                <GradientButton 
                  size="sm" 
                  onClick={handleSaveScore}
                  className="mt-3"
                  disabled={updating}
                >
                  <FaSave className="mr-2" />
                  Save Notes
                </GradientButton>
              )}
            </AnimatedCard>
            
            <AnimatedCard className="p-4 md:p-6">
              <h3 className="text-xl font-semibold mb-4">Additional Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weather Conditions
                  </label>
                  <input
                    type="text"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder="e.g., Sunny, 25°C"
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={!isLive && match.status !== 'scheduled'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Details
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Venue name or location"
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={!isLive && match.status !== 'scheduled'}
                  />
                </div>
                
                {(isLive || match.status === 'scheduled') && (
                  <GradientButton 
                    size="sm" 
                    onClick={handleSaveScore}
                    disabled={updating}
                  >
                    <FaSave className="mr-2" />
                    Save Details
                  </GradientButton>
                )}
              </div>
            </AnimatedCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchScorecard;

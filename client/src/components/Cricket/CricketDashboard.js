import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBaseballBall, FaArrowRight } from 'react-icons/fa';
import { showToast } from '../../utils/toast';

const CricketDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  useEffect(() => {
    const fetchCricketData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, these would be API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        setLiveMatches([
          {
            id: '1',
            matchTitle: 'Super Kings vs Royal Challengers',
            teams: {
              team1Name: 'Super Kings',
              team2Name: 'Royal Challengers'
            },
            innings: [
              {
                teamName: 'Super Kings',
                totalRuns: 186,
                wickets: 4,
                overs: 18,
                balls: 3
              }
            ],
            venue: 'Central Stadium',
            matchType: 'T20'
          }
        ]);
        
        setUpcomingMatches([
          {
            id: '3',
            matchTitle: 'Kolkata Knight Riders vs Lucknow Giants',
            teams: {
              team1Name: 'Kolkata Knight Riders',
              team2Name: 'Lucknow Giants'
            },
            date: '2025-08-15T14:30:00',
            venue: 'Eden Gardens',
            matchType: 'T20'
          },
          {
            id: '4',
            matchTitle: 'Sunrisers vs Gujarat Titans',
            teams: {
              team1Name: 'Sunrisers',
              team2Name: 'Gujarat Titans'
            },
            date: '2025-08-16T18:00:00',
            venue: 'Hyderabad Stadium',
            matchType: 'T20'
          }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching cricket data:', error);
        showToast('Failed to load cricket data', 'error');
        setIsLoading(false);
      }
    };

    fetchCricketData();
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-xl font-semibold flex items-center text-gray-800">
          <FaBaseballBall className="mr-2 text-green-600" /> Cricket Scorer
        </h2>
        <Link 
          to="/cricket"
          className="text-sm text-green-600 hover:text-green-800 flex items-center"
        >
          View All <FaArrowRight className="ml-1" size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-4 md:py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div>
          {/* Live Matches */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <div className="mr-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              Live Matches
            </h3>
            
            {liveMatches.length > 0 ? (
              <div className="space-y-4">
                {liveMatches.map(match => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <Link to={`/cricket/${match.id}`} className="block">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-800">{match.matchTitle}</h4>
                          <p className="text-sm text-gray-500">{match.venue} • {match.matchType}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full animate-pulse">
                          LIVE
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {match.innings.map((inning, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">{inning.teamName}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">{inning.totalRuns}/{inning.wickets}</span>
                              <span className="text-sm text-gray-500 ml-1">
                                ({inning.overs}.{inning.balls} ov)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Link 
                          to={`/cricket/${match.id}/score`}
                          className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          Score Now →
                        </Link>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">No live matches at the moment</p>
            )}
          </div>
          
          {/* Upcoming Matches */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              Upcoming Matches
            </h3>
            
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.slice(0, 2).map(match => (
                  <div key={match.id} className="flex items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="bg-green-50 rounded-lg p-2 mr-3">
                      <FaBaseballBall className="text-green-500" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/cricket/${match.id}`}>
                        <h4 className="font-medium text-gray-800 hover:text-green-600">{match.matchTitle}</h4>
                      </Link>
                      <p className="text-xs text-gray-500">{match.venue} • {match.matchType}</p>
                      <p className="text-xs font-medium text-green-600 mt-1">{formatDateTime(match.date)}</p>
                    </div>
                    <Link 
                      to={`/cricket/${match.id}/edit`}
                      className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full hover:bg-green-100"
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">No upcoming matches scheduled</p>
            )}
          </div>
          
          {/* Create Match Button */}
          <div className="mt-4 md:mt-6 text-center">
            <Link 
              to="/cricket/create"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create Cricket Match
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CricketDashboard;

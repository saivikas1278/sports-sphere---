import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTrophy, FaUsers, FaVideo, FaRunning, FaClock } from 'react-icons/fa';
import LoadingSpinner from '../UI/LoadingSpinner';
import { showToast } from '../../utils/toast';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivityFeed = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Mock data - in a real app, this would come from an API
        setActivities([
          {
            id: 1,
            type: 'tournament',
            action: 'joined',
            title: 'Summer Basketball League',
            timestamp: '2025-08-10T14:30:00Z',
            details: {
              tournamentId: 101,
              teamName: 'Eagles Basketball'
            }
          },
          {
            id: 2,
            type: 'team',
            action: 'created',
            title: 'Thunderbolts FC',
            timestamp: '2025-08-08T10:15:00Z',
            details: {
              teamId: 201,
              sport: 'Soccer'
            }
          },
          {
            id: 3,
            type: 'video',
            action: 'watched',
            title: 'Advanced Dribbling Techniques',
            timestamp: '2025-08-05T19:45:00Z',
            details: {
              videoId: 301,
              duration: '18:42',
              creator: 'Coach Mike'
            }
          },
          {
            id: 4,
            type: 'fitness',
            action: 'completed',
            title: 'HIIT Workout for Basketball',
            timestamp: '2025-08-02T08:30:00Z',
            details: {
              workoutId: 401,
              duration: '30 minutes',
              calories: 320
            }
          },
          {
            id: 5,
            type: 'tournament',
            action: 'won',
            title: 'Spring Tournament - Match',
            timestamp: '2025-07-28T16:20:00Z',
            details: {
              tournamentId: 102,
              matchId: 501,
              score: '78-72',
              opponent: 'Wildcats'
            }
          }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        showToast('Failed to load activity feed', 'error');
        setIsLoading(false);
      }
    };

    fetchActivityFeed();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'tournament': return <FaTrophy className="text-yellow-500" />;
      case 'team': return <FaUsers className="text-blue-500" />;
      case 'video': return <FaVideo className="text-purple-500" />;
      case 'fitness': return <FaRunning className="text-green-500" />;
      default: return null;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'joined': return 'text-blue-600';
      case 'created': return 'text-green-600';
      case 'watched': return 'text-purple-600';
      case 'completed': return 'text-green-600';
      case 'won': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const options = { month: 'short', day: 'numeric' };
    return activityTime.toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 md:py-8">
        <FaClock className="mx-auto text-gray-300 text-2xl md:text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-700">No Recent Activity</h3>
        <p className="text-gray-500 mt-2">Your activities will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={activity.id}
          className="flex items-start p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors rounded-lg"
        >
          <div className="bg-gray-100 p-2 rounded-full mr-3">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <span className={`font-medium ${getActionColor(activity.action)}`}>
                  You {activity.action}
                </span>
                <span className="ml-1 text-gray-800">{activity.title}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center mt-1 sm:mt-0">
                <FaClock className="mr-1" />
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
            
            {activity.details && (
              <div className="mt-2 text-sm text-gray-600">
                {activity.type === 'tournament' && (
                  <div>
                    {activity.action === 'joined' && (
                      <p>Joined with team: {activity.details.teamName}</p>
                    )}
                    {activity.action === 'won' && (
                      <p>Final score: {activity.details.score} against {activity.details.opponent}</p>
                    )}
                  </div>
                )}
                
                {activity.type === 'team' && (
                  <p>Sport: {activity.details.sport}</p>
                )}
                
                {activity.type === 'video' && (
                  <p>By {activity.details.creator} • {activity.details.duration}</p>
                )}
                
                {activity.type === 'fitness' && (
                  <p>{activity.details.duration} • {activity.details.calories} calories burned</p>
                )}
              </div>
            )}
            
            <div className="mt-2">
              <Link 
                to={`/${activity.type}s/${activity.details[`${activity.type}Id`]}`}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-2">
        <Link 
          to="/profile/activity"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Full Activity History
        </Link>
      </div>
    </div>
  );
};

export default ActivityFeed;

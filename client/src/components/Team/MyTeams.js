import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaTrophy, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';
import LoadingSpinner from '../UI/LoadingSpinner';
import { showToast } from '../../utils/toast';

const MyTeams = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in a real app, this would come from an API
        setTeams([
          {
            id: 1,
            name: 'Eagles Basketball',
            logo: null, // In a real app, this would be a URL to the team logo
            sport: 'Basketball',
            role: 'Captain',
            wins: 12,
            losses: 4,
            nextMatch: {
              id: 101,
              opponent: 'Hawks',
              date: '2025-08-15T18:30:00',
              location: 'Central Court'
            }
          },
          {
            id: 2,
            name: 'Thunderbolts FC',
            logo: null,
            sport: 'Soccer',
            role: 'Player',
            wins: 8,
            losses: 6,
            nextMatch: {
              id: 102,
              opponent: 'Lightning FC',
              date: '2025-08-18T17:00:00',
              location: 'Memorial Stadium'
            }
          }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching teams:', error);
        showToast('Failed to load teams data', 'error');
        setIsLoading(false);
      }
    };

    fetchMyTeams();
  }, []);

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-4 md:py-8">
        <FaUsers className="mx-auto text-gray-300 text-2xl md:text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-700">No Teams Joined Yet</h3>
        <p className="text-gray-500 mt-2">Join or create a team to get started</p>
        <Link 
          to="/teams"
          className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Find Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => (
        <div 
          key={team.id}
          className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                {team.logo ? (
                  <img src={team.logo} alt={`${team.name} logo`} className="w-10 h-10 rounded-full" />
                ) : (
                  <FaUsers className="text-gray-500 text-xl" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-lg text-gray-800">{team.name}</h3>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600 mr-3">{team.sport}</span>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {team.role}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <FaTrophy className="mr-2 text-yellow-500" />
                  <span>Record</span>
                </div>
                <p className="font-medium">
                  {team.wins}W - {team.losses}L
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <FaUserFriends className="mr-2 text-blue-500" />
                  <span>Team Members</span>
                </div>
                <Link to={`/teams/${team.id}/members`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Roster
                </Link>
              </div>
            </div>
            
            {team.nextMatch && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="mr-2 text-gray-500" />
                  <span>Next Match</span>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">vs {team.nextMatch.opponent}</p>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(team.nextMatch.date)}</p>
                      <p className="text-sm text-gray-600">{team.nextMatch.location}</p>
                    </div>
                    <Link 
                      to={`/matches/${team.nextMatch.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-3 flex justify-between border-t border-gray-200">
            <Link 
              to={`/teams/${team.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Team Profile
            </Link>
            <Link 
              to={`/teams/${team.id}/schedule`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Schedule
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyTeams;

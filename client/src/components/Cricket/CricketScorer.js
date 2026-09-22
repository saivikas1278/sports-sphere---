import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBaseballBall, FaPlus, FaSearch, FaSort } from 'react-icons/fa';
import { showToast } from '../../utils/toast';

const CricketScorer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock data for demonstration
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        setMatches([
          {
            id: '1',
            matchTitle: 'Super Kings vs Royal Challengers',
            matchType: 'T20',
            overs: 20,
            venue: 'Central Stadium',
            date: '2025-08-15',
            teams: {
              team1Name: 'Super Kings',
              team2Name: 'Royal Challengers'
            },
            status: 'Upcoming',
            result: {
              status: 'In Progress'
            }
          },
          {
            id: '2',
            matchTitle: 'Mumbai Indians vs Delhi Capitals',
            matchType: 'ODI',
            overs: 50,
            venue: 'Metro Ground',
            date: '2025-08-12',
            teams: {
              team1Name: 'Mumbai Indians',
              team2Name: 'Delhi Capitals'
            },
            status: 'Live',
            result: {
              status: 'In Progress'
            }
          },
          {
            id: '3',
            matchTitle: 'Rajasthan Royals vs Punjab Kings',
            matchType: 'T20',
            overs: 20,
            venue: 'Desert Stadium',
            date: '2025-08-10',
            teams: {
              team1Name: 'Rajasthan Royals',
              team2Name: 'Punjab Kings'
            },
            status: 'Completed',
            result: {
              status: 'Completed',
              winnerName: 'Rajasthan Royals',
              margin: {
                runs: 25
              },
              description: 'Rajasthan Royals won by 25 runs'
            }
          }
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching cricket matches:', error);
        showToast('Failed to load cricket matches', 'error');
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredMatches = matches
    .filter(match => 
      match.matchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teams.team1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teams.team2Name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'matchTitle':
          comparison = a.matchTitle.localeCompare(b.matchTitle);
          break;
        case 'matchType':
          comparison = a.matchType.localeCompare(b.matchType);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = new Date(a.date) - new Date(b.date);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Live':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full animate-pulse">Live</span>;
      case 'Upcoming':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Upcoming</span>;
      case 'Completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-xl font-semibold flex items-center text-gray-800">
          <FaBaseballBall className="mr-2 text-green-600" /> Cricket Scorer
        </h2>
        <Link 
          to="/cricket/create"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FaPlus className="mr-2" /> New Match
        </Link>
      </div>

      <div className="mb-4 md:mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="Search matches by name or team..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-4 md:py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {filteredMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('matchTitle')}
                    >
                      <div className="flex items-center">
                        Match 
                        {sortBy === 'matchTitle' && (
                          <FaSort className={`ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('matchType')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortBy === 'matchType' && (
                          <FaSort className={`ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortBy === 'date' && (
                          <FaSort className={`ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortBy === 'status' && (
                          <FaSort className={`ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMatches.map(match => (
                    <tr key={match.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{match.matchTitle}</div>
                          <div className="text-sm text-gray-500">{match.teams.team1Name} vs {match.teams.team2Name}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{match.matchType}</div>
                        <div className="text-sm text-gray-500">{match.overs} overs</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(match.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{match.venue}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(match.status)}
                        {match.status === 'Completed' && (
                          <div className="text-sm text-gray-500 mt-1">{match.result.description}</div>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {match.status === 'Upcoming' && (
                            <Link 
                              to={`/cricket/${match.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                          )}
                          {match.status === 'Live' && (
                            <Link 
                              to={`/cricket/${match.id}/score`}
                              className="text-red-600 hover:text-red-900"
                            >
                              Score Live
                            </Link>
                          )}
                          <Link 
                            to={`/cricket/${match.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 md:py-8">
              <p className="text-gray-500">No cricket matches found. Create a new match to get started!</p>
              <Link 
                to="/cricket/create"
                className="inline-flex items-center px-4 py-2 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FaPlus className="mr-2" /> Create Match
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CricketScorer;

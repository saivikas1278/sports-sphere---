import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaExchangeAlt, FaUndo } from 'react-icons/fa';

const BadmintonScoring = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [sets, setSets] = useState([]);
  const [isMatchOver, setIsMatchOver] = useState(false);
  const [player1Sets, setPlayer1Sets] = useState(0);
  const [player2Sets, setPlayer2Sets] = useState(0);
  const [isDeuce, setIsDeuce] = useState(false);
  const [player1Service, setPlayer1Service] = useState(true);
  const [gamePoint, setGamePoint] = useState(null);
  const [matchPoint, setMatchPoint] = useState(null);
  const [history, setHistory] = useState([]);

  // Load match data
  useEffect(() => {
    const fetchMatch = () => {
      try {
        const savedMatches = JSON.parse(localStorage.getItem('matches')) || [];
        const matchData = savedMatches.find(m => m.id === id);
        
        if (matchData) {
          setMatch(matchData);
          
          // If match has result, initialize scoring state
          if (matchData.result && matchData.result.scorecard) {
            const { scorecard } = matchData.result;
            setSets(scorecard.sets || []);
            setPlayer1Sets(matchData.teams.team1.score || 0);
            setPlayer2Sets(matchData.teams.team2.score || 0);
            
            // Determine if match is completed
            if (matchData.status === 'completed') {
              setIsMatchOver(true);
            } else {
              // Set current set and scores for ongoing match
              const currentSetIndex = scorecard.sets.length;
              if (currentSetIndex < 3) { // Max 3 sets in badminton
                setCurrentSet(currentSetIndex + 1);
                setPlayer1Score(0);
                setPlayer2Score(0);
              } else {
                setIsMatchOver(true);
              }
            }
          } else {
            // Initialize new scoring
            setPlayer1Score(0);
            setPlayer2Score(0);
            setCurrentSet(1);
            setSets([]);
            setPlayer1Sets(0);
            setPlayer2Sets(0);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading match data:", error);
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  // Check for game point, match point and deuce
  useEffect(() => {
    // Check for deuce (20-20 or higher)
    if (player1Score >= 20 && player2Score >= 20) {
      setIsDeuce(true);
    } else {
      setIsDeuce(false);
    }

    // Check for game point
    if ((player1Score >= 20 && player1Score > player2Score) || 
        (isDeuce && player1Score > player2Score && player1Score - player2Score === 1)) {
      setGamePoint('player1');
    } else if ((player2Score >= 20 && player2Score > player1Score) || 
              (isDeuce && player2Score > player1Score && player2Score - player1Score === 1)) {
      setGamePoint('player2');
    } else {
      setGamePoint(null);
    }

    // Check for match point (player already has 1 set and on game point in set 2 or 3)
    if ((player1Sets === 1 && gamePoint === 'player1') || 
        (currentSet === 3 && gamePoint === 'player1')) {
      setMatchPoint('player1');
    } else if ((player2Sets === 1 && gamePoint === 'player2') || 
              (currentSet === 3 && gamePoint === 'player2')) {
      setMatchPoint('player2');
    } else {
      setMatchPoint(null);
    }
  }, [player1Score, player2Score, isDeuce, player1Sets, player2Sets, currentSet, gamePoint]);

  // Handle point scoring
  const scorePoint = (player) => {
    // Save current state to history for undo
    setHistory([...history, { 
      player1Score, 
      player2Score, 
      player1Service,
      sets: [...sets] 
    }]);
    
    if (player === 'player1') {
      setPlayer1Score(player1Score + 1);
    } else {
      setPlayer2Score(player2Score + 1);
    }
    
    // After scoring, toggle service if the scoring player wasn't serving
    if ((player === 'player1' && !player1Service) || (player === 'player2' && player1Service)) {
      setPlayer1Service(!player1Service);
    }
    
    // Check if set is over
    checkSetCompletion();
  };

  // Check if set is complete and handle set completion
  const checkSetCompletion = () => {
    // Standard set win (21 points with 2 point lead)
    const p1WinsSet = (player1Score >= 20 && player1Score - player2Score >= 2) || player1Score === 30;
    const p2WinsSet = (player2Score >= 20 && player2Score - player1Score >= 2) || player2Score === 30;
    
    if (p1WinsSet || p2WinsSet) {
      completeSet(p1WinsSet ? 'player1' : 'player2');
    }
  };

  // Handle set completion
  const completeSet = (winner) => {
    const newSet = {
      player1Score,
      player2Score,
      winner
    };
    
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);
    
    // Update sets won
    if (winner === 'player1') {
      const newSetsWon = player1Sets + 1;
      setPlayer1Sets(newSetsWon);
      
      // Check match completion
      if (newSetsWon >= 2) {
        completeMatch('player1', updatedSets);
        return;
      }
    } else {
      const newSetsWon = player2Sets + 1;
      setPlayer2Sets(newSetsWon);
      
      // Check match completion
      if (newSetsWon >= 2) {
        completeMatch('player2', updatedSets);
        return;
      }
    }
    
    // If match isn't over, prepare for next set
    setCurrentSet(currentSet + 1);
    setPlayer1Score(0);
    setPlayer2Score(0);
    // Service alternates between sets
    setPlayer1Service(currentSet % 2 === 0);
  };

  // Complete the match
  const completeMatch = (winner, finalSets) => {
    setIsMatchOver(true);
    
    // Create summary text
    const team1Name = match.teams.team1.name;
    const team2Name = match.teams.team2.name;
    const winnerName = winner === 'player1' ? team1Name : team2Name;
    const loserName = winner === 'player1' ? team2Name : team1Name;
    const winnerSets = winner === 'player1' ? player1Sets + 1 : player2Sets + 1;
    const loserSets = winner === 'player1' ? player2Sets : player1Sets + 1;
    
    const summary = `${winnerName} defeated ${loserName} ${winnerSets}-${loserSets} in a thrilling badminton match.`;
    
    // Update match in localStorage
    const savedMatches = JSON.parse(localStorage.getItem('matches')) || [];
    const matchIndex = savedMatches.findIndex(m => m.id === id);
    
    if (matchIndex !== -1) {
      const updatedMatch = {
        ...savedMatches[matchIndex],
        status: 'completed',
        teams: {
          ...savedMatches[matchIndex].teams,
          team1: {
            ...savedMatches[matchIndex].teams.team1,
            score: winner === 'player1' ? winnerSets : loserSets
          },
          team2: {
            ...savedMatches[matchIndex].teams.team2,
            score: winner === 'player1' ? loserSets : winnerSets
          }
        },
        result: {
          winner: winner === 'player1' ? 'team1' : 'team2',
          summary,
          scorecard: {
            sets: finalSets
          }
        }
      };
      
      savedMatches[matchIndex] = updatedMatch;
      localStorage.setItem('matches', JSON.stringify(savedMatches));
      setMatch(updatedMatch);
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setPlayer1Score(lastState.player1Score);
      setPlayer2Score(lastState.player2Score);
      setPlayer1Service(lastState.player1Service);
      setSets(lastState.sets);
      
      // Remove the last state from history
      setHistory(history.slice(0, -1));
    }
  };

  // Toggle service
  const toggleService = () => {
    setPlayer1Service(!player1Service);
  };

  // Return to match details
  const goBack = () => {
    navigate(`/matches/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Match not found. Please return to the matches page.</p>
          <button 
            onClick={() => navigate('/matches')}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-6 flex items-center">
        <button 
          onClick={goBack}
          className="mr-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Badminton Scoring</h1>
      </div>
      
      {/* Match Info */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-xl font-semibold mb-4">{match.title}</h2>
        <div className="flex flex-col md:flex-row md:justify-between">
          <div className="mb-4 md:mb-0">
            <p><span className="font-semibold">Date:</span> {new Date(match.date).toLocaleDateString()}</p>
            <p><span className="font-semibold">Venue:</span> {match.venue}</p>
          </div>
          <div>
            <p><span className="font-semibold">Sport:</span> {match.sport}</p>
            <p><span className="font-semibold">Status:</span> {match.status}</p>
          </div>
        </div>
      </div>
      
      {/* Scoreboard */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-6">
          <div className="flex-1 text-center mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-2">{match.teams.team1.name}</h3>
            <div className={`text-6xl font-bold ${player1Service ? 'text-blue-600' : 'text-gray-700'}`}>
              {player1Score}
            </div>
            <div className="mt-2 text-xl font-semibold">Sets: {player1Sets}</div>
            {player1Service && <div className="mt-1 text-blue-600 text-sm">Serving</div>}
          </div>
          
          <div className="flex items-center justify-center px-4 mb-4 md:mb-0">
            <div className="text-xl md:text-3xl font-bold text-gray-400">vs</div>
          </div>
          
          <div className="flex-1 text-center">
            <h3 className="text-lg font-semibold mb-2">{match.teams.team2.name}</h3>
            <div className={`text-6xl font-bold ${!player1Service ? 'text-blue-600' : 'text-gray-700'}`}>
              {player2Score}
            </div>
            <div className="mt-2 text-xl font-semibold">Sets: {player2Sets}</div>
            {!player1Service && <div className="mt-1 text-blue-600 text-sm">Serving</div>}
          </div>
        </div>
        
        {/* Set information */}
        <div className="mb-4 md:mb-6">
          <h3 className="text-md font-semibold mb-2">Current Set: {currentSet}</h3>
          {sets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Set</th>
                    <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{match.teams.team1.name}</th>
                    <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{match.teams.team2.name}</th>
                    <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {sets.map((set, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className={`py-2 px-3 text-sm text-center ${set.winner === 'player1' ? 'font-bold text-green-600' : ''}`}>
                        {set.player1Score}
                      </td>
                      <td className={`py-2 px-3 text-sm text-center ${set.winner === 'player2' ? 'font-bold text-green-600' : ''}`}>
                        {set.player2Score}
                      </td>
                      <td className="py-2 px-3 text-sm text-center">
                        {set.winner === 'player1' ? match.teams.team1.name : match.teams.team2.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Game status */}
        {gamePoint && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
            <p className="text-yellow-800 font-semibold">
              {gamePoint === 'player1' ? match.teams.team1.name : match.teams.team2.name} has game point!
            </p>
          </div>
        )}
        
        {matchPoint && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center">
            <p className="text-red-800 font-semibold">
              {matchPoint === 'player1' ? match.teams.team1.name : match.teams.team2.name} has match point!
            </p>
          </div>
        )}
        
        {isDeuce && (
          <div className="mb-4 p-3 bg-purple-100 border border-purple-300 rounded-lg text-center">
            <p className="text-purple-800 font-semibold">Deuce! Two clear points needed to win.</p>
          </div>
        )}
        
        {/* Scoring controls */}
        {!isMatchOver ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => scorePoint('player1')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-4 md:px-6 rounded text-lg"
              disabled={isMatchOver}
            >
              Point for {match.teams.team1.name}
            </button>
            <button
              onClick={() => scorePoint('player2')}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-4 md:px-6 rounded text-lg"
              disabled={isMatchOver}
            >
              Point for {match.teams.team2.name}
            </button>
            
            <button
              onClick={toggleService}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded flex items-center justify-center"
              disabled={isMatchOver}
            >
              <FaExchangeAlt className="mr-2" />
              Switch Service
            </button>
            
            <button
              onClick={handleUndo}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded flex items-center justify-center"
              disabled={history.length === 0 || isMatchOver}
            >
              <FaUndo className="mr-2" />
              Undo Last Action
            </button>
          </div>
        ) : (
          <div className="text-center p-4 md:p-6 bg-green-100 border border-green-300 rounded-lg">
            <h3 className="text-xl font-bold text-green-800 mb-2">Match Complete!</h3>
            <p className="text-green-700 mb-4">{match.result.summary}</p>
            <button
              onClick={goBack}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
            >
              <FaCheck className="mr-2" />
              View Match Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadmintonScoring;

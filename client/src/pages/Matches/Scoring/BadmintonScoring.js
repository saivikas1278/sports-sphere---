import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUndo, FaRedo, FaPlus, FaMinus, FaFlag, FaCheck } from 'react-icons/fa';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import { showToast } from '../../../utils/toast';
import matchService from '../../../services/matchService';

const BadmintonScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({
    player1: {
      set1: 0,
      set2: 0,
      set3: 0,
      currentServer: false,
    },
    player2: {
      set1: 0,
      set2: 0,
      set3: 0,
      currentServer: false,
    },
    currentSet: 1,
    sets: [null, null, null], // null = not started, true = player1 won, false = player2 won
    gameOver: false,
    winner: null,
    history: [],
    matchPoint: false,
    setPoint: false,
  });
  
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const response = await matchService.getMatch(matchId);
        let matchData = null;
        if (response.success && response.data) {
          matchData = response.data;
        } else if (response.data && response.data.data) {
          matchData = response.data.data;
        }
        
        if (!matchData) {
          throw new Error('Match not found');
        }
        
        // Initialize match state
        setMatch({
          id: matchId,
          sport: matchData.sport || 'badminton',
          teams: {
            team1: {
              name: matchData.homeTeamData?.name || matchData.team1?.name || 'Player 1',
              players: matchData.homeTeamData?.players || matchData.team1?.players || [],
            },
            team2: {
              name: matchData.awayTeamData?.name || matchData.team2?.name || 'Player 2',
              players: matchData.awayTeamData?.players || matchData.team2?.players || [],
            }
          },
          venue: matchData.venue || { name: 'Local Venue' },
          date: matchData.scheduledTime || matchData.date || new Date().toISOString(),
          format: matchData.format || 'Singles',
          matchSettings: {
            setsToWin: 2,
            pointsPerSet: 21,
            tiebreakAt: 20, // If score is 20-20, play until 2 point difference or first to 30
          }
        });
        
        // If we have existing summary data, use it
        const summaryData = matchData.scorecard;
        if (summaryData && summaryData.badminton) {
          setScore(summaryData.badminton);
        } else {
          // Initialize with default values
          // For badminton, player 1 serves first in the first game
          setScore(prev => ({
            ...prev,
            player1: {
              ...prev.player1,
              currentServer: true,
            }
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching match data:', error);
        setLoading(false);
        // Navigate to matches page if match not found
        navigate('/matches');
      }
    };
    
    fetchMatchData();
  }, [matchId, navigate]);
  
  // Save score to API
  useEffect(() => {
    if (match && !loading) {
      const updatedSummary = {
        lastUpdated: new Date().toISOString(),
        badminton: score
      };

      const saveToApi = async () => {
        try {
          await matchService.updateMatch(matchId, {
            scorecard: updatedSummary
          });
        } catch (error) {
          console.error('Failed to save score update', error);
        }
      };
      saveToApi();
    }
  }, [score, match, matchId, loading]);
  
  // Check for game end conditions
  useEffect(() => {
    if (!match || loading) return;
    
    const { setsToWin, pointsPerSet } = match.matchSettings;
    const { player1, player2, currentSet, sets } = score;
    
    // Count sets won
    const player1Sets = sets.filter(set => set === true).length;
    const player2Sets = sets.filter(set => set === false).length;
    
    // Check if match is over
    if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
      setScore(prev => ({
        ...prev,
        gameOver: true,
        winner: player1Sets > player2Sets ? 'player1' : 'player2'
      }));
      return;
    }
    
    // Set scoring logic
    const currentPlayer1Score = player1[`set${currentSet}`];
    const currentPlayer2Score = player2[`set${currentSet}`];
    
    // Check if we're in tiebreak
    const inTiebreak = currentPlayer1Score >= match.matchSettings.tiebreakAt && 
                      currentPlayer2Score >= match.matchSettings.tiebreakAt;
    
    // Check for set end
    if (!inTiebreak && 
        (currentPlayer1Score >= pointsPerSet || currentPlayer2Score >= pointsPerSet) && 
        Math.abs(currentPlayer1Score - currentPlayer2Score) >= 2) {
      // Set is over
      const player1WonSet = currentPlayer1Score > currentPlayer2Score;
      
      // Update sets array
      const updatedSets = [...sets];
      updatedSets[currentSet - 1] = player1WonSet;
      
      if (currentSet < 3) {
        // Move to next set
        setScore(prev => ({
          ...prev,
          sets: updatedSets,
          currentSet: prev.currentSet + 1,
          // In badminton, player who won the previous set serves first in the next set
          player1: {
            ...prev.player1,
            currentServer: player1WonSet
          },
          player2: {
            ...prev.player2,
            currentServer: !player1WonSet
          },
          setPoint: false
        }));
      } else {
        // Match over after 3 sets
        setScore(prev => ({
          ...prev,
          sets: updatedSets,
          gameOver: true,
          winner: player1WonSet ? 'player1' : 'player2',
          setPoint: false,
          matchPoint: false
        }));
      }
      return;
    }
    
    // Check for tiebreak
    if (inTiebreak) {
      // In tiebreak, player wins by 2 or first to 30
      if ((currentPlayer1Score >= 30 || currentPlayer2Score >= 30) || 
          (Math.abs(currentPlayer1Score - currentPlayer2Score) >= 2 && 
          (currentPlayer1Score > 20 || currentPlayer2Score > 20))) {
        
        // Set is over
        const player1WonSet = currentPlayer1Score > currentPlayer2Score;
        
        // Update sets array
        const updatedSets = [...sets];
        updatedSets[currentSet - 1] = player1WonSet;
        
        if (currentSet < 3) {
          // Move to next set
          setScore(prev => ({
            ...prev,
            sets: updatedSets,
            currentSet: prev.currentSet + 1,
            // In badminton, player who won the previous set serves first in the next set
            player1: {
              ...prev.player1,
              currentServer: player1WonSet
            },
            player2: {
              ...prev.player2,
              currentServer: !player1WonSet
            },
            setPoint: false
          }));
        } else {
          // Match over after 3 sets
          setScore(prev => ({
            ...prev,
            sets: updatedSets,
            gameOver: true,
            winner: player1WonSet ? 'player1' : 'player2',
            setPoint: false,
            matchPoint: false
          }));
        }
        return;
      }
    }
    
    // Check for match point
    const nextPlayer1Sets = player1Sets + (currentPlayer1Score >= pointsPerSet - 1 && 
                                        currentPlayer1Score - currentPlayer2Score >= 1 ? 1 : 0);
    const nextPlayer2Sets = player2Sets + (currentPlayer2Score >= pointsPerSet - 1 && 
                                        currentPlayer2Score - currentPlayer1Score >= 1 ? 1 : 0);
    
    // Match point
    if (nextPlayer1Sets === setsToWin || nextPlayer2Sets === setsToWin) {
      setScore(prev => ({
        ...prev,
        matchPoint: true
      }));
    } else {
      setScore(prev => ({
        ...prev,
        matchPoint: false
      }));
    }
    
    // Check for set point
    if (!inTiebreak) {
      if ((currentPlayer1Score >= pointsPerSet - 1 && currentPlayer1Score - currentPlayer2Score >= 1) ||
          (currentPlayer2Score >= pointsPerSet - 1 && currentPlayer2Score - currentPlayer1Score >= 1)) {
        setScore(prev => ({
          ...prev,
          setPoint: true
        }));
      } else {
        setScore(prev => ({
          ...prev,
          setPoint: false
        }));
      }
    } else {
      // In tiebreak
      if (Math.abs(currentPlayer1Score - currentPlayer2Score) === 1 && 
          (currentPlayer1Score > match.matchSettings.tiebreakAt || 
           currentPlayer2Score > match.matchSettings.tiebreakAt)) {
        setScore(prev => ({
          ...prev,
          setPoint: true
        }));
      } else {
        setScore(prev => ({
          ...prev,
          setPoint: false
        }));
      }
    }
    
  }, [score, match, loading]);
  
  // Update score for a player
  const updateScore = (playerKey, increment = true) => {
    if (score.gameOver) return;
    
    const currentSet = `set${score.currentSet}`;
    
    // Record action for history (for undo)
    const newHistory = [...score.history];
    newHistory.push({
      type: 'scoreChange',
      playerKey,
      set: score.currentSet,
      previousScore: score[playerKey][currentSet]
    });
    
    // Update score
    setScore(prev => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        [currentSet]: increment ? prev[playerKey][currentSet] + 1 : Math.max(0, prev[playerKey][currentSet] - 1)
      },
      history: newHistory
    }));
    
    // In badminton, server changes when player wins a point
    if (increment) {
      toggleServer();
    }
  };
  
  // Toggle server
  const toggleServer = () => {
    setScore(prev => ({
      ...prev,
      player1: {
        ...prev.player1,
        currentServer: !prev.player1.currentServer
      },
      player2: {
        ...prev.player2,
        currentServer: !prev.player2.currentServer
      }
    }));
  };
  
  // Undo last action
  const undoLastAction = () => {
    if (score.history.length === 0) return;
    
    const lastAction = score.history[score.history.length - 1];
    const newHistory = [...score.history];
    newHistory.pop();
    
    if (lastAction.type === 'scoreChange') {
      const currentSet = `set${lastAction.set}`;
      
      setScore(prev => ({
        ...prev,
        [lastAction.playerKey]: {
          ...prev[lastAction.playerKey],
          [currentSet]: lastAction.previousScore
        },
        history: newHistory
      }));
      
      // Toggle server back
      toggleServer();
    }
  };
  
  // Complete match and save results
  const completeMatch = async () => {
    // Create final match summary
    const player1Sets = score.sets.filter(set => set === true).length;
    const player2Sets = score.sets.filter(set => set === false).length;
    
    const player1Name = match.teams.team1.name;
    const player2Name = match.teams.team2.name;
    
    const winnerName = score.winner === 'player1' ? player1Name : player2Name;
    const scoreText = `${score.player1.set1}-${score.player2.set1}, ${score.player1.set2}-${score.player2.set2}${score.currentSet > 2 ? `, ${score.player1.set3}-${score.player2.set3}` : ''}`;
    
    const resultSummary = `${winnerName} won ${player1Sets}-${player2Sets} (${scoreText})`;
    
    // In a real app, you would send this to the server
    const completedMatch = {
      id: match.id,
      sport: match.sport,
      teams: {
        team1: {
          ...match.teams.team1,
          score: player1Sets
        },
        team2: {
          ...match.teams.team2,
          score: player2Sets
        }
      },
      date: match.date,
      venue: match.venue,
      format: match.format,
      status: 'completed',
      result: {
        winningTeam: winnerName,
        losingTeam: score.winner === 'player1' ? player2Name : player1Name,
        summary: resultSummary,
        scorecard: {
          sets: [
            {
              player1Score: score.player1.set1,
              player2Score: score.player2.set1,
              winner: score.sets[0] === true ? 'player1' : 'player2'
            },
            {
              player1Score: score.player1.set2,
              player2Score: score.player2.set2, 
              winner: score.sets[1] === true ? 'player1' : 'player2'
            },
            score.currentSet > 2 ? {
              player1Score: score.player1.set3,
              player2Score: score.player2.set3,
              winner: score.sets[2] === true ? 'player1' : 'player2'
            } : null
          ].filter(Boolean)
        }
      }
    };
    try {
      await matchService.updateMatch(match.id, {
        status: 'completed',
        result: { summary: resultSummary },
        scorecard: completedMatch
      });
    } catch (err) {
      console.error('Failed to save match summary', err);
    }
    // Navigate to match details page
    navigate(`/matches/${match.id}`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 md:p-8 text-center">
          <div className="text-xl md:text-3xl md:text-5xl text-gray-400 mx-auto mb-4">🏸</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Not Found</h2>
          <p className="text-gray-600 mb-4 md:mb-6">
            The match you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Match Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {match.teams.team1.name} vs {match.teams.team2.name}
              </h1>
              <div className="text-sm text-gray-600">
                {match.venue?.name} • {new Date(match.date).toLocaleDateString()} • {match.format}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button
                onClick={undoLastAction}
                disabled={score.history.length === 0}
                className={`
                  inline-flex items-center px-3 py-1.5 rounded-md text-sm
                  ${score.history.length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}
                `}
              >
                <FaUndo className="mr-1.5" />
                Undo
              </button>
              
              {score.gameOver ? (
                <button
                  onClick={completeMatch}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaCheck className="mr-1.5" />
                  Complete Match
                </button>
              ) : (
                <button
                  onClick={() => setScore(prev => ({ ...prev, gameOver: true, winner: prev.player1.set1 > prev.player2.set1 ? 'player1' : 'player2' }))}
                  className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  <FaFlag className="mr-1.5" />
                  End Match
                </button>
              )}
            </div>
          </div>
          
          {/* Game Status */}
          {score.gameOver ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 md:mb-6 text-center">
              <div className="text-lg font-medium text-blue-800">
                Match Complete
              </div>
              <div className="text-blue-700 mt-1">
                {score.winner === 'player1' ? match.teams.team1.name : match.teams.team2.name} wins!
              </div>
            </div>
          ) : (
            <>
              {score.matchPoint && (
                <div className="bg-red-50 p-3 rounded-lg mb-4 text-center animate-pulse">
                  <div className="text-lg font-medium text-red-800">
                    Match Point
                  </div>
                </div>
              )}
              
              {!score.matchPoint && score.setPoint && (
                <div className="bg-amber-50 p-3 rounded-lg mb-4 text-center">
                  <div className="text-lg font-medium text-amber-800">
                    Set Point
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Scoreboard */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 md:mb-6">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-xl font-bold text-center">
              Set {score.currentSet}
            </h2>
          </div>
          
          <div className="p-4 md:p-6">
            {/* Sets Display */}
            <div className="grid grid-cols-4 mb-4 md:mb-6 border-b pb-4">
              <div className="col-span-1"></div>
              <div className="text-center font-semibold">Set 1</div>
              <div className="text-center font-semibold">Set 2</div>
              <div className="text-center font-semibold">Set 3</div>
            </div>
            
            {/* Player 1 Row */}
            <div className="grid grid-cols-4 mb-4 items-center">
              <div className="col-span-1 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${score.player1.currentServer ? 'bg-yellow-400' : 'bg-transparent'}`}></div>
                <div className="font-semibold">{match.teams.team1.name}</div>
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[0] === true ? 'text-green-600' : score.sets[0] === false ? 'text-gray-500' : ''}`}>
                {score.player1.set1}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[1] === true ? 'text-green-600' : score.sets[1] === false ? 'text-gray-500' : ''}`}>
                {score.player1.set2}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[2] === true ? 'text-green-600' : score.sets[2] === false ? 'text-gray-500' : ''}`}>
                {score.player1.set3}
              </div>
            </div>
            
            {/* Player 2 Row */}
            <div className="grid grid-cols-4 items-center">
              <div className="col-span-1 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${score.player2.currentServer ? 'bg-yellow-400' : 'bg-transparent'}`}></div>
                <div className="font-semibold">{match.teams.team2.name}</div>
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[0] === false ? 'text-green-600' : score.sets[0] === true ? 'text-gray-500' : ''}`}>
                {score.player2.set1}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[1] === false ? 'text-green-600' : score.sets[1] === true ? 'text-gray-500' : ''}`}>
                {score.player2.set2}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[2] === false ? 'text-green-600' : score.sets[2] === true ? 'text-gray-500' : ''}`}>
                {score.player2.set3}
              </div>
            </div>
          </div>
        </div>
        
        {/* Score Control Buttons */}
        {!score.gameOver && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Score Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {/* Player 1 Controls */}
              <div className="border rounded-lg p-4">
                <div className="text-center mb-3 font-medium">{match.teams.team1.name}</div>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => updateScore('player1', false)}
                    disabled={score.player1[`set${score.currentSet}`] <= 0}
                    className={`
                      flex-1 py-3 rounded-lg text-center
                      ${score.player1[`set${score.currentSet}`] <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'}
                    `}
                  >
                    <FaMinus className="mx-auto" />
                  </button>
                  <button
                    onClick={() => updateScore('player1', true)}
                    className="flex-1 py-3 bg-green-100 text-green-800 rounded-lg text-center hover:bg-green-200"
                  >
                    <FaPlus className="mx-auto" />
                  </button>
                </div>
              </div>
              
              {/* Player 2 Controls */}
              <div className="border rounded-lg p-4">
                <div className="text-center mb-3 font-medium">{match.teams.team2.name}</div>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => updateScore('player2', false)}
                    disabled={score.player2[`set${score.currentSet}`] <= 0}
                    className={`
                      flex-1 py-3 rounded-lg text-center
                      ${score.player2[`set${score.currentSet}`] <= 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'}
                    `}
                  >
                    <FaMinus className="mx-auto" />
                  </button>
                  <button
                    onClick={() => updateScore('player2', true)}
                    className="flex-1 py-3 bg-green-100 text-green-800 rounded-lg text-center hover:bg-green-200"
                  >
                    <FaPlus className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Service Toggle */}
            <div className="mt-4 md:mt-6 text-center">
              <button
                onClick={toggleServer}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                <FaRedo className="mr-2" />
                Toggle Server
              </button>
            </div>
          </div>
        )}
        
        {/* Match Complete Section */}
        {score.gameOver && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center">
            <div className="text-2xl md:text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Match Complete
            </h2>
            <p className="text-gray-600 mb-4 md:mb-6">
              {score.winner === 'player1' ? match.teams.team1.name : match.teams.team2.name} won the match
              {' '}{score.sets.filter(set => set === (score.winner === 'player1')).length}-{score.sets.filter(set => set === (score.winner === 'player2')).length}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate('/matches')}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Matches
              </button>
              <button
                onClick={completeMatch}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FaCheck className="mr-2" />
                Save & Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadmintonScoring;

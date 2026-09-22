import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUndo, FaPlus, FaMinus, FaFlag, FaCheck, FaExchangeAlt } from 'react-icons/fa';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import { showToast } from '../../../utils/toast';
import matchService from '../../../services/matchService';

const VolleyballScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({
    team1: {
      set1: 0,
      set2: 0,
      set3: 0,
      set4: 0,
      set5: 0,
      currentServer: false,
      timeouts: {
        set1: 0,
        set2: 0,
        set3: 0, 
        set4: 0,
        set5: 0
      }
    },
    team2: {
      set1: 0,
      set2: 0,
      set3: 0,
      set4: 0,
      set5: 0,
      currentServer: false,
      timeouts: {
        set1: 0,
        set2: 0, 
        set3: 0,
        set4: 0,
        set5: 0
      }
    },
    currentSet: 1,
    sets: [null, null, null, null, null], // null = not started, true = team1 won, false = team2 won
    gameOver: false,
    winner: null,
    history: [],
    matchPoint: false,
    setPoint: false,
    timeoutInProgress: false,
    rotations: {
      team1: [1, 2, 3, 4, 5, 6], // Player positions
      team2: [1, 2, 3, 4, 5, 6]  // Player positions
    }
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
        
        // Check if we already have a summary
        const summaryData = matchData.scorecard;
        
        // Initialize match state
        setMatch({
          id: matchId,
          sport: matchData.sport || 'volleyball',
          teams: {
            team1: {
              name: matchData.homeTeamData?.name || matchData.team1?.name || 'Team 1',
              players: matchData.homeTeamData?.players || matchData.team1?.players || [],
            },
            team2: {
              name: matchData.awayTeamData?.name || matchData.team2?.name || 'Team 2',
              players: matchData.awayTeamData?.players || matchData.team2?.players || [],
            }
          },
          venue: matchData.venue || { name: 'Local Venue' },
          date: matchData.scheduledTime || matchData.date || new Date().toISOString(),
          format: matchData.format || 'Standard',
          matchSettings: {
            setsToWin: 3, // Best of 5
            pointsPerSet: 25, // First to 25 points, win by 2
            finalSetPoints: 15, // Final set (5th) is played to 15 points
            timeoutsPerSet: 2 // Each team gets 2 timeouts per set
          }
        });
        
        // If we have existing summary data, use it
        if (summaryData && summaryData.volleyball) {
          setScore(summaryData.volleyball);
        } else {
          // Initialize with default values
          // For volleyball, determine initial server by coin toss (random for this demo)
          const team1Serves = Math.random() > 0.5;
          setScore(prev => ({
            ...prev,
            team1: {
              ...prev.team1,
              currentServer: team1Serves
            },
            team2: {
              ...prev.team2,
              currentServer: !team1Serves
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
  
  useEffect(() => {
    if (match && !loading) {
      const updatedSummary = {
        lastUpdated: new Date().toISOString(),
        volleyball: score
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
    
    const { setsToWin, pointsPerSet, finalSetPoints } = match.matchSettings;
    const { team1, team2, currentSet, sets } = score;
    
    // Count sets won
    const team1Sets = sets.filter(set => set === true).length;
    const team2Sets = sets.filter(set => set === false).length;
    
    // Check if match is over
    if (team1Sets >= setsToWin || team2Sets >= setsToWin) {
      setScore(prev => ({
        ...prev,
        gameOver: true,
        winner: team1Sets > team2Sets ? 'team1' : 'team2'
      }));
      return;
    }
    
    // Set scoring logic
    const currentTeam1Score = team1[`set${currentSet}`];
    const currentTeam2Score = team2[`set${currentSet}`];
    
    // Points needed to win the current set
    const pointsNeeded = currentSet === 5 ? finalSetPoints : pointsPerSet;
    
    // Check for set end (in volleyball, must win by 2 points)
    if ((currentTeam1Score >= pointsNeeded || currentTeam2Score >= pointsNeeded) && 
        Math.abs(currentTeam1Score - currentTeam2Score) >= 2) {
      // Set is over
      const team1WonSet = currentTeam1Score > currentTeam2Score;
      
      // Update sets array
      const updatedSets = [...sets];
      updatedSets[currentSet - 1] = team1WonSet;
      
      // Check if match is over
      const updatedTeam1Sets = updatedSets.filter(set => set === true).length;
      const updatedTeam2Sets = updatedSets.filter(set => set === false).length;
      
      if (updatedTeam1Sets >= setsToWin || updatedTeam2Sets >= setsToWin) {
        // Match over
        setScore(prev => ({
          ...prev,
          sets: updatedSets,
          gameOver: true,
          winner: updatedTeam1Sets > updatedTeam2Sets ? 'team1' : 'team2',
          setPoint: false,
          matchPoint: false
        }));
      } else if (currentSet < 5) {
        // Move to next set
        setScore(prev => ({
          ...prev,
          sets: updatedSets,
          currentSet: prev.currentSet + 1,
          // In volleyball, teams switch sides between sets
          // and the team that didn't serve first in the previous set serves first
          team1: {
            ...prev.team1,
            currentServer: !prev.team1.currentServer
          },
          team2: {
            ...prev.team2,
            currentServer: !prev.team2.currentServer
          },
          setPoint: false
        }));
      }
      return;
    }
    
    // Check for match point
    const nextTeam1Sets = team1Sets + (currentTeam1Score >= pointsNeeded - 1 && 
                                      currentTeam1Score - currentTeam2Score >= 1 ? 1 : 0);
    const nextTeam2Sets = team2Sets + (currentTeam2Score >= pointsNeeded - 1 && 
                                      currentTeam2Score - currentTeam1Score >= 1 ? 1 : 0);
    
    // Match point
    if (nextTeam1Sets === setsToWin || nextTeam2Sets === setsToWin) {
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
    if ((currentTeam1Score >= pointsNeeded - 1 && currentTeam1Score - currentTeam2Score >= 1) ||
        (currentTeam2Score >= pointsNeeded - 1 && currentTeam2Score - currentTeam1Score >= 1)) {
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
    
  }, [score, match, loading]);
  
  // Update score for a team
  const updateScore = (teamKey, increment = true) => {
    if (score.gameOver || score.timeoutInProgress) return;
    
    const currentSet = `set${score.currentSet}`;
    const otherTeamKey = teamKey === 'team1' ? 'team2' : 'team1';
    
    // Record action for history (for undo)
    const newHistory = [...score.history];
    newHistory.push({
      type: 'scoreChange',
      teamKey,
      set: score.currentSet,
      previousScore: score[teamKey][currentSet],
      previousServer: {
        team1: score.team1.currentServer,
        team2: score.team2.currentServer
      },
      previousRotations: {
        team1: [...score.rotations.team1],
        team2: [...score.rotations.team2]
      }
    });
    
    // In volleyball, when a team scores, they get (or keep) the serve
    const updatedScore = {
      ...score,
      [teamKey]: {
        ...score[teamKey],
        [currentSet]: increment ? score[teamKey][currentSet] + 1 : Math.max(0, score[teamKey][currentSet] - 1),
        currentServer: true
      },
      [otherTeamKey]: {
        ...score[otherTeamKey],
        currentServer: false
      },
      history: newHistory
    };
    
    // If team won the point and didn't have the serve, they need to rotate
    if (increment && !score[teamKey].currentServer) {
      // Rotate the scoring team's players
      const newRotation = [...updatedScore.rotations[teamKey]];
      // Move the last player to the front
      newRotation.unshift(newRotation.pop());
      
      updatedScore.rotations = {
        ...updatedScore.rotations,
        [teamKey]: newRotation
      };
    }
    
    setScore(updatedScore);
  };
  
  // Call a timeout
  const callTimeout = (teamKey) => {
    if (score.gameOver || score.timeoutInProgress) return;
    
    const currentSet = `set${score.currentSet}`;
    const currentTimeouts = score[teamKey].timeouts[currentSet];
    
    // Check if team has timeouts remaining
    if (currentTimeouts >= match.matchSettings.timeoutsPerSet) return;
    
    // Record action for history
    const newHistory = [...score.history];
    newHistory.push({
      type: 'timeout',
      teamKey,
      set: score.currentSet,
      previousTimeouts: currentTimeouts
    });
    
    // Update timeout count and set timeout flag
    setScore(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        timeouts: {
          ...prev[teamKey].timeouts,
          [currentSet]: currentTimeouts + 1
        }
      },
      timeoutInProgress: true,
      history: newHistory
    }));
    
    // Automatically end timeout after 30 seconds (simulated for demo)
    setTimeout(() => {
      setScore(prev => ({
        ...prev,
        timeoutInProgress: false
      }));
    }, 5000); // 5 seconds for demo purposes
  };
  
  // Undo last action
  const undoLastAction = () => {
    if (score.history.length === 0 || score.timeoutInProgress) return;
    
    const lastAction = score.history[score.history.length - 1];
    const newHistory = [...score.history];
    newHistory.pop();
    
    if (lastAction.type === 'scoreChange') {
      const currentSet = `set${lastAction.set}`;
      
      setScore(prev => ({
        ...prev,
        [lastAction.teamKey]: {
          ...prev[lastAction.teamKey],
          [currentSet]: lastAction.previousScore,
          currentServer: lastAction.previousServer.team1
        },
        team2: {
          ...prev.team2,
          currentServer: lastAction.previousServer.team2
        },
        rotations: {
          team1: lastAction.previousRotations.team1,
          team2: lastAction.previousRotations.team2
        },
        history: newHistory
      }));
    } else if (lastAction.type === 'timeout') {
      const currentSet = `set${lastAction.set}`;
      
      setScore(prev => ({
        ...prev,
        [lastAction.teamKey]: {
          ...prev[lastAction.teamKey],
          timeouts: {
            ...prev[lastAction.teamKey].timeouts,
            [currentSet]: lastAction.previousTimeouts
          }
        },
        history: newHistory
      }));
    }
  };
  
  // Rotate a team's players
  const rotateTeam = (teamKey) => {
    if (score.gameOver || score.timeoutInProgress) return;
    
    const newRotation = [...score.rotations[teamKey]];
    // Move the first player to the end for manual rotation
    newRotation.push(newRotation.shift());
    
    setScore(prev => ({
      ...prev,
      rotations: {
        ...prev.rotations,
        [teamKey]: newRotation
      }
    }));
  };
  
  // Complete match and save results
  const completeMatch = async () => {
    // Create final match summary
    const team1Sets = score.sets.filter(set => set === true).length;
    const team2Sets = score.sets.filter(set => set === false).length;
    
    const team1Name = match.teams.team1.name;
    const team2Name = match.teams.team2.name;
    
    const winnerName = score.winner === 'team1' ? team1Name : team2Name;
    const scoreText = score.sets.slice(0, Math.max(team1Sets + team2Sets, 3)).map((set, index) => {
      return `${score.team1[`set${index + 1}`]}-${score.team2[`set${index + 1}`]}`;
    }).join(', ');
    
    const resultSummary = `${winnerName} won ${team1Sets}-${team2Sets} (${scoreText})`;
    
    // In a real app, you would send this to the server
    const completedMatch = {
      id: match.id,
      sport: match.sport,
      teams: {
        team1: {
          ...match.teams.team1,
          score: team1Sets
        },
        team2: {
          ...match.teams.team2,
          score: team2Sets
        }
      },
      date: match.date,
      venue: match.venue,
      format: match.format,
      status: 'completed',
      result: {
        winningTeam: winnerName,
        losingTeam: score.winner === 'team1' ? team2Name : team1Name,
        summary: resultSummary,
        scorecard: {
          sets: score.sets.slice(0, Math.max(team1Sets + team2Sets, 3)).map((set, index) => {
            return {
              team1Score: score.team1[`set${index + 1}`],
              team2Score: score.team2[`set${index + 1}`],
              winner: set === true ? 'team1' : 'team2'
            };
          })
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
          <div className="text-xl md:text-3xl md:text-5xl text-gray-400 mx-auto mb-4">🏐</div>
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
                disabled={score.history.length === 0 || score.timeoutInProgress}
                className={`
                  inline-flex items-center px-3 py-1.5 rounded-md text-sm
                  ${score.history.length === 0 || score.timeoutInProgress
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
                  onClick={() => setScore(prev => ({ ...prev, gameOver: true, winner: prev.team1.set1 > prev.team2.set1 ? 'team1' : 'team2' }))}
                  className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  <FaFlag className="mr-1.5" />
                  End Match
                </button>
              )}
            </div>
          </div>
          
          {/* Game Status */}
          {score.timeoutInProgress && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-4 md:mb-6 text-center">
              <div className="text-lg font-medium text-yellow-800">
                Timeout in Progress
              </div>
              <div className="text-yellow-700 mt-1">
                Please wait...
              </div>
            </div>
          )}
          
          {score.gameOver ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 md:mb-6 text-center">
              <div className="text-lg font-medium text-blue-800">
                Match Complete
              </div>
              <div className="text-blue-700 mt-1">
                {score.winner === 'team1' ? match.teams.team1.name : match.teams.team2.name} wins!
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
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="text-xl font-bold">
              Set {score.currentSet}
            </div>
            <div className="text-sm">
              {score.team1.currentServer ? `${match.teams.team1.name} Serving` : 
               score.team2.currentServer ? `${match.teams.team2.name} Serving` : 'Service'}
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            {/* Sets Display */}
            <div className="grid grid-cols-6 mb-4 md:mb-6 border-b pb-4">
              <div className="col-span-1"></div>
              <div className="text-center font-semibold">Set 1</div>
              <div className="text-center font-semibold">Set 2</div>
              <div className="text-center font-semibold">Set 3</div>
              <div className="text-center font-semibold">Set 4</div>
              <div className="text-center font-semibold">Set 5</div>
            </div>
            
            {/* Team 1 Row */}
            <div className="grid grid-cols-6 mb-4 items-center">
              <div className="col-span-1 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${score.team1.currentServer ? 'bg-yellow-400' : 'bg-transparent'}`}></div>
                <div className="font-semibold truncate">{match.teams.team1.name}</div>
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[0] === true ? 'text-green-600' : score.sets[0] === false ? 'text-gray-500' : ''}`}>
                {score.team1.set1}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[1] === true ? 'text-green-600' : score.sets[1] === false ? 'text-gray-500' : ''}`}>
                {score.team1.set2}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[2] === true ? 'text-green-600' : score.sets[2] === false ? 'text-gray-500' : ''}`}>
                {score.team1.set3}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[3] === true ? 'text-green-600' : score.sets[3] === false ? 'text-gray-500' : ''}`}>
                {score.team1.set4}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[4] === true ? 'text-green-600' : score.sets[4] === false ? 'text-gray-500' : ''}`}>
                {score.team1.set5}
              </div>
            </div>
            
            {/* Team 2 Row */}
            <div className="grid grid-cols-6 items-center">
              <div className="col-span-1 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${score.team2.currentServer ? 'bg-yellow-400' : 'bg-transparent'}`}></div>
                <div className="font-semibold truncate">{match.teams.team2.name}</div>
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[0] === false ? 'text-green-600' : score.sets[0] === true ? 'text-gray-500' : ''}`}>
                {score.team2.set1}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[1] === false ? 'text-green-600' : score.sets[1] === true ? 'text-gray-500' : ''}`}>
                {score.team2.set2}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[2] === false ? 'text-green-600' : score.sets[2] === true ? 'text-gray-500' : ''}`}>
                {score.team2.set3}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[3] === false ? 'text-green-600' : score.sets[3] === true ? 'text-gray-500' : ''}`}>
                {score.team2.set4}
              </div>
              <div className={`text-center text-2xl font-bold ${score.sets[4] === false ? 'text-green-600' : score.sets[4] === true ? 'text-gray-500' : ''}`}>
                {score.team2.set5}
              </div>
            </div>
            
            {/* Timeouts Display */}
            <div className="mt-4 md:mt-6 grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium text-center mb-2">Timeouts - {match.teams.team1.name}</div>
                <div className="flex justify-center">
                  {Array.from({ length: match.matchSettings.timeoutsPerSet }).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-4 h-4 mx-1 rounded-full border ${
                        i < score.team1.timeouts[`set${score.currentSet}`] 
                          ? 'bg-red-500 border-red-600' 
                          : 'bg-gray-200 border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium text-center mb-2">Timeouts - {match.teams.team2.name}</div>
                <div className="flex justify-center">
                  {Array.from({ length: match.matchSettings.timeoutsPerSet }).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-4 h-4 mx-1 rounded-full border ${
                        i < score.team2.timeouts[`set${score.currentSet}`] 
                          ? 'bg-red-500 border-red-600' 
                          : 'bg-gray-200 border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Score Control Buttons */}
        {!score.gameOver && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Score Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {/* Team 1 Controls */}
              <div className="border rounded-lg p-4">
                <div className="text-center mb-3 font-medium">{match.teams.team1.name}</div>
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => updateScore('team1', false)}
                      disabled={score.team1[`set${score.currentSet}`] <= 0 || score.timeoutInProgress}
                      className={`
                        flex-1 py-3 rounded-lg text-center
                        ${score.team1[`set${score.currentSet}`] <= 0 || score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'}
                      `}
                    >
                      <FaMinus className="mx-auto" />
                    </button>
                    <button
                      onClick={() => updateScore('team1', true)}
                      disabled={score.timeoutInProgress}
                      className={`
                        flex-1 py-3 rounded-lg text-center
                        ${score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'}
                      `}
                    >
                      <FaPlus className="mx-auto" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => callTimeout('team1')}
                      disabled={
                        score.team1.timeouts[`set${score.currentSet}`] >= match.matchSettings.timeoutsPerSet ||
                        score.timeoutInProgress
                      }
                      className={`
                        py-2 rounded-lg text-center text-sm
                        ${score.team1.timeouts[`set${score.currentSet}`] >= match.matchSettings.timeoutsPerSet || score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}
                      `}
                    >
                      Timeout
                    </button>
                    <button
                      onClick={() => rotateTeam('team1')}
                      disabled={score.timeoutInProgress}
                      className={`
                        py-2 rounded-lg text-center text-sm
                        ${score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}
                      `}
                    >
                      <FaExchangeAlt className="inline-block mr-1" />
                      Rotate
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Team 2 Controls */}
              <div className="border rounded-lg p-4">
                <div className="text-center mb-3 font-medium">{match.teams.team2.name}</div>
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => updateScore('team2', false)}
                      disabled={score.team2[`set${score.currentSet}`] <= 0 || score.timeoutInProgress}
                      className={`
                        flex-1 py-3 rounded-lg text-center
                        ${score.team2[`set${score.currentSet}`] <= 0 || score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'}
                      `}
                    >
                      <FaMinus className="mx-auto" />
                    </button>
                    <button
                      onClick={() => updateScore('team2', true)}
                      disabled={score.timeoutInProgress}
                      className={`
                        flex-1 py-3 rounded-lg text-center
                        ${score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'}
                      `}
                    >
                      <FaPlus className="mx-auto" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => callTimeout('team2')}
                      disabled={
                        score.team2.timeouts[`set${score.currentSet}`] >= match.matchSettings.timeoutsPerSet ||
                        score.timeoutInProgress
                      }
                      className={`
                        py-2 rounded-lg text-center text-sm
                        ${score.team2.timeouts[`set${score.currentSet}`] >= match.matchSettings.timeoutsPerSet || score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}
                      `}
                    >
                      Timeout
                    </button>
                    <button
                      onClick={() => rotateTeam('team2')}
                      disabled={score.timeoutInProgress}
                      className={`
                        py-2 rounded-lg text-center text-sm
                        ${score.timeoutInProgress
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}
                      `}
                    >
                      <FaExchangeAlt className="inline-block mr-1" />
                      Rotate
                    </button>
                  </div>
                </div>
              </div>
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
              {score.winner === 'team1' ? match.teams.team1.name : match.teams.team2.name} won the match
              {' '}{score.sets.filter(set => set === (score.winner === 'team1')).length}-{score.sets.filter(set => set === (score.winner !== 'team1')).length}
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

export default VolleyballScoring;

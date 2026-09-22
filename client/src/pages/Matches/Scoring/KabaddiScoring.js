import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaUndo, FaFlag } from 'react-icons/fa';
import { GiWhistle } from 'react-icons/gi';
import matchService from '../../../services/matchService';
import { showToast } from '../../../utils/toast';

const KabaddiScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({
    team1: {
      points: 0,
      raids: 0,
      successfulRaids: 0,
      tackles: 0,
      allOuts: 0,
      bonusPoints: 0,
      players: []
    },
    team2: {
      points: 0,
      raids: 0,
      successfulRaids: 0,
      tackles: 0,
      allOuts: 0,
      bonusPoints: 0,
      players: []
    },
    currentHalf: 1,
    halftimeScore: { team1: 0, team2: 0 },
    timeElapsed: 0,
    matchDuration: 40, // 40 minutes standard kabaddi match
    raidDuration: 30, // 30 seconds per raid
    currentRaider: null, // 'team1' or 'team2'
    isRaidActive: false,
    raidTimeLeft: 30,
    history: [],
    gameOver: false,
    winner: null,
    isHalftime: false
  });

  // Load match data
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const response = await matchService.getMatch(matchId);
        let matchData = null;
        if (response.success && response.data) {
          matchData = response.data;
        } else if (response.data && response.data.data) {
          matchData = response.data.data;
        }
        
        if (matchData) {
          const formattedMatch = {
            id: matchData._id || matchData.id,
            sport: matchData.sport || 'kabaddi',
            teams: {
              team1: {
                name: matchData.homeTeamName || matchData.homeTeam?.name || 'Team 1',
                players: matchData.homeTeamPlayers?.length ? matchData.homeTeamPlayers.map(p => ({
                  id: p._id, name: `${p.firstName} ${p.lastName}`
                })) : []
              },
              team2: {
                name: matchData.awayTeamName || matchData.awayTeam?.name || 'Team 2',
                players: matchData.awayTeamPlayers?.length ? matchData.awayTeamPlayers.map(p => ({
                  id: p._id, name: `${p.firstName} ${p.lastName}`
                })) : []
              }
            },
            status: matchData.status || 'live',
            result: matchData.result || null,
          };
          setMatch(formattedMatch);
          
          // If match has result, initialize scoring state
          if (formattedMatch.result && formattedMatch.result.scorecard) {
            setScore(prevScore => ({
              ...prevScore,
              team1: {
                ...prevScore.team1,
                points: formattedMatch.result.scorecard.finalScore?.team1 || 0
              },
              team2: {
                ...prevScore.team2,
                points: formattedMatch.result.scorecard.finalScore?.team2 || 0
              },
              gameOver: formattedMatch.status === 'completed',
              winner: formattedMatch.result.winner
            }));
          } else if (matchData.scorecard && matchData.scorecard.kabaddi) {
            // Restore ongoing state if needed
            setScore(prevScore => ({
              ...prevScore,
              ...matchData.scorecard.kabaddi
            }));
          }

          // Initialize players if available in the team data
          if (formattedMatch.teams.team1.players && formattedMatch.teams.team1.players.length > 0) {
            setScore(prevScore => ({
              ...prevScore,
              team1: {
                ...prevScore.team1,
                players: formattedMatch.teams.team1.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  number: p.number || '',
                  position: p.position || '',
                  raidPoints: 0,
                  tacklePoints: 0,
                  totalPoints: 0,
                  isOnCourt: true
                }))
              },
              team2: {
                ...prevScore.team2,
                players: formattedMatch.teams.team2.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  number: p.number || '',
                  position: p.position || '',
                  raidPoints: 0,
                  tacklePoints: 0,
                  totalPoints: 0,
                  isOnCourt: true
                }))
              }
            }));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading match data:", error);
        showToast("Error loading match data", "error");
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Add a point to a team
  const addPoint = (team, pointType, player = null) => {
    // Save current state for undo
    const newHistory = [...score.history, { ...score }];
    
    setScore(prevScore => {
      const updatedTeam = { ...prevScore[team] };
      
      // Update team stats
      updatedTeam.points += 1;
      
      switch (pointType) {
        case 'raid':
          updatedTeam.raids += 1;
          updatedTeam.successfulRaids += 1;
          break;
        case 'tackle':
          updatedTeam.tackles += 1;
          break;
        case 'allOut':
          updatedTeam.allOuts += 1;
          updatedTeam.points += 1; // Additional point for all out
          break;
        case 'bonus':
          updatedTeam.bonusPoints += 1;
          break;
        default:
          break;
      }
      
      // Update player stats if player is provided
      if (player && updatedTeam.players.length > 0) {
        const updatedPlayers = updatedTeam.players.map(p => {
          if (p.id === player.id) {
            return {
              ...p,
              raidPoints: pointType === 'raid' ? p.raidPoints + 1 : p.raidPoints,
              tacklePoints: pointType === 'tackle' ? p.tacklePoints + 1 : p.tacklePoints,
              totalPoints: p.totalPoints + 1
            };
          }
          return p;
        });
        
        updatedTeam.players = updatedPlayers;
      }
      
      return {
        ...prevScore,
        [team]: updatedTeam,
        history: newHistory
      };
    });
  };

  // Record an all out
  const recordAllOut = (team) => {
    // All out means the team gets 2 points and all players return to court
    const scoringTeam = team === 'team1' ? 'team2' : 'team1';
    
    // Save current state for undo
    const newHistory = [...score.history, { ...score }];
    
    setScore(prevScore => {
      const updatedScoringTeam = { ...prevScore[scoringTeam] };
      const updatedDefendingTeam = { ...prevScore[team] };
      
      // Add 2 points to scoring team
      updatedScoringTeam.points += 2;
      updatedScoringTeam.allOuts += 1;
      
      // Reset all players for the defending team to be on court
      if (updatedDefendingTeam.players.length > 0) {
        updatedDefendingTeam.players = updatedDefendingTeam.players.map(p => ({
          ...p,
          isOnCourt: true
        }));
      }
      
      return {
        ...prevScore,
        [scoringTeam]: updatedScoringTeam,
        [team]: updatedDefendingTeam,
        history: newHistory
      };
    });
  };

  // Toggle player on/off court
  const togglePlayerStatus = (team, playerId) => {
    // Save current state for undo
    const newHistory = [...score.history, { ...score }];
    
    setScore(prevScore => {
      const updatedTeam = { ...prevScore[team] };
      
      if (updatedTeam.players.length > 0) {
        updatedTeam.players = updatedTeam.players.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              isOnCourt: !p.isOnCourt
            };
          }
          return p;
        });
      }
      
      return {
        ...prevScore,
        [team]: updatedTeam,
        history: newHistory
      };
    });
    
    // Check if all players are off court (all out)
    checkForAllOut(team);
  };

  // Check if a team has all players off court (all out)
  const checkForAllOut = (team) => {
    const teamPlayers = score[team].players;
    
    if (teamPlayers.length > 0) {
      const allPlayersOut = teamPlayers.every(p => !p.isOnCourt);
      
      if (allPlayersOut) {
        recordAllOut(team);
      }
    }
  };

  // Start a raid
  const startRaid = (team) => {
    setScore(prevScore => ({
      ...prevScore,
      currentRaider: team,
      isRaidActive: true,
      raidTimeLeft: 30
    }));
    
    // You would start a timer here in a real implementation
    // For demo purposes, we're not implementing the full timer logic
  };

  // End a raid
  const endRaid = (result) => {
    // result can be 'success', 'failure', or 'empty'
    const raidingTeam = score.currentRaider;
    const defendingTeam = raidingTeam === 'team1' ? 'team2' : 'team1';
    
    if (result === 'success') {
      // Raider gets a point
      addPoint(raidingTeam, 'raid');
    } else if (result === 'failure') {
      // Defending team gets a point
      addPoint(defendingTeam, 'tackle');
    }
    
    setScore(prevScore => ({
      ...prevScore,
      currentRaider: null,
      isRaidActive: false,
      raidTimeLeft: 30
    }));
  };

  // Switch halves
  const switchHalves = () => {
    setScore(prevScore => ({
      ...prevScore,
      currentHalf: 2,
      halftimeScore: {
        team1: prevScore.team1.points,
        team2: prevScore.team2.points
      },
      isHalftime: false
    }));
  };

  // End the match
  const endMatch = () => {
    const team1Score = score.team1.points;
    const team2Score = score.team2.points;
    
    let winner, result;
    
    if (team1Score > team2Score) {
      winner = 'team1';
      result = `${match.teams.team1.name} won by ${team1Score - team2Score} points`;
    } else if (team2Score > team1Score) {
      winner = 'team2';
      result = `${match.teams.team2.name} won by ${team2Score - team1Score} points`;
    } else {
      winner = 'draw';
      result = 'Match ended in a draw';
    }
    
    setScore(prevScore => ({
      ...prevScore,
      gameOver: true,
      winner
    }));
    
    const endMatchAsync = async () => {
      try {
        await matchService.updateMatch(matchId, {
          status: 'completed',
          result: {
            winner,
            summary: result,
            scorecard: {
              halftimeScore: score.halftimeScore,
              finalScore: {
                team1: team1Score,
                team2: team2Score
              },
              stats: {
                team1: {
                  raids: score.team1.raids,
                  successfulRaids: score.team1.successfulRaids,
                  tackles: score.team1.tackles,
                  allOuts: score.team1.allOuts,
                  bonusPoints: score.team1.bonusPoints
                },
                team2: {
                  raids: score.team2.raids,
                  successfulRaids: score.team2.successfulRaids,
                  tackles: score.team2.tackles,
                  allOuts: score.team2.allOuts,
                  bonusPoints: score.team2.bonusPoints
                }
              },
              playerStats: {
                team1: score.team1.players,
                team2: score.team2.players
              }
            }
          }
        });
        showToast("Match completed successfully", "success");
      } catch (error) {
        console.error("Failed to save match result", error);
        showToast("Failed to save match result", "error");
      }
    };
    endMatchAsync();
  };

  // Undo last action
  const undoLastAction = () => {
    if (score.history.length > 0) {
      const previousState = score.history[score.history.length - 1];
      
      setScore({
        ...previousState,
        history: score.history.slice(0, -1)
      });
    }
  };

  // Return to match details
  const goBack = () => {
    navigate(`/matches/${matchId}`);
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
        <h1 className="text-2xl font-bold">Kabaddi Scoring</h1>
      </div>
      
      {/* Match Info */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-xl font-semibold mb-4">{match.title || `${match.teams.team1.name} vs ${match.teams.team2.name}`}</h2>
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
        <div className="text-center mb-4">
          <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {score.currentHalf === 1 ? '1st Half' : '2nd Half'}
          </span>
          {score.isRaidActive && (
            <span className="ml-3 text-sm font-medium bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              Raid in Progress: {score.raidTimeLeft}s
            </span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-6">
          <div className="flex-1 text-center mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-2">{match.teams.team1.name}</h3>
            <div className={`text-6xl font-bold ${score.currentRaider === 'team1' ? 'text-blue-600' : 'text-gray-700'}`}>
              {score.team1.points}
            </div>
            {score.currentRaider === 'team1' && (
              <div className="mt-1 text-blue-600 text-sm">Raiding</div>
            )}
          </div>
          
          <div className="flex items-center justify-center px-4 mb-4 md:mb-0">
            <div className="text-xl md:text-3xl font-bold text-gray-400">vs</div>
          </div>
          
          <div className="flex-1 text-center">
            <h3 className="text-lg font-semibold mb-2">{match.teams.team2.name}</h3>
            <div className={`text-6xl font-bold ${score.currentRaider === 'team2' ? 'text-blue-600' : 'text-gray-700'}`}>
              {score.team2.points}
            </div>
            {score.currentRaider === 'team2' && (
              <div className="mt-1 text-blue-600 text-sm">Raiding</div>
            )}
          </div>
        </div>
        
        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
          {/* Team 1 Stats */}
          <div className="border rounded-lg p-4">
            <h4 className="text-center font-semibold mb-3">{match.teams.team1.name} Stats</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm"><span className="font-medium">Raids:</span> {score.team1.raids}</div>
              <div className="text-sm"><span className="font-medium">Successful:</span> {score.team1.successfulRaids}</div>
              <div className="text-sm"><span className="font-medium">Tackles:</span> {score.team1.tackles}</div>
              <div className="text-sm"><span className="font-medium">All Outs:</span> {score.team1.allOuts}</div>
              <div className="text-sm"><span className="font-medium">Bonus Points:</span> {score.team1.bonusPoints}</div>
              <div className="text-sm"><span className="font-medium">Players On Court:</span> {score.team1.players.filter(p => p.isOnCourt).length}/{score.team1.players.length}</div>
            </div>
          </div>
          
          {/* Team 2 Stats */}
          <div className="border rounded-lg p-4">
            <h4 className="text-center font-semibold mb-3">{match.teams.team2.name} Stats</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm"><span className="font-medium">Raids:</span> {score.team2.raids}</div>
              <div className="text-sm"><span className="font-medium">Successful:</span> {score.team2.successfulRaids}</div>
              <div className="text-sm"><span className="font-medium">Tackles:</span> {score.team2.tackles}</div>
              <div className="text-sm"><span className="font-medium">All Outs:</span> {score.team2.allOuts}</div>
              <div className="text-sm"><span className="font-medium">Bonus Points:</span> {score.team2.bonusPoints}</div>
              <div className="text-sm"><span className="font-medium">Players On Court:</span> {score.team2.players.filter(p => p.isOnCourt).length}/{score.team2.players.length}</div>
            </div>
          </div>
        </div>
        
        {/* Raid Controls */}
        {!score.gameOver && !score.isHalftime && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
            {!score.isRaidActive ? (
              <>
                <button
                  onClick={() => startRaid('team1')}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
                >
                  {match.teams.team1.name} Raid
                </button>
                <button
                  onClick={() => startRaid('team2')}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                >
                  {match.teams.team2.name} Raid
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => endRaid('success')}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                >
                  Successful Raid
                </button>
                <button
                  onClick={() => endRaid('failure')}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-4 rounded"
                >
                  Unsuccessful Raid
                </button>
                <button
                  onClick={() => endRaid('empty')}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded col-span-1 md:col-span-2"
                >
                  Empty Raid (No Points)
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Scoring Controls */}
        {!score.gameOver && !score.isHalftime && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
            {/* Team 1 Scoring */}
            <div className="border rounded-lg p-4">
              <h4 className="text-center font-semibold mb-3">{match.teams.team1.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addPoint('team1', 'raid')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded"
                >
                  +1 Raid Point
                </button>
                <button
                  onClick={() => addPoint('team1', 'tackle')}
                  className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded"
                >
                  +1 Tackle Point
                </button>
                <button
                  onClick={() => addPoint('team1', 'bonus')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-4 rounded"
                >
                  +1 Bonus Point
                </button>
                <button
                  onClick={() => recordAllOut('team2')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded"
                >
                  All Out
                </button>
              </div>
            </div>
            
            {/* Team 2 Scoring */}
            <div className="border rounded-lg p-4">
              <h4 className="text-center font-semibold mb-3">{match.teams.team2.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addPoint('team2', 'raid')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded"
                >
                  +1 Raid Point
                </button>
                <button
                  onClick={() => addPoint('team2', 'tackle')}
                  className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded"
                >
                  +1 Tackle Point
                </button>
                <button
                  onClick={() => addPoint('team2', 'bonus')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-4 rounded"
                >
                  +1 Bonus Point
                </button>
                <button
                  onClick={() => recordAllOut('team1')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded"
                >
                  All Out
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Player Management */}
        {score.team1.players.length > 0 && !score.gameOver && !score.isHalftime && (
          <div className="mb-4 md:mb-6">
            <h3 className="text-lg font-semibold mb-3">Player Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {/* Team 1 Players */}
              <div>
                <h4 className="font-medium mb-2">{match.teams.team1.name}</h4>
                <div className="space-y-2">
                  {score.team1.players.map(player => (
                    <div key={player.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({player.totalPoints} pts)</span>
                      </div>
                      <button
                        onClick={() => togglePlayerStatus('team1', player.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          player.isOnCourt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {player.isOnCourt ? 'On Court' : 'Off Court'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Team 2 Players */}
              <div>
                <h4 className="font-medium mb-2">{match.teams.team2.name}</h4>
                <div className="space-y-2">
                  {score.team2.players.map(player => (
                    <div key={player.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({player.totalPoints} pts)</span>
                      </div>
                      <button
                        onClick={() => togglePlayerStatus('team2', player.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          player.isOnCourt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {player.isOnCourt ? 'On Court' : 'Off Court'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Control Buttons */}
        {!score.gameOver ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={undoLastAction}
              disabled={score.history.length === 0}
              className={`
                py-2 px-4 rounded font-medium flex items-center justify-center
                ${score.history.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}
              `}
            >
              <FaUndo className="mr-2" />
              Undo
            </button>
            
            {!score.isHalftime && score.currentHalf === 1 && (
              <button
                onClick={() => setScore(prev => ({ ...prev, isHalftime: true }))}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded flex items-center justify-center"
              >
                <GiWhistle className="mr-2" />
                Halftime
              </button>
            )}
            
            <button
              onClick={endMatch}
              className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded flex items-center justify-center col-span-2"
            >
              <FaFlag className="mr-2" />
              End Match
            </button>
          </div>
        ) : (
          <div className="text-center p-4 md:p-6 bg-green-100 border border-green-300 rounded-lg">
            <h3 className="text-xl font-bold text-green-800 mb-2">Match Complete!</h3>
            <p className="text-green-700 mb-4">
              {score.winner === 'team1' 
                ? `${match.teams.team1.name} won by ${score.team1.points - score.team2.points} points`
                : score.winner === 'team2'
                  ? `${match.teams.team2.name} won by ${score.team2.points - score.team1.points} points`
                  : 'Match ended in a draw'}
            </p>
            <button
              onClick={goBack}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
            >
              <FaCheck className="mr-2" />
              View Match Details
            </button>
          </div>
        )}
        
        {/* Halftime Screen */}
        {score.isHalftime && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 md:p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-center mb-4 md:mb-6">Halftime</h2>
              
              <div className="flex justify-between items-center mb-4 md:mb-8">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">{match.teams.team1.name}</h3>
                  <div className="text-2xl md:text-4xl font-bold">{score.team1.points}</div>
                </div>
                
                <div className="text-xl font-bold">-</div>
                
                <div className="text-center">
                  <h3 className="font-semibold mb-2">{match.teams.team2.name}</h3>
                  <div className="text-2xl md:text-4xl font-bold">{score.team2.points}</div>
                </div>
              </div>
              
              <button
                onClick={switchHalves}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
              >
                Start Second Half
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KabaddiScoring;

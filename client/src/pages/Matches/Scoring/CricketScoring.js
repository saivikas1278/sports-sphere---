import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaBaseballBall, FaRunning, FaExchangeAlt, FaDownload, 
  FaCheck, FaTimes, FaPlus, FaPlay
} from 'react-icons/fa';
import { GiCricketBat } from 'react-icons/gi';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import { showToast } from '../../../utils/toast';
import matchService from '../../../services/matchService';

const CricketScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  // Match state
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(1); // 1 or 2
  const [battingTeam, setBattingTeam] = useState(null);
  const [bowlingTeam, setBowlingTeam] = useState(null);
  
  // Batting state
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [currentBowler, setCurrentBowler] = useState(null);
  const [batsmen, setBatsmen] = useState([]);
  const [bowlers, setBowlers] = useState([]);
  
  // Score state
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);
  const [target, setTarget] = useState(null);
  const [extras, setExtras] = useState(0);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Modals
  const [showBatsmanModal, setShowBatsmanModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showInningsEndModal, setShowInningsEndModal] = useState(false);
  const [eventHistory, setEventHistory] = useState([]);
  
  useEffect(() => {
    // Simulate fetching match data
    const fetchMatch = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch match data
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

        // Format to what the UI expects
        const homePlayers = matchData.homeTeamPlayers?.length ? matchData.homeTeamPlayers.map(p => ({
          id: p._id, name: `${p.firstName} ${p.lastName}`, position: p.role || 'Player'
        })) : [
          { id: '1', name: 'Player 1', position: 'Batsman' },
          { id: '2', name: 'Player 2', position: 'Bowler' },
        ];
        
        const awayPlayers = matchData.awayTeamPlayers?.length ? matchData.awayTeamPlayers.map(p => ({
          id: p._id, name: `${p.firstName} ${p.lastName}`, position: p.role || 'Player'
        })) : [
          { id: '3', name: 'Player 3', position: 'Batsman' },
          { id: '4', name: 'Player 4', position: 'Bowler' },
        ];

        const mockMatch = {
          id: matchId,
          sport: 'cricket',
          team1: {
            name: matchData.homeTeamName || matchData.homeTeam?.name || 'Home Team',
            players: homePlayers
          },
          team2: {
            name: matchData.awayTeamName || matchData.awayTeam?.name || 'Away Team',
            players: awayPlayers
          },
          date: matchData.scheduledTime || matchData.date || new Date().toISOString(),
          status: matchData.status || 'in_progress',
          format: matchData.format || 'T20',
          venue: matchData.venue?.name || 'Local Stadium',
          toss: matchData.toss || {
            winner: 'team1',
            decision: 'bat'
          }
        };
        
        setMatch(mockMatch);
        
        // Initialize the first innings based on toss
        const firstBattingTeam = mockMatch.toss.winner === 'team1' && mockMatch.toss.decision === 'bat' ? 
          mockMatch.team1 : mockMatch.team2;
        const firstBowlingTeam = firstBattingTeam === mockMatch.team1 ? mockMatch.team2 : mockMatch.team1;
        
        setBattingTeam(firstBattingTeam);
        setBowlingTeam(firstBowlingTeam);
        
        // Initialize batsmen stats
        const initialBatsmen = firstBattingTeam.players.map(player => ({
          ...player,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          status: 'not_out',
          battingOrder: 0,
        }));
        
        // Initialize bowler stats
        const initialBowlers = firstBowlingTeam.players.map(player => ({
          ...player,
          overs: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
          balls: 0,
        }));
        
        setBatsmen(initialBatsmen);
        setBowlers(initialBowlers);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching match:', error);
        showToast('Failed to load match data', 'error');
        setLoading(false);
      }
    };
    
    fetchMatch();
  }, [matchId]);
  
  // Helper function to format overs (e.g., 4.3 means 4 overs and 3 balls)
  const formatOvers = (overs, balls) => {
    return `${overs}.${balls}`;
  };
  
  // Handle opening batsmen selection
  const handleSelectOpeningBatsmen = (player) => {
    if (!striker) {
      setStriker(player);
      // Mark this player as 1st in batting order
      setBatsmen(prev => prev.map(p => 
        p.id === player.id ? { ...p, battingOrder: 1 } : p
      ));
    } else if (!nonStriker && player.id !== striker.id) {
      setNonStriker(player);
      // Mark this player as 2nd in batting order
      setBatsmen(prev => prev.map(p => 
        p.id === player.id ? { ...p, battingOrder: 2 } : p
      ));
      setShowBatsmanModal(false);
    }
  };
  
  // Handle opening bowler selection
  const handleSelectBowler = (player) => {
    setCurrentBowler(player);
    setShowBowlerModal(false);
  };
  
  // Handle ball delivery
  const handleDelivery = (runsScored, isExtra = false, extraType = null, isWicket = false) => {
    // Handle wicket
    if (isWicket) {
      setShowWicketModal(true);
      return;
    }
    
    // Handle extras
    if (isExtra) {
      setShowExtrasModal(true);
      return;
    }
    
    // Regular delivery
    // Update match score
    setRuns(prev => prev + runsScored);
    
    // Update striker stats
    setBatsmen(prev => prev.map(p => 
      p.id === striker.id ? { 
        ...p, 
        runs: p.runs + runsScored,
        balls: p.balls + 1,
        fours: runsScored === 4 ? p.fours + 1 : p.fours,
        sixes: runsScored === 6 ? p.sixes + 1 : p.sixes,
      } : p
    ));
    
    // Update bowler stats
    setBowlers(prev => prev.map(p => 
      p.id === currentBowler.id ? { 
        ...p, 
        runs: p.runs + runsScored,
        balls: p.balls + 1,
        overs: Math.floor((p.balls + 1) / 6),
        economy: ((p.runs + runsScored) / ((p.balls + 1) / 6)).toFixed(2),
      } : p
    ));
    
    // Update ball count
    const newBalls = balls + 1;
    setBalls(newBalls);
    
    // If 6 balls completed, increment over and reset balls
    if (newBalls === 6) {
      setOvers(prev => prev + 1);
      setBalls(0);
      
      // Swap striker and non-striker
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
      
      // Check if bowler needs to change (in real app, you'd prompt for a new bowler)
      setShowBowlerModal(true);
    }
    
    // If odd runs, swap striker and non-striker
    if (runsScored % 2 === 1) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }
    
    // Add to event history
    addToEventHistory(runsScored, isExtra, extraType, isWicket, null);
    
    // Check if innings is completed (all out or overs completed)
    checkInningsCompletion();
    
    // Check if match is won
    checkMatchWon();
  };
  
  // Handle extras
  const handleExtras = (extraType, runs) => {
    // Update match score
    setRuns(prev => prev + runs);
    setExtras(prev => prev + runs);
    
    // Update bowler stats (extras are charged to the bowler except for byes and leg byes)
    if (extraType !== 'bye' && extraType !== 'leg_bye') {
      setBowlers(prev => prev.map(p => 
        p.id === currentBowler.id ? { 
          ...p, 
          runs: p.runs + runs,
          economy: ((p.runs + runs) / (p.balls / 6)).toFixed(2),
        } : p
      ));
    }
    
    // For wides and no-balls, the ball is not counted
    if (extraType !== 'wide' && extraType !== 'no_ball') {
      // Update ball count
      const newBalls = balls + 1;
      setBalls(newBalls);
      
      // If 6 balls completed, increment over and reset balls
      if (newBalls === 6) {
        setOvers(prev => prev + 1);
        setBalls(0);
        
        // Swap striker and non-striker
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
        
        // Show bowler selection modal
        setShowBowlerModal(true);
      }
    }
    
    // Add to event history
    addToEventHistory(runs, true, extraType, false, null);
    
    setShowExtrasModal(false);
    
    // Check if innings is completed
    checkInningsCompletion();
    
    // Check if match is won
    checkMatchWon();
  };
  
  // Handle wicket
  const handleWicket = (type, newBatsman = null) => {
    // Update wickets
    setWickets(prev => prev + 1);
    
    // Update bowler stats
    setBowlers(prev => prev.map(p => 
      p.id === currentBowler.id ? { 
        ...p, 
        wickets: p.wickets + 1,
        balls: p.balls + 1,
        overs: Math.floor((p.balls + 1) / 6),
      } : p
    ));
    
    // Update batsman stats
    setBatsmen(prev => prev.map(p => 
      p.id === striker.id ? { 
        ...p, 
        balls: p.balls + 1,
        status: type,
      } : p
    ));
    
    // Update ball count
    const newBalls = balls + 1;
    setBalls(newBalls);
    
    // If 6 balls completed, increment over and reset balls
    if (newBalls === 6) {
      setOvers(prev => prev + 1);
      setBalls(0);
      
      // If not all out, show bowler selection modal
      if (wickets + 1 < 10) {
        setShowBowlerModal(true);
      }
    }
    
    // Add to event history
    addToEventHistory(0, false, null, true, type);
    
    // Set new batsman if provided
    if (newBatsman) {
      setStriker({ 
        ...newBatsman,
        battingOrder: Math.max(...batsmen.map(b => b.battingOrder || 0)) + 1
      });
      
      setBatsmen(prev => prev.map(p => 
        p.id === newBatsman.id ? { 
          ...p, 
          battingOrder: Math.max(...prev.map(b => b.battingOrder || 0)) + 1
        } : p
      ));
    } else {
      // Show batsman selection modal for the new batsman
      setShowBatsmanModal(true);
    }
    
    setShowWicketModal(false);
    
    // Check if innings is completed (all out or overs completed)
    if (wickets + 1 >= 10) {
      handleInningsCompletion();
    }
    
    // Check if match is won
    checkMatchWon();
  };
  
  // Add event to history
  const addToEventHistory = (runs, isExtra, extraType, isWicket, wicketType) => {
    const ball = `${overs}.${balls}`;
    let description = '';
    
    if (isWicket) {
      description = `${striker.name} ${wicketType}, B: ${currentBowler.name}`;
    } else if (isExtra) {
      description = `${extraType.toUpperCase()}, ${runs} runs`;
    } else {
      description = `${runs} run${runs !== 1 ? 's' : ''}`;
    }
    
    const newEvent = {
      ball,
      description,
      runs,
      isExtra,
      extraType,
      isWicket,
      wicketType,
      striker: striker.name,
      bowler: currentBowler.name,
      totalScore: runs + (isWicket ? 0 : runs),
      timestamp: new Date().toISOString(),
    };
    
    setEventHistory(prev => [newEvent, ...prev]);
  };
  
  // Check if innings is completed
  const checkInningsCompletion = () => {
    const maxOvers = 20; // Assuming T20 format
    
    if (wickets >= 9 || (overs >= maxOvers && balls === 0)) {
      handleInningsCompletion();
    }
  };
  
  // Handle innings completion
  const handleInningsCompletion = () => {
    if (currentInnings === 1) {
      setShowInningsEndModal(true);
      // Set target for the second innings
      setTarget(runs + 1);
    } else {
      // Match completed
      setMatchCompleted(true);
      
      // Determine winner
      if (runs > target - 1) {
        // Second batting team wins
        setWinner(battingTeam.name);
      } else if (runs < target - 1) {
        // First batting team wins
        setWinner(bowlingTeam.name);
      } else {
        // It's a tie
        setWinner('Tie');
      }
    }
  };
  
  // Start second innings
  const startSecondInnings = () => {
    // Swap teams
    const newBattingTeam = bowlingTeam;
    const newBowlingTeam = battingTeam;
    
    setBattingTeam(newBattingTeam);
    setBowlingTeam(newBowlingTeam);
    
    // Reset innings state
    setCurrentInnings(2);
    setRuns(0);
    setWickets(0);
    setOvers(0);
    setBalls(0);
    setExtras(0);
    
    // Reset striker, non-striker and current bowler
    setStriker(null);
    setNonStriker(null);
    setCurrentBowler(null);
    
    // Initialize batsmen stats for the second innings
    const initialBatsmen = newBattingTeam.players.map(player => ({
      ...player,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      status: 'not_out',
      battingOrder: 0,
    }));
    
    // Initialize bowler stats for the second innings
    const initialBowlers = newBowlingTeam.players.map(player => ({
      ...player,
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      balls: 0,
    }));
    
    setBatsmen(initialBatsmen);
    setBowlers(initialBowlers);
    
    // Show batsman selection modal
    setShowBatsmanModal(true);
    
    setShowInningsEndModal(false);
  };
  
  // Check if match is won
  const checkMatchWon = () => {
    if (currentInnings === 2 && target && runs >= target) {
      // Second batting team has won
      setMatchCompleted(true);
      setWinner(battingTeam.name);
    }
  };
  
  // Generate scorecard PDF
  const generateScorecardPDF = () => {
    try {
      // Create scorecard data
      const scorecard = {
        match: {
          id: match.id,
          teams: {
            team1: match.team1.name,
            team2: match.team2.name
          },
          venue: match.venue,
          date: match.date,
          format: match.format
        },
        innings: {
          1: {
            team: battingTeam.name,
            score: runs,
            wickets: wickets,
            overs: overs + (balls > 0 ? balls/10 : 0),
            extras: extras
          },
          2: currentInnings === 2 ? {
            team: bowlingTeam.name,
            score: target - 1,
            wickets: 10, // Assuming all out for simplicity
            overs: 20 // Assuming full overs for simplicity
          } : null
        },
        battingStats: batsmen.map(b => ({
          name: b.name,
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00',
          status: b.status
        })),
        bowlingStats: bowlers.filter(b => b.balls > 0).map(b => ({
          name: b.name,
          overs: Math.floor(b.balls / 6) + (b.balls % 6) / 10,
          maidens: b.maidens,
          runs: b.runs,
          wickets: b.wickets,
          economy: b.balls > 0 ? ((b.runs / (b.balls / 6)) || 0).toFixed(2) : '0.00'
        })),
        result: matchCompleted ? {
          winningTeam: winner,
          margin: winner === 'Tie' ? 'Match Tied' : 
                  (currentInnings === 2 && runs >= target) ? 
                  `${10 - wickets} wickets` : 
                  `${target - 1 - runs} runs`
        } : 'Match in progress'
      };
      
      // In a real app, you would use a library like jsPDF to generate a PDF
      // For this demo, we'll just download the JSON data
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scorecard, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `scorecard_${match.team1.name}_vs_${match.team2.name}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showToast('Scorecard downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating scorecard:', error);
      showToast('Failed to generate scorecard', 'error');
    }
  };
  
  // Complete match and save data
  const completeMatch = async () => {
    try {
      // Create match summary with final stats
      const matchSummary = {
        id: match.id,
        teams: {
          team1: {
            name: match.team1.name,
            score: currentInnings === 1 ? runs : target - 1,
            wickets: currentInnings === 1 ? wickets : 10, // Assuming all out for simplicity
            overs: currentInnings === 1 ? overs + (balls > 0 ? balls/10 : 0) : 20 // Assuming full overs for simplicity
          },
          team2: {
            name: match.team2.name,
            score: currentInnings === 2 ? runs : 0, // If innings 1, then team2 hasn't batted yet
            wickets: currentInnings === 2 ? wickets : 0,
            overs: currentInnings === 2 ? overs + (balls > 0 ? balls/10 : 0) : 0
          }
        },
        result: {
          winningTeam: winner,
          margin: winner === 'Tie' ? 'Match Tied' : 
                  (currentInnings === 2 && runs >= target) ? 
                  `${10 - wickets} wickets` : 
                  `${target - 1 - runs} runs`,
          player_of_match: '', // Would be selected at the end of the match
          status: 'completed'
        },
        battingStats: batsmen.filter(p => p.battingOrder > 0).map(b => ({
          id: b.id,
          name: b.name,
          team: match.team1.players.some(p => p.id === b.id) ? match.team1.name : match.team2.name,
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00',
          status: b.status
        })),
        bowlingStats: bowlers.filter(b => b.balls > 0).map(b => ({
          id: b.id,
          name: b.name,
          team: match.team1.players.some(p => p.id === b.id) ? match.team1.name : match.team2.name,
          overs: Math.floor(b.balls / 6) + (b.balls % 6) / 10,
          maidens: b.maidens,
          runs: b.runs,
          wickets: b.wickets,
          economy: b.balls > 0 ? ((b.runs / (b.balls / 6)) || 0).toFixed(2) : '0.00'
        })),
        venue: match.venue,
        date: match.date,
        format: match.format,
        lastUpdated: new Date().toISOString(),
        innings: {
          1: {
            score: currentInnings === 1 ? runs : target - 1,
            wickets: currentInnings === 1 ? wickets : 10,
            overs: currentInnings === 1 ? overs + (balls > 0 ? balls/10 : 0) : 20
          },
          2: currentInnings === 2 ? {
            score: runs,
            wickets: wickets,
            overs: overs + (balls > 0 ? balls/10 : 0)
          } : null
        }
      };
      
      // In a real app, you would dispatch an action to save the match data
      // dispatch(updateMatch(match.id, matchSummary));
      
      try {
        await matchService.updateMatch(match.id, {
          status: 'completed',
          result: matchSummary.result,
          scorecard: matchSummary
        });
      } catch (err) {
        console.error('Failed to save match summary', err);
      }
      
      showToast('Match completed and data saved!', 'success');
      
      // Navigate to matches page after a delay
      setTimeout(() => {
        navigate('/matches');
      }, 1500);
    } catch (error) {
      console.error('Error completing match:', error);
      showToast('Failed to complete match', 'error');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If match is not loaded yet
  if (!match) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Match not found</h1>
          <button
            onClick={() => navigate('/matches')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }
  
  // If match is completed
  if (matchCompleted) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="text-center mb-4 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">Match Completed</h1>
            <p className="text-xl text-gray-700">
              {winner === 'Tie' ? 'Match Tied' : `${winner} wins!`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{match.team1.name}</h2>
              <p className="text-2xl font-bold">
                {currentInnings === 2 && battingTeam.name === match.team2.name ? 
                  `${target - 1}` : `${runs}/${wickets}`}
              </p>
              <p className="text-gray-600">
                {currentInnings === 2 && battingTeam.name === match.team2.name ? 
                  `(20.0 overs)` : `(${overs}.${balls} overs)`}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{match.team2.name}</h2>
              <p className="text-2xl font-bold">
                {currentInnings === 2 && battingTeam.name === match.team1.name ? 
                  `${target - 1}` : `${runs}/${wickets}`}
              </p>
              <p className="text-gray-600">
                {currentInnings === 2 && battingTeam.name === match.team1.name ? 
                  `(20.0 overs)` : `(${overs}.${balls} overs)`}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={generateScorecardPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <FaDownload className="mr-2" />
              Download Scorecard
            </button>
            
            <button
              onClick={completeMatch}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              <FaCheck className="mr-2" />
              Complete Match
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if we need to select opening batsmen or bowler
  if (!striker || !nonStriker) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Select Opening Batsmen</h1>
            <p className="text-gray-600">Choose two batsmen to start the innings</p>
          </div>
          
          <div className="mb-4">
            <p className="font-medium text-gray-700 mb-2">Selected:</p>
            <div className="flex space-x-4">
              <div className="flex-1 p-3 bg-gray-50 rounded">
                <p className="font-medium">Striker:</p>
                <p>{striker ? striker.name : 'Not selected'}</p>
              </div>
              
              <div className="flex-1 p-3 bg-gray-50 rounded">
                <p className="font-medium">Non-striker:</p>
                <p>{nonStriker ? nonStriker.name : 'Not selected'}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4 md:mb-6">
            <p className="font-medium text-gray-700 mb-2">Available Batsmen:</p>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {batsmen.filter(p => p.id !== (striker?.id || -1)).map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectOpeningBatsmen(player)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors"
                  disabled={nonStriker && striker}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {player.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-800">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.position}</p>
                    </div>
                  </div>
                  <FaPlus className="text-blue-500" />
                </button>
              ))}
            </div>
          </div>
          
          {striker && nonStriker && !currentBowler && (
            <div className="mt-4 md:mt-8">
              <div className="text-center mb-4 md:mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Select Opening Bowler</h2>
                <p className="text-gray-600">Choose a bowler to start the innings</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {bowlers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectBowler(player)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {player.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position}</p>
                      </div>
                    </div>
                    <FaPlus className="text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4 md:py-6">
      <div className="max-w-6xl mx-auto">
        {/* Match header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{match.team1.name} vs {match.team2.name}</h1>
              <p className="text-gray-600">
                {match.format} • {match.venue} • Innings {currentInnings}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-4">
              <button
                onClick={generateScorecardPDF}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
              >
                <FaDownload className="mr-1" />
                Scorecard
              </button>
              
              <button
                onClick={() => setShowInningsEndModal(true)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
              >
                <FaExchangeAlt className="mr-1" />
                End Innings
              </button>
            </div>
          </div>
        </div>
        
        {/* Score summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Score</h2>
            <div className="flex items-end">
              <p className="text-xl md:text-3xl font-bold text-gray-900">{runs}/{wickets}</p>
              <p className="ml-2 text-gray-600">({overs}.{balls} ov)</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              CRR: {runs > 0 && (overs > 0 || balls > 0) ? (runs / (overs + (balls/6))).toFixed(2) : '0.00'}
              {currentInnings === 2 && target && (
                <span className="ml-2">
                  • Need {target - runs} from {20 - overs - (balls > 0 ? 1 : 0)} ov
                </span>
              )}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Batting: {battingTeam.name}</h2>
            <div className="flex space-x-4">
              <div>
                <p className="text-sm text-gray-600">Striker</p>
                <p className="font-medium">{striker.name} <span className="text-lg font-bold">{
                  batsmen.find(p => p.id === striker.id)?.runs || 0
                }</span> ({batsmen.find(p => p.id === striker.id)?.balls || 0})</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Non-striker</p>
                <p className="font-medium">{nonStriker.name} <span className="text-lg font-bold">{
                  batsmen.find(p => p.id === nonStriker.id)?.runs || 0
                }</span> ({batsmen.find(p => p.id === nonStriker.id)?.balls || 0})</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Bowling: {bowlingTeam.name}</h2>
            <p className="font-medium">{currentBowler.name}</p>
            <p className="text-sm text-gray-600">
              {formatOvers(Math.floor((bowlers.find(p => p.id === currentBowler.id)?.balls || 0) / 6), (bowlers.find(p => p.id === currentBowler.id)?.balls || 0) % 6)} ov • {
                bowlers.find(p => p.id === currentBowler.id)?.runs || 0
              } runs • {
                bowlers.find(p => p.id === currentBowler.id)?.wickets || 0
              } wkts
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          {/* Scoring buttons */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 md:mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Scoring</h2>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => handleDelivery(0)}
                  className="p-3 bg-gray-100 rounded-md hover:bg-gray-200 font-medium"
                >
                  0
                </button>
                <button
                  onClick={() => handleDelivery(1)}
                  className="p-3 bg-blue-100 rounded-md hover:bg-blue-200 font-medium"
                >
                  1
                </button>
                <button
                  onClick={() => handleDelivery(2)}
                  className="p-3 bg-blue-100 rounded-md hover:bg-blue-200 font-medium"
                >
                  2
                </button>
                <button
                  onClick={() => handleDelivery(3)}
                  className="p-3 bg-blue-100 rounded-md hover:bg-blue-200 font-medium"
                >
                  3
                </button>
                <button
                  onClick={() => handleDelivery(4)}
                  className="p-3 bg-green-100 rounded-md hover:bg-green-200 font-medium"
                >
                  4
                </button>
                <button
                  onClick={() => handleDelivery(6)}
                  className="p-3 bg-purple-100 rounded-md hover:bg-purple-200 font-medium"
                >
                  6
                </button>
                <button
                  onClick={() => handleDelivery(0, true)}
                  className="p-3 bg-yellow-100 rounded-md hover:bg-yellow-200 font-medium flex items-center justify-center"
                >
                  <span>Extras</span>
                </button>
                <button
                  onClick={() => handleDelivery(0, false, null, true)}
                  className="p-3 bg-red-100 rounded-md hover:bg-red-200 font-medium"
                >
                  Wicket
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const temp = striker;
                    setStriker(nonStriker);
                    setNonStriker(temp);
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm flex items-center"
                >
                  <FaExchangeAlt className="mr-1" />
                  Swap Batsmen
                </button>
                
                <button
                  onClick={() => setShowBowlerModal(true)}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm flex items-center"
                >
                  <FaExchangeAlt className="mr-1" />
                  Change Bowler
                </button>
              </div>
            </div>
            
            {/* Ball by ball */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Ball by Ball</h2>
                <button
                  onClick={() => setEventHistory([])}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {eventHistory.length === 0 ? (
                  <div className="text-center py-4 md:py-8 text-gray-500">
                    No events yet
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {eventHistory.map((event, index) => (
                      <li key={index} className="py-2">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-12 text-center">
                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {event.ball}
                            </span>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm text-gray-900">
                              {event.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {event.striker} facing {event.bowler}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats tables */}
          <div>
            {/* Batsmen stats */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 md:mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Batting</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batsman</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">R</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">B</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">4s</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">6s</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batsmen
                      .filter(b => b.battingOrder > 0)
                      .sort((a, b) => a.battingOrder - b.battingOrder)
                      .map(batsman => (
                        <tr key={batsman.id}>
                          <td className="px-3 py-2 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium">{batsman.name}</span>
                              {batsman.id === striker.id && (
                                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">*</span>
                              )}
                              {batsman.id === nonStriker.id && (
                                <span className="ml-1 text-xs bg-gray-100 text-gray-800 px-1 rounded">*</span>
                              )}
                            </div>
                            {batsman.status !== 'not_out' && (
                              <span className="text-xs text-gray-500">{batsman.status}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-center font-medium">{batsman.runs}</td>
                          <td className="px-3 py-2 text-sm text-center">{batsman.balls}</td>
                          <td className="px-3 py-2 text-sm text-center">{batsman.fours}</td>
                          <td className="px-3 py-2 text-sm text-center">{batsman.sixes}</td>
                          <td className="px-3 py-2 text-sm text-center">
                            {batsman.balls > 0 ? ((batsman.runs / batsman.balls) * 100).toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Bowlers stats */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Bowling</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bowler</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">O</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">R</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bowlers
                      .filter(b => b.balls > 0)
                      .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
                      .map(bowler => (
                        <tr key={bowler.id}>
                          <td className="px-3 py-2 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium">{bowler.name}</span>
                              {bowler.id === currentBowler.id && (
                                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">bowling</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-center">
                            {Math.floor(bowler.balls / 6)}.{bowler.balls % 6}
                          </td>
                          <td className="px-3 py-2 text-sm text-center">{bowler.maidens}</td>
                          <td className="px-3 py-2 text-sm text-center">{bowler.runs}</td>
                          <td className="px-3 py-2 text-sm text-center font-medium">{bowler.wickets}</td>
                          <td className="px-3 py-2 text-sm text-center">
                            {bowler.balls > 0 ? ((bowler.runs / (bowler.balls / 6)) || 0).toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Batsman Selection Modal */}
      {showBatsmanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Select New Batsman
                </h3>
                <button 
                  onClick={() => setShowBatsmanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              {batsmen.filter(p => 
                p.id !== striker?.id && 
                p.id !== nonStriker?.id && 
                p.status === 'not_out' &&
                p.battingOrder === 0
              ).length === 0 ? (
                <div className="text-center py-4 md:py-6 md:py-10">
                  <p className="text-gray-500">No available batsmen</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {batsmen.filter(p => 
                    p.id !== striker?.id && 
                    p.id !== nonStriker?.id && 
                    p.status === 'not_out' &&
                    p.battingOrder === 0
                  ).map(player => (
                    <li key={player.id} className="py-3">
                      <button
                        onClick={() => {
                          // Set as new batsman
                          setStriker({
                            ...player,
                            battingOrder: Math.max(...batsmen.map(b => b.battingOrder || 0)) + 1
                          });
                          
                          // Update batsmen array
                          setBatsmen(prev => prev.map(p => 
                            p.id === player.id ? { 
                              ...p, 
                              battingOrder: Math.max(...prev.map(b => b.battingOrder || 0)) + 1
                            } : p
                          ));
                          
                          setShowBatsmanModal(false);
                        }}
                        className="w-full flex items-center text-left p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {player.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{player.name}</p>
                          <p className="text-xs text-gray-500">{player.position}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Bowler Selection Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Select Bowler
                </h3>
                <button 
                  onClick={() => setShowBowlerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <ul className="divide-y divide-gray-200">
                {bowlers.map(player => (
                  <li key={player.id} className="py-3">
                    <button
                      onClick={() => handleSelectBowler(player)}
                      className="w-full flex items-center justify-between text-left p-2 hover:bg-gray-50 rounded"
                      disabled={player.id === currentBowler?.id}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {player.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{player.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>
                              {Math.floor(player.balls / 6)}.{player.balls % 6} ov • {player.runs} runs • {player.wickets} wkts
                            </span>
                          </div>
                        </div>
                      </div>
                      {player.id !== currentBowler?.id && (
                        <FaCheck className="text-green-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Wicket Type
                </h3>
                <button 
                  onClick={() => setShowWicketModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleWicket('bowled')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium">Bowled</span>
                  <FaBaseballBall className="text-red-500" />
                </button>
                
                <button
                  onClick={() => handleWicket('caught')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium">Caught</span>
                  <GiCricketBat className="text-red-500" />
                </button>
                
                <button
                  onClick={() => handleWicket('lbw')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium">LBW</span>
                  <FaBaseballBall className="text-red-500" />
                </button>
                
                <button
                  onClick={() => handleWicket('run out')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium">Run Out</span>
                  <FaRunning className="text-red-500" />
                </button>
                
                <button
                  onClick={() => handleWicket('stumped')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium">Stumped</span>
                  <GiCricketBat className="text-red-500" />
                </button>
                
                <button
                  onClick={() => handleWicket('hit wicket')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium">Hit Wicket</span>
                  <GiCricketBat className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Extras Modal */}
      {showExtrasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Extras
                </h3>
                <button 
                  onClick={() => setShowExtrasModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleExtras('wide', 1)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium">Wide</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">+1</span>
                </button>
                
                <button
                  onClick={() => handleExtras('no_ball', 1)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium">No Ball</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">+1</span>
                </button>
                
                <button
                  onClick={() => handleExtras('bye', 1)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium">Bye (1 run)</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">+1</span>
                </button>
                
                <button
                  onClick={() => handleExtras('bye', 4)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium">Bye (4 runs)</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">+4</span>
                </button>
                
                <button
                  onClick={() => handleExtras('leg_bye', 1)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium">Leg Bye (1 run)</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">+1</span>
                </button>
                
                <button
                  onClick={() => handleExtras('leg_bye', 4)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium">Leg Bye (4 runs)</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">+4</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Innings End Modal */}
      {showInningsEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  End Innings
                </h3>
                <button 
                  onClick={() => setShowInningsEndModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {currentInnings === 1 ? (
                <>
                  <p className="mb-4">
                    First innings completed. {battingTeam.name} scored {runs}/{wickets} in {overs}.{balls} overs.
                  </p>
                  <p className="mb-4">
                    {bowlingTeam.name} needs {runs + 1} runs to win.
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={startSecondInnings}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <FaPlay className="mr-2" />
                      Start Second Innings
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-4">
                    Are you sure you want to end the match?
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowInningsEndModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMatchCompleted(true);
                        
                        // Determine winner
                        if (runs > target - 1) {
                          // Second batting team wins
                          setWinner(battingTeam.name);
                        } else if (runs < target - 1) {
                          // First batting team wins
                          setWinner(bowlingTeam.name);
                        } else {
                          // It's a tie
                          setWinner('Tie');
                        }
                        
                        setShowInningsEndModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      End Match
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CricketScoring;

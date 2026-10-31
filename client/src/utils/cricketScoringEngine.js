/**
 * Pure functions for Cricket Scoring calculations, rules, and state management.
 * Identical pure utility module for client usage.
 */

export const createInitialCricketState = (homeTeamId, awayTeamId, maxOvers = 20, maxWickets = 10) => {
  return {
    innings: [
      { team: homeTeamId || null, runs: 0, wickets: 0, overs: 0, balls: 0 },
      { team: awayTeamId || null, runs: 0, wickets: 0, overs: 0, balls: 0 }
    ],
    currentInningIndex: 0,
    maxOvers: Number(maxOvers) || 20,
    maxWickets: Number(maxWickets) || 10,
    target: null,
    recentBalls: [],
    ballHistory: [],
    isCompleted: false,
    winner: null,
    resultText: null
  };
};

export const calculateTarget = (innings1Runs) => {
  return Math.max(1, (Number(innings1Runs) || 0) + 1);
};

export const calculateMetrics = (state) => {
  if (!state || !state.innings) {
    return {
      currentInningIndex: 0,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      ballsBowled: 0,
      ballsRemaining: 120,
      totalOversDecimal: 0,
      crr: 0,
      target: null,
      runsRequired: null,
      rrr: null
    };
  }

  const { innings, currentInningIndex = 0, maxOvers = 20, target } = state;
  const currentInning = innings[currentInningIndex] || { runs: 0, wickets: 0, overs: 0, balls: 0 };

  const ballsBowled = currentInning.overs * 6 + currentInning.balls;
  const totalOversDecimal = currentInning.overs + currentInning.balls / 6;
  const crr = totalOversDecimal > 0 ? Number((currentInning.runs / totalOversDecimal).toFixed(2)) : 0;

  const totalBallsInInnings = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalBallsInInnings - ballsBowled);

  let runsRequired = null;
  let rrr = null;

  if (currentInningIndex === 1 && target !== null && target !== undefined) {
    runsRequired = Math.max(0, target - currentInning.runs);
    if (runsRequired === 0) {
      rrr = 0;
    } else if (ballsRemaining > 0) {
      rrr = Number(((runsRequired / ballsRemaining) * 6).toFixed(2));
    } else {
      rrr = Infinity;
    }
  }

  return {
    currentInningIndex,
    runs: currentInning.runs,
    wickets: currentInning.wickets,
    overs: currentInning.overs,
    balls: currentInning.balls,
    ballsBowled,
    ballsRemaining,
    totalOversDecimal,
    crr,
    target: target || null,
    runsRequired,
    rrr
  };
};

export const determineMatchResult = (state, homeTeamName = 'Home Team', awayTeamName = 'Away Team') => {
  const { innings, maxWickets = 10 } = state;
  const inn1 = innings[0] || { runs: 0, wickets: 0 };
  const inn2 = innings[1] || { runs: 0, wickets: 0 };

  const inn1Runs = inn1.runs || 0;
  const inn2Runs = inn2.runs || 0;
  const inn2Wickets = inn2.wickets || 0;

  const team1Name = homeTeamName;
  const team2Name = awayTeamName;
  const team1Id = inn1.team;
  const team2Id = inn2.team;

  if (inn2Runs > inn1Runs) {
    const wicketsRemaining = Math.max(1, maxWickets - inn2Wickets);
    return {
      winner: team2Id,
      resultText: `${team2Name} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}`,
      isTie: false
    };
  } else if (inn2Runs < inn1Runs) {
    const runMargin = inn1Runs - inn2Runs;
    return {
      winner: team1Id,
      resultText: `${team1Name} won by ${runMargin} run${runMargin === 1 ? '' : 's'}`,
      isTie: false
    };
  } else {
    return {
      winner: null,
      resultText: 'Match tied',
      isTie: true
    };
  }
};

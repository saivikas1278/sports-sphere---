/**
 * Pure functions for Cricket Scoring calculations, rules, and state management.
 * Zero external side-effects; fully testable and deterministic.
 */

/**
 * Creates an initial clean cricket data structure.
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

/**
 * Calculate the target score for the chasing team.
 * Target = 1st innings total + 1 run.
 */
export const calculateTarget = (innings1Runs) => {
  return Math.max(1, (Number(innings1Runs) || 0) + 1);
};

/**
 * Calculates live match metrics: CRR, RRR, runs required, balls remaining.
 */
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

/**
 * Computes official result description and winner for completed match.
 */
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

/**
 * Applies a delivery action to the cricket state.
 */
export const applyDelivery = (state, delivery = {}, teamNames = { home: 'Home Team', away: 'Away Team' }) => {
  if (!state || !state.innings) {
    return state;
  }

  // Handle undo action
  if (delivery.action === 'undo') {
    return undoDelivery(state);
  }

  // Handle explicit switch to innings 2
  if (delivery.action === 'switch_innings') {
    if (state.currentInningIndex === 0) {
      const nextState = JSON.parse(JSON.stringify(state));
      nextState.currentInningIndex = 1;
      nextState.target = calculateTarget(nextState.innings[0].runs);
      nextState.recentBalls = [];
      return nextState;
    }
    return state;
  }

  // If match already completed, ignore further scoring
  if (state.isCompleted) {
    return state;
  }

  const nextState = JSON.parse(JSON.stringify(state));
  const idx = nextState.currentInningIndex;
  const currentInning = nextState.innings[idx];

  const runs = Number(delivery.runs || 0);
  const isWicket = Boolean(delivery.isWicket);
  const isWide = Boolean(delivery.isWide);
  const isNoBall = Boolean(delivery.isNoBall);
  const isBye = Boolean(delivery.isBye);
  const isLegBye = Boolean(delivery.isLegBye);

  let runsToAdd = runs;
  let isLegalBall = true;
  let ballTag = runs.toString();

  // Extras logic:
  // - Wide: +1 penalty run (plus any additional runs). Illegal ball (no ball count).
  // - No-ball: +1 penalty run (plus any bat/extras runs). Illegal ball (no ball count).
  // - Bye: runs added to total. Legal ball (counts toward over).
  // - Leg-bye: runs added to total. Legal ball (counts toward over).
  if (isWide) {
    isLegalBall = false;
    runsToAdd = runs + 1;
    ballTag = runs > 0 ? `${runs + 1}Wd` : 'Wd';
  } else if (isNoBall) {
    isLegalBall = false;
    runsToAdd = runs + 1;
    ballTag = runs > 0 ? `${runs + 1}Nb` : 'Nb';
  } else if (isBye) {
    isLegalBall = true;
    runsToAdd = runs > 0 ? runs : 1;
    ballTag = runs > 1 ? `${runs}B` : 'B';
  } else if (isLegBye) {
    isLegalBall = true;
    runsToAdd = runs > 0 ? runs : 1;
    ballTag = runs > 1 ? `${runs}Lb` : 'Lb';
  } else if (isWicket) {
    isLegalBall = true;
    ballTag = 'W';
  }

  currentInning.runs += runsToAdd;

  if (isWicket) {
    currentInning.wickets += 1;
  }

  let overIncremented = false;
  if (isLegalBall) {
    currentInning.balls += 1;
    if (currentInning.balls === 6) {
      currentInning.overs += 1;
      currentInning.balls = 0;
      overIncremented = true;
    }
  }

  nextState.recentBalls = nextState.recentBalls || [];
  nextState.recentBalls.push(ballTag);
  if (nextState.recentBalls.length > 8) {
    nextState.recentBalls.shift();
  }

  let autoSwitchedInnings = false;
  let autoCompletedMatch = false;

  const ballRecord = {
    inningIndex: idx,
    runsScored: runsToAdd,
    baseRuns: runs,
    isWicket,
    isWide,
    isNoBall,
    isBye,
    isLegBye,
    isLegalBall,
    overIncremented,
    ballTag,
    prevTarget: nextState.target,
    prevCompleted: nextState.isCompleted,
    prevResultText: nextState.resultText,
    prevWinner: nextState.winner
  };

  // Auto-end checks
  if (idx === 0) {
    // Innings 1 check: all out or overs limit reached
    const allOut = currentInning.wickets >= nextState.maxWickets;
    const oversFinished = currentInning.overs >= nextState.maxOvers;

    if (allOut || oversFinished) {
      nextState.currentInningIndex = 1;
      nextState.target = calculateTarget(currentInning.runs);
      nextState.recentBalls = [];
      autoSwitchedInnings = true;
    }
  } else {
    // Innings 2 check: target reached, all out, or overs finished
    const target = nextState.target !== null ? nextState.target : calculateTarget(nextState.innings[0].runs);
    nextState.target = target;

    const targetReached = currentInning.runs >= target;
    const allOut = currentInning.wickets >= nextState.maxWickets;
    const oversFinished = currentInning.overs >= nextState.maxOvers;

    if (targetReached || allOut || oversFinished) {
      nextState.isCompleted = true;
      const result = determineMatchResult(nextState, teamNames.home || 'Home Team', teamNames.away || 'Away Team');
      nextState.winner = result.winner;
      nextState.resultText = result.resultText;
      autoCompletedMatch = true;
    }
  }

  ballRecord.autoSwitchedInnings = autoSwitchedInnings;
  ballRecord.autoCompletedMatch = autoCompletedMatch;

  nextState.ballHistory = nextState.ballHistory || [];
  nextState.ballHistory.push(ballRecord);

  return nextState;
};

/**
 * Reverses the last delivery cleanly across both innings.
 */
export const undoDelivery = (state) => {
  if (!state || !state.ballHistory || state.ballHistory.length === 0) {
    return state;
  }

  const nextState = JSON.parse(JSON.stringify(state));
  const lastBall = nextState.ballHistory.pop();

  const inning = nextState.innings[lastBall.inningIndex];

  // Revert runs
  inning.runs = Math.max(0, inning.runs - lastBall.runsScored);

  // Revert wickets
  if (lastBall.isWicket) {
    inning.wickets = Math.max(0, inning.wickets - 1);
  }

  // Revert legal ball / over
  if (lastBall.isLegalBall) {
    if (lastBall.overIncremented) {
      inning.overs = Math.max(0, inning.overs - 1);
      inning.balls = 5;
    } else {
      inning.balls = Math.max(0, inning.balls - 1);
    }
  }

  // Pop recent ball tag
  if (nextState.recentBalls && nextState.recentBalls.length > 0) {
    nextState.recentBalls.pop();
  }

  // Revert inning transition if this ball auto-switched innings
  if (lastBall.autoSwitchedInnings) {
    nextState.currentInningIndex = 0;
    nextState.target = lastBall.prevTarget;
  }

  // Revert match completion if this ball auto-completed match
  if (lastBall.autoCompletedMatch) {
    nextState.isCompleted = false;
    nextState.resultText = lastBall.prevResultText || null;
    nextState.winner = lastBall.prevWinner || null;
  }

  return nextState;
};

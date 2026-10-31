/**
 * Generic Points-Based Scoring Engine
 * Config-driven rules for set-based sports (Badminton, Volleyball, Tennis, etc.)
 * Pure, deterministic functions with zero side-effects.
 */

export const SPORT_CONFIGS = {
  badminton: {
    sport: 'badminton',
    displayName: 'Badminton',
    bestOf: 3,
    setsToWin: 2,
    targetPoints: 21,
    winBy: 2,
    cap: 30,
    finalSetTargetPoints: 21,
    finalSetWinBy: 2,
    finalSetCap: 30
  },
  volleyball: {
    sport: 'volleyball',
    displayName: 'Volleyball',
    bestOf: 5,
    setsToWin: 3,
    targetPoints: 25,
    winBy: 2,
    cap: null,
    finalSetTargetPoints: 15,
    finalSetWinBy: 2,
    finalSetCap: null
  },
  table_tennis: {
    sport: 'table-tennis',
    displayName: 'Table Tennis',
    bestOf: 5,
    setsToWin: 3,
    targetPoints: 11,
    winBy: 2,
    cap: null
  },
  tennis: {
    sport: 'tennis',
    displayName: 'Tennis (Fast Sets)',
    bestOf: 3,
    setsToWin: 2,
    targetPoints: 6,
    winBy: 2,
    cap: 7
  }
};

/**
 * Resolves configuration from a preset key or custom config object.
 */
export const resolveConfig = (sportOrConfig) => {
  if (sportOrConfig && typeof sportOrConfig === 'object' && sportOrConfig.targetPoints) {
    const bestOf = Number(sportOrConfig.bestOf) || 3;
    const setsToWin = Number(sportOrConfig.setsToWin) || Math.ceil(bestOf / 2);
    return {
      sport: sportOrConfig.sport || 'custom',
      displayName: sportOrConfig.displayName || 'Points Sport',
      bestOf,
      setsToWin,
      targetPoints: Number(sportOrConfig.targetPoints) || 21,
      winBy: sportOrConfig.winBy !== undefined ? Number(sportOrConfig.winBy) : 2,
      cap: sportOrConfig.cap !== undefined ? (sportOrConfig.cap === null ? null : Number(sportOrConfig.cap)) : null,
      finalSetTargetPoints: sportOrConfig.finalSetTargetPoints ? Number(sportOrConfig.finalSetTargetPoints) : null,
      finalSetWinBy: sportOrConfig.finalSetWinBy !== undefined ? (sportOrConfig.finalSetWinBy === null ? null : Number(sportOrConfig.finalSetWinBy)) : null,
      finalSetCap: sportOrConfig.finalSetCap !== undefined ? (sportOrConfig.finalSetCap === null ? null : Number(sportOrConfig.finalSetCap)) : null
    };
  }

  const key = (sportOrConfig || 'badminton').toLowerCase().replace(/[\s-]/g, '_');
  const matched = SPORT_CONFIGS[key] || SPORT_CONFIGS.badminton;
  return { ...matched };
};

/**
 * Returns specific rules for a given set number (handles deciding set differences, like Volleyball set 5).
 */
export const getSetRules = (config, setNumber = 1) => {
  const isDeciding = setNumber === config.bestOf;

  const targetPoints = isDeciding && config.finalSetTargetPoints
    ? config.finalSetTargetPoints
    : config.targetPoints;

  const winBy = isDeciding && config.finalSetWinBy !== null && config.finalSetWinBy !== undefined
    ? config.finalSetWinBy
    : (config.winBy ?? 2);

  const cap = isDeciding && config.finalSetCap !== undefined
    ? config.finalSetCap
    : (config.cap ?? null);

  return {
    targetPoints,
    winBy,
    cap,
    isDeciding
  };
};

/**
 * Instantiates a clean, initial points-based scoring state.
 */
export const createInitialPointsState = (sport = 'badminton', homeTeamId = null, awayTeamId = null, customConfig = null) => {
  const config = resolveConfig(customConfig || sport);

  return {
    sport: config.sport,
    config,
    sets: [
      { setNumber: 1, homeScore: 0, awayScore: 0, isCompleted: false, winner: null }
    ],
    currentSet: 1,
    homeSetsWon: 0,
    awaySetsWon: 0,
    homeTeam: homeTeamId,
    awayTeam: awayTeamId,
    isCompleted: false,
    winner: null,
    resultText: null,
    pointHistory: []
  };
};

/**
 * Determines if a set has been won according to sport rules (including deuce and cap).
 * Returns 'home' | 'away' | null.
 */
export const checkSetWinner = (homeScore, awayScore, setNumber, config) => {
  const rules = getSetRules(config, setNumber);

  // 1. Cap condition (e.g. Badminton cap at 30: 30-29 wins)
  if (rules.cap !== null && rules.cap !== undefined) {
    if (homeScore >= rules.cap && homeScore > awayScore) return 'home';
    if (awayScore >= rules.cap && awayScore > homeScore) return 'away';
  }

  // 2. Standard win by condition (e.g. 21-19, or 25-23, or in deuce 24-22)
  if (homeScore >= rules.targetPoints && (homeScore - awayScore) >= rules.winBy) {
    return 'home';
  }
  if (awayScore >= rules.targetPoints && (awayScore - homeScore) >= rules.winBy) {
    return 'away';
  }

  return null;
};

/**
 * Returns dynamic status indicator for the active set (Deuce, Set Point, Match Point, In Progress).
 */
export const getActiveSetStatus = (state) => {
  if (!state || !state.sets || state.isCompleted) {
    return { isDeuce: false, isSetPoint: false, isMatchPoint: false, label: state?.resultText || 'Match Completed' };
  }

  const config = state.config || resolveConfig(state.sport);
  const activeSet = state.sets[state.currentSet - 1] || { homeScore: 0, awayScore: 0 };
  const rules = getSetRules(config, state.currentSet);
  const { homeScore, awayScore } = activeSet;

  // Deuce Check: Both teams at or above targetPoints - 1 and scores tied
  const isDeuce = homeScore >= rules.targetPoints - 1 && awayScore >= rules.targetPoints - 1 && homeScore === awayScore;

  // Check if either team is 1 point away from winning this set
  let setPointTeam = null;
  if (rules.cap && (homeScore === rules.cap - 1 || awayScore === rules.cap - 1)) {
    setPointTeam = homeScore === rules.cap - 1 ? 'home' : 'away';
  } else if (homeScore >= rules.targetPoints - 1 && homeScore - awayScore === rules.winBy - 1) {
    setPointTeam = 'home';
  } else if (awayScore >= rules.targetPoints - 1 && awayScore - homeScore === rules.winBy - 1) {
    setPointTeam = 'away';
  }

  const isSetPoint = Boolean(setPointTeam);
  const isMatchPoint = isSetPoint && (
    (setPointTeam === 'home' && state.homeSetsWon === config.setsToWin - 1) ||
    (setPointTeam === 'away' && state.awaySetsWon === config.setsToWin - 1)
  );

  let label = `Set ${state.currentSet} In Progress`;
  if (isDeuce) {
    label = rules.cap && homeScore >= rules.cap - 1 ? `CAP POINT (${rules.cap})` : 'DEUCE (Win by 2)';
  } else if (isMatchPoint) {
    label = 'MATCH POINT';
  } else if (isSetPoint) {
    label = 'SET POINT';
  }

  return {
    isDeuce,
    isSetPoint,
    isMatchPoint,
    setPointTeam,
    label
  };
};

/**
 * Applies a point or action to the state and determines transitions.
 */
export const applyPoint = (state, action = {}, teamNames = { home: 'Home Team', away: 'Away Team' }) => {
  if (!state) return state;

  if (action.action === 'undo') {
    return undoPoint(state);
  }

  if (state.isCompleted) {
    return state;
  }

  const team = action.team; // 'home' | 'away'
  if (team !== 'home' && team !== 'away') {
    return state;
  }

  const nextState = JSON.parse(JSON.stringify(state));
  const config = nextState.config || resolveConfig(nextState.sport);
  nextState.config = config;

  const setIndex = nextState.currentSet - 1;
  const currentSetObj = nextState.sets[setIndex];

  // Increment point
  if (team === 'home') {
    currentSetObj.homeScore += 1;
  } else {
    currentSetObj.awayScore += 1;
  }

  let setCompleted = false;
  let nextSetCreated = false;
  let matchCompleted = false;

  const setWinner = checkSetWinner(currentSetObj.homeScore, currentSetObj.awayScore, nextState.currentSet, config);

  if (setWinner) {
    currentSetObj.isCompleted = true;
    currentSetObj.winner = setWinner;
    setCompleted = true;

    if (setWinner === 'home') {
      nextState.homeSetsWon += 1;
    } else {
      nextState.awaySetsWon += 1;
    }

    // Check Match Completion
    if (nextState.homeSetsWon >= config.setsToWin) {
      nextState.isCompleted = true;
      nextState.winner = nextState.homeTeam || 'home';
      matchCompleted = true;
    } else if (nextState.awaySetsWon >= config.setsToWin) {
      nextState.isCompleted = true;
      nextState.winner = nextState.awayTeam || 'away';
      matchCompleted = true;
    } else if (nextState.currentSet < config.bestOf) {
      // Create next set
      nextState.currentSet += 1;
      nextState.sets.push({
        setNumber: nextState.currentSet,
        homeScore: 0,
        awayScore: 0,
        isCompleted: false,
        winner: null
      });
      nextSetCreated = true;
    }
  }

  if (nextState.isCompleted) {
    const winnerName = nextState.winner === (nextState.homeTeam || 'home') ? teamNames.home : teamNames.away;
    const homeSets = nextState.homeSetsWon;
    const awaySets = nextState.awaySetsWon;
    const setsScore = nextState.winner === (nextState.homeTeam || 'home')
      ? `${homeSets}-${awaySets}`
      : `${awaySets}-${homeSets}`;

    const setDetails = nextState.sets
      .map(s => `${s.homeScore}-${s.awayScore}`)
      .join(', ');

    nextState.resultText = `${winnerName} won ${setsScore} (${setDetails})`;
  }

  // Push to pointHistory for undo
  nextState.pointHistory = nextState.pointHistory || [];
  nextState.pointHistory.push({
    setIndex,
    team,
    setCompleted,
    nextSetCreated,
    matchCompleted,
    prevWinner: state.winner,
    prevResultText: state.resultText
  });

  return nextState;
};

/**
 * Reverses the last point cleanly across set and match boundaries.
 */
export const undoPoint = (state) => {
  if (!state || !state.pointHistory || state.pointHistory.length === 0) {
    return state;
  }

  const nextState = JSON.parse(JSON.stringify(state));
  const lastPoint = nextState.pointHistory.pop();

  // If a new set was created on the last point, remove it and step back
  if (lastPoint.nextSetCreated) {
    nextState.sets.pop();
    nextState.currentSet -= 1;
  }

  // If match was completed, restore in-progress state
  if (lastPoint.matchCompleted) {
    nextState.isCompleted = false;
    nextState.winner = lastPoint.prevWinner || null;
    nextState.resultText = lastPoint.prevResultText || null;
  }

  // If set was completed, decrement setsWon and re-open set
  if (lastPoint.setCompleted) {
    if (lastPoint.team === 'home') {
      nextState.homeSetsWon = Math.max(0, nextState.homeSetsWon - 1);
    } else {
      nextState.awaySetsWon = Math.max(0, nextState.awaySetsWon - 1);
    }
    nextState.sets[lastPoint.setIndex].isCompleted = false;
    nextState.sets[lastPoint.setIndex].winner = null;
  }

  // Decrement the point
  const targetSet = nextState.sets[lastPoint.setIndex];
  if (lastPoint.team === 'home') {
    targetSet.homeScore = Math.max(0, targetSet.homeScore - 1);
  } else {
    targetSet.awayScore = Math.max(0, targetSet.awayScore - 1);
  }

  return nextState;
};

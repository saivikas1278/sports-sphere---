import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createInitialCricketState,
  calculateTarget,
  calculateMetrics,
  determineMatchResult,
  applyDelivery,
  undoDelivery
} from '../src/utils/cricketScoringEngine.js';

describe('Cricket Scoring Engine (Pure Function Module)', () => {
  const homeTeamId = 'team_alpha_1';
  const awayTeamId = 'team_beta_2';
  const teamNames = { home: 'Thunderbolts', away: 'Warriors' };

  describe('1. Initial State & Target Calculation', () => {
    it('should create an initial cricket state with 2 innings and clean counters', () => {
      const state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      expect(state.currentInningIndex).toBe(0);
      expect(state.innings[0].team).toBe(homeTeamId);
      expect(state.innings[1].team).toBe(awayTeamId);
      expect(state.innings[0].runs).toBe(0);
      expect(state.innings[0].wickets).toBe(0);
      expect(state.innings[0].overs).toBe(0);
      expect(state.innings[0].balls).toBe(0);
      expect(state.target).toBeNull();
      expect(state.isCompleted).toBe(false);
      expect(state.recentBalls).toEqual([]);
    });

    it('should correctly calculate target as innings 1 runs + 1', () => {
      expect(calculateTarget(0)).toBe(1);
      expect(calculateTarget(149)).toBe(150);
      expect(calculateTarget(225)).toBe(226);
    });
  });

  describe('2. Standard Runs & Over Progression', () => {
    let state;
    beforeEach(() => {
      state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
    });

    it('should add runs and legal balls correctly', () => {
      state = applyDelivery(state, { action: 'score', runs: 4 });
      expect(state.innings[0].runs).toBe(4);
      expect(state.innings[0].balls).toBe(1);
      expect(state.innings[0].overs).toBe(0);
      expect(state.recentBalls).toEqual(['4']);

      state = applyDelivery(state, { action: 'score', runs: 6 });
      expect(state.innings[0].runs).toBe(10);
      expect(state.innings[0].balls).toBe(2);
      expect(state.recentBalls).toEqual(['4', '6']);
    });

    it('should roll over balls to next over after 6 legal deliveries', () => {
      for (let i = 0; i < 5; i++) {
        state = applyDelivery(state, { action: 'score', runs: 1 });
      }
      expect(state.innings[0].overs).toBe(0);
      expect(state.innings[0].balls).toBe(5);

      // 6th legal delivery completes the over
      state = applyDelivery(state, { action: 'score', runs: 2 });
      expect(state.innings[0].overs).toBe(1);
      expect(state.innings[0].balls).toBe(0);
      expect(state.innings[0].runs).toBe(7);
    });
  });

  describe('3. Extras Handling (Wides, No-Balls, Byes, Leg-Byes)', () => {
    let state;
    beforeEach(() => {
      state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
    });

    it('Wide should add 1 run and NOT count as a legal ball', () => {
      state = applyDelivery(state, { action: 'extra', isWide: true });
      expect(state.innings[0].runs).toBe(1);
      expect(state.innings[0].balls).toBe(0); // Ball did NOT increment
      expect(state.innings[0].overs).toBe(0);
      expect(state.recentBalls).toEqual(['Wd']);
    });

    it('Wide with extra runs scored should add 1 + runs and NOT count as a legal ball', () => {
      state = applyDelivery(state, { action: 'extra', isWide: true, runs: 2 });
      expect(state.innings[0].runs).toBe(3); // 1 penalty + 2 runs
      expect(state.innings[0].balls).toBe(0);
      expect(state.recentBalls).toEqual(['3Wd']);
    });

    it('No-Ball should add 1 run and NOT count as a legal ball', () => {
      state = applyDelivery(state, { action: 'extra', isNoBall: true });
      expect(state.innings[0].runs).toBe(1);
      expect(state.innings[0].balls).toBe(0); // Ball did NOT increment
      expect(state.recentBalls).toEqual(['Nb']);
    });

    it('No-Ball with bat runs should add 1 + bat runs and NOT count as a legal ball', () => {
      state = applyDelivery(state, { action: 'extra', isNoBall: true, runs: 4 });
      expect(state.innings[0].runs).toBe(5); // 1 penalty + 4 bat runs
      expect(state.innings[0].balls).toBe(0);
      expect(state.recentBalls).toEqual(['5Nb']);
    });

    it('Byes should add runs and count as a legal ball', () => {
      state = applyDelivery(state, { action: 'extra', isBye: true, runs: 2 });
      expect(state.innings[0].runs).toBe(2);
      expect(state.innings[0].balls).toBe(1); // Legal ball
      expect(state.recentBalls).toEqual(['2B']);
    });

    it('Leg-Byes should add runs and count as a legal ball', () => {
      state = applyDelivery(state, { action: 'extra', isLegBye: true, runs: 1 });
      expect(state.innings[0].runs).toBe(1);
      expect(state.innings[0].balls).toBe(1); // Legal ball
      expect(state.recentBalls).toEqual(['Lb']);
    });
  });

  describe('4. Live Metrics Calculations (CRR, RRR, Runs Required, Balls Remaining)', () => {
    it('should compute Current Run Rate (CRR) accurately for Innings 1', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      // Score 18 runs in 2 overs (12 legal deliveries)
      for (let i = 0; i < 12; i++) {
        state = applyDelivery(state, { action: 'score', runs: i === 0 ? 7 : 1 });
      }
      const metrics = calculateMetrics(state);
      expect(metrics.runs).toBe(18);
      expect(metrics.overs).toBe(2);
      expect(metrics.balls).toBe(0);
      expect(metrics.crr).toBe(9.0); // 18 / 2 = 9.00
    });

    it('should compute Runs Required, Balls Remaining, and RRR accurately for Innings 2', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      state.currentInningIndex = 1;
      state.target = 160; // 159 runs in Innings 1
      state.innings[1].runs = 40;
      state.innings[1].overs = 5;
      state.innings[1].balls = 0;

      const metrics = calculateMetrics(state);
      expect(metrics.target).toBe(160);
      expect(metrics.runsRequired).toBe(120); // 160 - 40
      expect(metrics.ballsBowled).toBe(30); // 5 overs * 6
      expect(metrics.ballsRemaining).toBe(90); // 120 - 30
      expect(metrics.crr).toBe(8.0); // 40 / 5 = 8.00
      expect(metrics.rrr).toBe(8.0); // (120 / 90) * 6 = 8.00
    });
  });

  describe('5. Auto-Ending Innings 1', () => {
    it('should auto-switch to Innings 2 when max overs is reached in Innings 1', () => {
      // 1-over match
      let state = createInitialCricketState(homeTeamId, awayTeamId, 1, 10);
      for (let i = 0; i < 6; i++) {
        state = applyDelivery(state, { action: 'score', runs: 2 });
      }
      // After 6 deliveries in 1-over match:
      expect(state.innings[0].overs).toBe(1);
      expect(state.innings[0].runs).toBe(12);
      expect(state.currentInningIndex).toBe(1); // Auto-switched to Innings 2!
      expect(state.target).toBe(13); // 12 + 1
      expect(state.isCompleted).toBe(false);
    });

    it('should auto-switch to Innings 2 when all out in Innings 1', () => {
      // 2-wicket test match
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 2);
      state = applyDelivery(state, { action: 'score', runs: 4 });
      state = applyDelivery(state, { action: 'wicket', isWicket: true });
      expect(state.currentInningIndex).toBe(0);

      // 2nd wicket -> All out!
      state = applyDelivery(state, { action: 'wicket', isWicket: true });
      expect(state.innings[0].wickets).toBe(2);
      expect(state.currentInningIndex).toBe(1); // Auto-switched to Innings 2!
      expect(state.target).toBe(5); // 4 + 1
    });
  });

  describe('6. Auto-Ending Innings 2 & Match Results', () => {
    it('should auto-end match when chasing team reaches target ("Team B won by X wickets")', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      state.innings[0].runs = 50;
      state.currentInningIndex = 1;
      state.target = 51;

      state = applyDelivery(state, { action: 'score', runs: 48 }, teamNames);
      expect(state.isCompleted).toBe(false);

      state = applyDelivery(state, { action: 'wicket', isWicket: true }, teamNames);
      expect(state.innings[1].wickets).toBe(1);
      expect(state.isCompleted).toBe(false);

      // Hit a boundary: 48 + 4 = 52 >= 51 (target reached)
      state = applyDelivery(state, { action: 'score', runs: 4 }, teamNames);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(awayTeamId);
      expect(state.resultText).toBe('Warriors won by 9 wickets'); // 10 - 1 wicket
    });

    it('should auto-end match when overs expire short of target ("Team A won by Y runs")', () => {
      // 1-over match per innings
      let state = createInitialCricketState(homeTeamId, awayTeamId, 1, 10);
      state.innings[0].runs = 20;
      state.innings[0].overs = 1;
      state.currentInningIndex = 1;
      state.target = 21;

      // Bowl 6 balls in Innings 2, scoring only 12 runs
      for (let i = 0; i < 6; i++) {
        state = applyDelivery(state, { action: 'score', runs: 2 }, teamNames);
      }

      expect(state.innings[1].overs).toBe(1);
      expect(state.innings[1].runs).toBe(12);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(homeTeamId);
      expect(state.resultText).toBe('Thunderbolts won by 8 runs'); // 20 - 12
    });

    it('should auto-end match when chasing team is all out short of target ("Team A won by Y runs")', () => {
      // 2-wicket test match
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 2);
      state.innings[0].runs = 30;
      state.currentInningIndex = 1;
      state.target = 31;

      state = applyDelivery(state, { action: 'wicket', isWicket: true }, teamNames);
      state = applyDelivery(state, { action: 'score', runs: 10 }, teamNames);
      // 2nd wicket -> All out!
      state = applyDelivery(state, { action: 'wicket', isWicket: true }, teamNames);

      expect(state.innings[1].wickets).toBe(2);
      expect(state.innings[1].runs).toBe(10);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(homeTeamId);
      expect(state.resultText).toBe('Thunderbolts won by 20 runs'); // 30 - 10
    });

    it('should conclude with "Match tied" when scores are equal at the end of overs', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 1, 10);
      state.innings[0].runs = 12;
      state.innings[0].overs = 1;
      state.currentInningIndex = 1;
      state.target = 13;

      // Chasing team scores exactly 12 runs in 6 balls
      for (let i = 0; i < 6; i++) {
        state = applyDelivery(state, { action: 'score', runs: 2 }, teamNames);
      }

      expect(state.innings[1].runs).toBe(12);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBeNull();
      expect(state.resultText).toBe('Match tied');
    });
  });

  describe('7. Undo Last Ball (Both Innings)', () => {
    it('should undo runs and balls in Innings 1', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      state = applyDelivery(state, { action: 'score', runs: 4 });
      state = applyDelivery(state, { action: 'score', runs: 1 });
      expect(state.innings[0].runs).toBe(5);
      expect(state.innings[0].balls).toBe(2);

      state = undoDelivery(state);
      expect(state.innings[0].runs).toBe(4);
      expect(state.innings[0].balls).toBe(1);
      expect(state.recentBalls).toEqual(['4']);
    });

    it('should undo an extra (Wide) without affecting legal balls', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      state = applyDelivery(state, { action: 'score', runs: 2 }); // 1 ball, 2 runs
      state = applyDelivery(state, { action: 'extra', isWide: true }); // 1 ball, 3 runs
      expect(state.innings[0].runs).toBe(3);
      expect(state.innings[0].balls).toBe(1);

      state = undoDelivery(state);
      expect(state.innings[0].runs).toBe(2);
      expect(state.innings[0].balls).toBe(1);
    });

    it('should undo across an over boundary (1.0 -> 0.5 overs)', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      for (let i = 0; i < 6; i++) {
        state = applyDelivery(state, { action: 'score', runs: 1 });
      }
      expect(state.innings[0].overs).toBe(1);
      expect(state.innings[0].balls).toBe(0);

      state = undoDelivery(state);
      expect(state.innings[0].overs).toBe(0);
      expect(state.innings[0].balls).toBe(5);
      expect(state.innings[0].runs).toBe(5);
    });

    it('should undo delivery in Innings 2', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      state.currentInningIndex = 1;
      state.target = 50;

      state = applyDelivery(state, { action: 'score', runs: 6 });
      expect(state.innings[1].runs).toBe(6);
      expect(state.innings[1].balls).toBe(1);

      state = undoDelivery(state);
      expect(state.innings[1].runs).toBe(0);
      expect(state.innings[1].balls).toBe(0);
    });

    it('should undo final ball that completed the match and restore live match status', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 20, 10);
      state.innings[0].runs = 20;
      state.currentInningIndex = 1;
      state.target = 21;
      state.innings[1].runs = 18;

      // Delivery that reaches target and wins match
      state = applyDelivery(state, { action: 'score', runs: 4 }, teamNames);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(awayTeamId);

      // Undo winning delivery
      state = undoDelivery(state);
      expect(state.isCompleted).toBe(false);
      expect(state.winner).toBeNull();
      expect(state.resultText).toBeNull();
      expect(state.innings[1].runs).toBe(18);
    });

    it('should undo across Innings boundary if Innings 1 was auto-ended', () => {
      let state = createInitialCricketState(homeTeamId, awayTeamId, 1, 10);
      for (let i = 0; i < 6; i++) {
        state = applyDelivery(state, { action: 'score', runs: 1 });
      }
      // Reached 1 over -> switched to Innings 2
      expect(state.currentInningIndex).toBe(1);
      expect(state.target).toBe(7);

      // Undo the 6th delivery
      state = undoDelivery(state);
      expect(state.currentInningIndex).toBe(0); // Reverted back to Innings 1!
      expect(state.innings[0].overs).toBe(0);
      expect(state.innings[0].balls).toBe(5);
      expect(state.innings[0].runs).toBe(5);
    });
  });
});

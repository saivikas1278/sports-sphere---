import { describe, it, expect } from '@jest/globals';
import {
  SPORT_CONFIGS,
  resolveConfig,
  getSetRules,
  createInitialPointsState,
  checkSetWinner,
  getActiveSetStatus,
  applyPoint,
  undoPoint
} from '../src/utils/pointsScoringEngine.js';

describe('Generic Points-Based Scoring Engine (Config-Driven)', () => {
  const homeTeamId = 'team_home_id';
  const awayTeamId = 'team_away_id';
  const teamNames = { home: 'Smashers', away: 'Shuttlers' };

  describe('1. Badminton Rules & Edge Cases (Best of 3, 21 pts, win by 2, cap at 30)', () => {
    it('should award set on normal win at 21 points with 2-point margin (21-19)', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      // Simulate home 20, away 19
      state.sets[0].homeScore = 20;
      state.sets[0].awayScore = 19;

      // 21st point for home -> 21-19 wins set 1!
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);

      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.sets[0].winner).toBe('home');
      expect(state.sets[0].homeScore).toBe(21);
      expect(state.sets[0].awayScore).toBe(19);
      expect(state.homeSetsWon).toBe(1);
      expect(state.currentSet).toBe(2); // Advanced to Set 2
      expect(state.sets.length).toBe(2);
      expect(state.isCompleted).toBe(false);
    });

    it('should handle deuce at 20-20 and require 2-point lead (22-20)', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      state.sets[0].homeScore = 20;
      state.sets[0].awayScore = 20;

      const deuceStatus = getActiveSetStatus(state);
      expect(deuceStatus.isDeuce).toBe(true);

      // Home scores 21 -> 21-20 (not won yet because margin is only 1)
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      expect(state.sets[0].isCompleted).toBe(false);
      expect(state.sets[0].homeScore).toBe(21);
      expect(state.sets[0].awayScore).toBe(20);

      // Home scores 22 -> 22-20 (won by 2!)
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.sets[0].winner).toBe('home');
      expect(state.sets[0].homeScore).toBe(22);
      expect(state.sets[0].awayScore).toBe(20);
    });

    it('should enforce sudden-death cap at 30 points (30-29 wins despite 1-point margin)', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      state.sets[0].homeScore = 29;
      state.sets[0].awayScore = 29;

      // In Badminton, at 29-29, the side scoring the 30th point wins the set
      state = applyPoint(state, { action: 'point', team: 'away' }, teamNames);

      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.sets[0].winner).toBe('away');
      expect(state.sets[0].awayScore).toBe(30);
      expect(state.sets[0].homeScore).toBe(29);
      expect(state.awaySetsWon).toBe(1);
    });

    it('should complete Badminton match when a team wins 2 sets (Best of 3)', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      // Set 1 won by home: 21-15
      state.sets[0].homeScore = 20;
      state.sets[0].awayScore = 15;
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      expect(state.homeSetsWon).toBe(1);
      expect(state.currentSet).toBe(2);

      // Set 2 won by home: 21-18
      state.sets[1].homeScore = 20;
      state.sets[1].awayScore = 18;
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);

      // Match completed!
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(homeTeamId);
      expect(state.homeSetsWon).toBe(2);
      expect(state.awaySetsWon).toBe(0);
      expect(state.resultText).toBe('Smashers won 2-0 (21-15, 21-18)');
    });
  });

  describe('2. Volleyball Rules & Edge Cases (Best of 5, 25 pts, 15 in the 5th, win by 2, no cap)', () => {
    const vballNames = { home: 'Spikers', away: 'Blockers' };

    it('should resolve standard sets 1-4 to 25 points with win by 2 (25-22)', () => {
      let state = createInitialPointsState('volleyball', homeTeamId, awayTeamId);
      state.sets[0].homeScore = 24;
      state.sets[0].awayScore = 22;

      state = applyPoint(state, { action: 'point', team: 'home' }, vballNames);

      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.sets[0].winner).toBe('home');
      expect(state.sets[0].homeScore).toBe(25);
      expect(state.sets[0].awayScore).toBe(22);
      expect(state.homeSetsWon).toBe(1);
      expect(state.currentSet).toBe(2);
    });

    it('should handle Volleyball deuce past 25 with no cap (28-26)', () => {
      let state = createInitialPointsState('volleyball', homeTeamId, awayTeamId);
      state.sets[0].homeScore = 26;
      state.sets[0].awayScore = 26;

      // 27-26 (not won, no cap in volleyball)
      state = applyPoint(state, { action: 'point', team: 'away' }, vballNames);
      expect(state.sets[0].isCompleted).toBe(false);

      // 28-26 (won by 2!)
      state = applyPoint(state, { action: 'point', team: 'away' }, vballNames);
      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.sets[0].winner).toBe('away');
      expect(state.sets[0].awayScore).toBe(28);
      expect(state.sets[0].homeScore).toBe(26);
    });

    it('should switch to 15 points target in the deciding 5th set', () => {
      let state = createInitialPointsState('volleyball', homeTeamId, awayTeamId);
      // Simulate 2-2 tie going into 5th set
      state.homeSetsWon = 2;
      state.awaySetsWon = 2;
      state.currentSet = 5;
      state.sets = [
        { setNumber: 1, homeScore: 25, awayScore: 20, isCompleted: true, winner: 'home' },
        { setNumber: 2, homeScore: 22, awayScore: 25, isCompleted: true, winner: 'away' },
        { setNumber: 3, homeScore: 25, awayScore: 19, isCompleted: true, winner: 'home' },
        { setNumber: 4, homeScore: 23, awayScore: 25, isCompleted: true, winner: 'away' },
        { setNumber: 5, homeScore: 14, awayScore: 13, isCompleted: false, winner: null }
      ];

      const rules = getSetRules(state.config, 5);
      expect(rules.targetPoints).toBe(15);
      expect(rules.winBy).toBe(2);
      expect(rules.isDeciding).toBe(true);

      // Home scores 15th point: 15-13 wins the 5th set and the match!
      state = applyPoint(state, { action: 'point', team: 'home' }, vballNames);

      expect(state.sets[4].isCompleted).toBe(true);
      expect(state.sets[4].homeScore).toBe(15);
      expect(state.sets[4].awayScore).toBe(13);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(homeTeamId);
      expect(state.homeSetsWon).toBe(3);
      expect(state.awaySetsWon).toBe(2);
      expect(state.resultText).toBe('Spikers won 3-2 (25-20, 22-25, 25-19, 23-25, 15-13)');
    });
  });

  describe('3. Config-Driven Extensibility (Adding new sport via config object)', () => {
    it('should cleanly support Table Tennis (Best of 5, 11 points, win by 2) without new code', () => {
      const tableTennisConfig = {
        sport: 'table-tennis',
        displayName: 'Table Tennis',
        bestOf: 5,
        setsToWin: 3,
        targetPoints: 11,
        winBy: 2,
        cap: null
      };

      let state = createInitialPointsState('custom', homeTeamId, awayTeamId, tableTennisConfig);
      state.sets[0].homeScore = 10;
      state.sets[0].awayScore = 9;

      state = applyPoint(state, { action: 'point', team: 'home' }, { home: 'Player 1', away: 'Player 2' });

      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.sets[0].homeScore).toBe(11);
      expect(state.sets[0].awayScore).toBe(9);
      expect(state.homeSetsWon).toBe(1);
      expect(state.currentSet).toBe(2);
    });
  });

  describe('4. Bi-directional Undo Support', () => {
    it('should undo points within the current set', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      state = applyPoint(state, { action: 'point', team: 'away' }, teamNames);
      expect(state.sets[0].homeScore).toBe(2);
      expect(state.sets[0].awayScore).toBe(1);

      state = undoPoint(state);
      expect(state.sets[0].homeScore).toBe(2);
      expect(state.sets[0].awayScore).toBe(0);

      state = undoPoint(state);
      expect(state.sets[0].homeScore).toBe(1);
      expect(state.sets[0].awayScore).toBe(0);
    });

    it('should undo across set boundaries (re-opening completed set)', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      state.sets[0].homeScore = 20;
      state.sets[0].awayScore = 18;

      // 21st point wins Set 1 and advances to Set 2
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      expect(state.sets[0].isCompleted).toBe(true);
      expect(state.homeSetsWon).toBe(1);
      expect(state.currentSet).toBe(2);
      expect(state.sets.length).toBe(2);

      // Undo the winning point
      state = undoPoint(state);
      expect(state.currentSet).toBe(1); // Back to Set 1!
      expect(state.sets.length).toBe(1); // Set 2 removed
      expect(state.sets[0].isCompleted).toBe(false);
      expect(state.sets[0].homeScore).toBe(20);
      expect(state.sets[0].awayScore).toBe(18);
      expect(state.homeSetsWon).toBe(0);
    });

    it('should undo the winning point of the match and restore live match status', () => {
      let state = createInitialPointsState('badminton', homeTeamId, awayTeamId);
      state.homeSetsWon = 1;
      state.currentSet = 2;
      state.sets = [
        { setNumber: 1, homeScore: 21, awayScore: 19, isCompleted: true, winner: 'home' },
        { setNumber: 2, homeScore: 20, awayScore: 17, isCompleted: false, winner: null }
      ];

      // Winning point
      state = applyPoint(state, { action: 'point', team: 'home' }, teamNames);
      expect(state.isCompleted).toBe(true);
      expect(state.winner).toBe(homeTeamId);

      // Undo winning point
      state = undoPoint(state);
      expect(state.isCompleted).toBe(false);
      expect(state.winner).toBeNull();
      expect(state.resultText).toBeNull();
      expect(state.homeSetsWon).toBe(1);
      expect(state.sets[1].homeScore).toBe(20);
      expect(state.sets[1].isCompleted).toBe(false);
    });
  });
});

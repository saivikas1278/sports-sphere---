import request from 'supertest';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import Match from '../src/models/Match.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

describe('Cricket Scoring API & Innings 2 Winner Progression Integration', () => {
  let organizerToken;
  let organizerId;
  let tournament;
  let team1;
  let team2;
  let semiMatch;
  let finalMatch;

  beforeAll(async () => {
    await connectTestDb();
    await clearTestDb();

    // 1. Create Organizer
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Cricket Official',
        email: 'cricket.official@example.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizerToken = orgRes.body.token;
    organizerId = orgRes.body.user._id || orgRes.body.user.id;

    // 2. Create Tournament
    tournament = await Tournament.create({
      name: 'Super Cricket Championship 2026',
      description: 'Championship for testing Innings 2 scoring and progression',
      sport: 'cricket',
      format: 'single-elimination',
      maxTeams: 4,
      organizer: organizerId,
      status: 'ongoing',
      venue: { name: 'Wankhede Arena', city: 'Mumbai', state: 'MH' },
      dates: {
        registrationStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        registrationEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tournamentStart: new Date(Date.now()),
        tournamentEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    });

    // 3. Create Teams
    team1 = await Team.create({
      name: 'Mumbai Lions',
      captain: organizerId,
      sport: 'cricket',
      tournament: tournament._id
    });

    team2 = await Team.create({
      name: 'Chennai Royals',
      captain: organizerId,
      sport: 'cricket',
      tournament: tournament._id
    });

    // 4. Create Linked Matches (Semi-final feeding Final via Prompt 3.1)
    finalMatch = await Match.create({
      tournament: tournament._id,
      matchNumber: 2,
      scheduledTime: new Date(),
      round: 2,
      roundName: 'Final',
      position: 0,
      sportType: 'cricket',
      status: 'scheduled',
      homeTeam: null,
      awayTeam: null,
      nextMatchId: null,
      nextSlot: null
    });

    semiMatch = await Match.create({
      tournament: tournament._id,
      matchNumber: 1,
      scheduledTime: new Date(),
      round: 1,
      roundName: 'Semi-Final 1',
      position: 0,
      sportType: 'cricket',
      status: 'scheduled',
      homeTeam: team1._id,
      awayTeam: team2._id,
      nextMatchId: finalMatch._id,
      nextSlot: 'teamA',
      cricketData: {
        innings: [
          { team: team1._id, runs: 0, wickets: 0, overs: 0, balls: 0 },
          { team: team2._id, runs: 0, wickets: 0, overs: 0, balls: 0 }
        ],
        currentInningIndex: 0,
        maxOvers: 2, // 2-over match for test efficiency
        maxWickets: 10,
        target: null,
        recentBalls: [],
        ballHistory: [],
        isCompleted: false
      }
    });
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  it('PUT /api/tournaments/:id/matches/:matchId/cricket-ball should score Innings 1 and handle extras', async () => {
    // Ball 1: 4 runs
    const res1 = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'score', runs: 4 });

    expect(res1.status).toBe(200);
    expect(res1.body.data.cricketData.innings[0].runs).toBe(4);
    expect(res1.body.data.cricketData.innings[0].balls).toBe(1);

    // Ball 2: Wide (+1 run, no legal ball advance)
    const res2 = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'extra', isWide: true });

    expect(res2.status).toBe(200);
    expect(res2.body.data.cricketData.innings[0].runs).toBe(5);
    expect(res2.body.data.cricketData.innings[0].balls).toBe(1); // Ball count remains 1

    // Ball 3: No-ball (+1 run, no legal ball advance)
    const res3 = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'extra', isNoBall: true });

    expect(res3.status).toBe(200);
    expect(res3.body.data.cricketData.innings[0].runs).toBe(6);
    expect(res3.body.data.cricketData.innings[0].balls).toBe(1);
  });

  it('should support Undo Last Ball for Innings 1', async () => {
    const res = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'undo' });

    expect(res.status).toBe(200);
    // Undid No-ball: runs should go back from 6 to 5
    expect(res.body.data.cricketData.innings[0].runs).toBe(5);
  });

  it('should auto-switch to Innings 2 when max overs is reached and set Target = Innings 1 + 1', async () => {
    // Current: 5 runs, 1 legal ball (0.1 overs) in a 2-over match.
    // Need 11 more legal deliveries to reach 2.0 overs (12 total balls).
    for (let i = 0; i < 11; i++) {
      await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ action: 'score', runs: 1 });
    }

    const matchDoc = await Match.findById(semiMatch._id);
    // Total runs in Innings 1: 5 + 11 = 16 runs in 2.0 overs
    expect(matchDoc.cricketData.innings[0].runs).toBe(16);
    expect(matchDoc.cricketData.innings[0].overs).toBe(2);

    // Auto-switched to Innings 2!
    expect(matchDoc.cricketData.currentInningIndex).toBe(1);
    // Target = 16 + 1 = 17
    expect(matchDoc.cricketData.target).toBe(17);
    expect(matchDoc.status).toBe('live');
  });

  it('should auto-end match when Innings 2 reaches target, compute result, and advance winner to Final', async () => {
    // Innings 2 Target is 17.
    // Score 3 sixes: 6 + 6 + 6 = 18 >= 17 (Target reached in 3 balls!)
    await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'score', runs: 6 });

    await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'score', runs: 6 });

    const winningRes = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/cricket-ball`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'score', runs: 6 });

    expect(winningRes.status).toBe(200);
    const updatedSemi = winningRes.body.data;

    // Innings 2 runs = 18 >= 17 target
    expect(updatedSemi.cricketData.innings[1].runs).toBe(18);
    expect(updatedSemi.status).toBe('completed');
    expect(updatedSemi.result.winner.toString()).toBe(team2._id.toString());
    expect(updatedSemi.result.details).toBe('Chennai Royals won by 10 wickets');

    // Prompt 3.1 Verification: Winner must be advanced into finalMatch.homeTeam (nextSlot: 'teamA')!
    const updatedFinal = await Match.findById(finalMatch._id);
    expect(updatedFinal.homeTeam.toString()).toBe(team2._id.toString());
  });
});

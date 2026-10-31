import request from 'supertest';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import Match from '../src/models/Match.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

describe('Points-Based Scoring API & Automated Progression Integration', () => {
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
        fullName: 'Badminton Umpire',
        email: 'umpire@example.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizerToken = orgRes.body.token;
    organizerId = orgRes.body.user._id || orgRes.body.user.id;

    // 2. Create Tournament
    tournament = await Tournament.create({
      name: 'All India Badminton Masters 2026',
      description: 'Tournament for testing points-based scoring and bracket progression',
      sport: 'badminton',
      format: 'single-elimination',
      maxTeams: 4,
      organizer: organizerId,
      status: 'ongoing',
      venue: { name: 'Pullela Gopichand Academy', city: 'Hyderabad', state: 'TS' },
      dates: {
        registrationStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        registrationEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tournamentStart: new Date(Date.now()),
        tournamentEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    });

    // 3. Create Teams
    team1 = await Team.create({
      name: 'Hyderabad Smashers',
      captain: organizerId,
      sport: 'badminton',
      tournament: tournament._id
    });

    team2 = await Team.create({
      name: 'Bengaluru Blasters',
      captain: organizerId,
      sport: 'badminton',
      tournament: tournament._id
    });

    // 4. Create Linked Matches (Semi feeding Final via Prompt 3.1)
    finalMatch = await Match.create({
      tournament: tournament._id,
      matchNumber: 2,
      scheduledTime: new Date(),
      round: 2,
      roundName: 'Final',
      position: 0,
      sportType: 'points',
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
      sportType: 'points',
      status: 'scheduled',
      homeTeam: team1._id,
      awayTeam: team2._id,
      nextMatchId: finalMatch._id,
      nextSlot: 'teamB',
      setsData: {
        sport: 'badminton',
        sets: [
          { setNumber: 1, homeScore: 20, awayScore: 20, isCompleted: false, winner: null }
        ],
        currentSet: 1,
        homeSetsWon: 0,
        awaySetsWon: 0,
        isCompleted: false,
        pointHistory: []
      }
    });
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  it('PUT /api/tournaments/:id/matches/:matchId/points-score should update point and handle deuce', async () => {
    // 20-20 -> Home scores 21
    const res = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/points-score`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'point', team: 'home', sport: 'badminton' });

    expect(res.status).toBe(200);
    expect(res.body.data.setsData.sets[0].homeScore).toBe(21);
    expect(res.body.data.setsData.sets[0].awayScore).toBe(20);
    expect(res.body.data.setsData.sets[0].isCompleted).toBe(false); // Win by 2 required!
  });

  it('should support Undo Last Point via API', async () => {
    const res = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/points-score`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'undo' });

    expect(res.status).toBe(200);
    expect(res.body.data.setsData.sets[0].homeScore).toBe(20);
    expect(res.body.data.setsData.sets[0].awayScore).toBe(20);
  });

  it('should complete Set 1, create Set 2, complete Match on 2nd set win, and advance winner to Final', async () => {
    // Home scores 21 and 22 -> 22-20 wins Set 1!
    await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/points-score`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'point', team: 'home', sport: 'badminton' });

    const set1WinRes = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/points-score`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'point', team: 'home', sport: 'badminton' });

    expect(set1WinRes.status).toBe(200);
    expect(set1WinRes.body.data.setsData.sets[0].isCompleted).toBe(true);
    expect(set1WinRes.body.data.setsData.homeSetsWon).toBe(1);
    expect(set1WinRes.body.data.setsData.currentSet).toBe(2);
    expect(set1WinRes.body.data.setsData.sets.length).toBe(2);

    // Fast forward Set 2: set scores to 20-18 for Home
    await Match.findByIdAndUpdate(semiMatch._id, {
      'setsData.sets.1.homeScore': 20,
      'setsData.sets.1.awayScore': 18
    });

    // Score the 21st point in Set 2: 21-18 wins Set 2 and the Match!
    const matchWinRes = await request(app)
      .put(`/api/tournaments/${tournament._id}/matches/${semiMatch._id}/points-score`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ action: 'point', team: 'home', sport: 'badminton' });

    expect(matchWinRes.status).toBe(200);
    const updatedMatch = matchWinRes.body.data;
    expect(updatedMatch.status).toBe('completed');
    expect(updatedMatch.setsData.homeSetsWon).toBe(2);
    expect(updatedMatch.result.winner.toString()).toBe(team1._id.toString());
    expect(updatedMatch.result.details).toContain('Hyderabad Smashers won 2-0');

    // Prompt 3.1 Verification: Winner advanced into finalMatch.awayTeam (nextSlot: 'teamB')!
    const updatedFinal = await Match.findById(finalMatch._id);
    expect(updatedFinal.awayTeam.toString()).toBe(team1._id.toString());
  });
});

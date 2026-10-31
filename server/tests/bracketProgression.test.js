import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Tournament from '../src/models/Tournament.js';
import Match from '../src/models/Match.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './setup.js';

describe('Single-Elimination Automated Winner Progression & Bye System', () => {
  let organizerToken;
  let organizerId;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearTestDb();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // Create Organizer
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Bracket Organizer',
        email: 'organizer@bracketprogression.com',
        password: 'Password123!',
        role: 'organizer'
      });
    organizerToken = orgRes.body.token;
    organizerId = orgRes.body.user._id;
  });

  const setupTournamentWithApprovedTeams = async (teamCount) => {
    const now = new Date();
    const tournament = await Tournament.create({
      name: `Championship ${teamCount} Teams`,
      description: `Testing knockout progression with ${teamCount} teams`,
      sport: 'football',
      format: 'single-elimination',
      maxTeams: Math.max(16, teamCount),
      organizer: organizerId,
      dates: {
        registrationStart: new Date(now.getTime() - 86400000),
        registrationEnd: new Date(now.getTime() + 86400000 * 7),
        tournamentStart: new Date(now.getTime() + 86400000 * 10),
        tournamentEnd: new Date(now.getTime() + 86400000 * 14)
      },
      status: 'open',
      visibility: 'public'
    });

    const teams = [];
    for (let i = 1; i <= teamCount; i++) {
      const captain = await User.create({
        firstName: `Capt${i}`,
        lastName: `Team${teamCount}`,
        email: `capt_${teamCount}_${i}_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'player'
      });

      const team = await Team.create({
        name: `Team ${i} (N=${teamCount})`,
        captain: captain._id,
        tournament: tournament._id,
        sport: 'football',
        registrationDetails: { registrationStatus: 'approved' }
      });

      tournament.registeredTeams.push({
        team: team._id,
        status: 'approved',
        registeredAt: new Date()
      });
      teams.push(team);
    }
    await tournament.save();

    return { tournament, teams };
  };

  // --- 4 TEAMS (Power of 2) ---
  describe('4 Teams Bracket (Exact power of 2: 0 byes, 3 matches total)', () => {
    it('should generate linked matches, advance winners to final, and complete tournament with champion', async () => {
      const { tournament } = await setupTournamentWithApprovedTeams(4);

      // Start tournament to generate bracket
      const startRes = await request(app)
        .post(`/api/tournaments/${tournament._id}/start`)
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(startRes.status).toBe(200);

      // Verify matches count = 4 - 1 = 3 matches
      const matches = await Match.find({ tournament: tournament._id }).sort({ round: 1, position: 1 });
      expect(matches.length).toBe(3);

      const r1Matches = matches.filter((m) => m.round === 1);
      const finalMatch = matches.find((m) => m.round === 2);

      expect(r1Matches.length).toBe(2);
      expect(finalMatch).not.toBeNull();
      expect(finalMatch.roundName.toLowerCase()).toContain('final');

      // Verify links
      expect(r1Matches[0].nextMatchId.toString()).toBe(finalMatch._id.toString());
      expect(r1Matches[0].nextSlot).toBe('teamA');
      expect(r1Matches[1].nextMatchId.toString()).toBe(finalMatch._id.toString());
      expect(r1Matches[1].nextSlot).toBe('teamB');

      // Reject tie in knockout match
      const tieRes = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Matches[0]._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 2, awayScore: 2 });
      expect(tieRes.status).toBe(400);
      expect(tieRes.body.error).toContain('cannot end in a tie');

      // Complete Semifinal 1: homeTeam wins
      const semi1Res = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Matches[0]._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 3, awayScore: 1, winner: 'home' });
      expect(semi1Res.status).toBe(200);

      // Check final match now has teamA = r1Matches[0].homeTeam
      let updatedFinal = await Match.findById(finalMatch._id);
      expect(updatedFinal.homeTeam.toString()).toBe(r1Matches[0].homeTeam.toString());
      expect(updatedFinal.awayTeam).toBeNull(); // Still waiting for Semifinal 2

      // Complete Semifinal 2: awayTeam wins
      const semi2Res = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Matches[1]._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 0, awayScore: 2, winner: 'away' });
      expect(semi2Res.status).toBe(200);

      // Check final match now has both teams
      updatedFinal = await Match.findById(finalMatch._id);
      expect(updatedFinal.awayTeam.toString()).toBe(r1Matches[1].awayTeam.toString());

      // Complete Final Match
      const finalRes = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${finalMatch._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 2, awayScore: 1, winner: 'home' });
      expect(finalRes.status).toBe(200);

      // Verify tournament is completed and champion is stored
      const completedTournament = await Tournament.findById(tournament._id);
      expect(completedTournament.status).toBe('completed');
      expect(completedTournament.champion.toString()).toBe(updatedFinal.homeTeam.toString());
    });
  });

  // --- 5 TEAMS (Non-power of 2) ---
  describe('5 Teams Bracket (3 byes advance to R2 at generation, 4 matches total)', () => {
    it('should advance 3 bye teams to Round 2 at generation time and advance Round 1 winner into open slot', async () => {
      const { tournament } = await setupTournamentWithApprovedTeams(5);

      const startRes = await request(app)
        .post(`/api/tournaments/${tournament._id}/start`)
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(startRes.status).toBe(200);

      // Total matches must be 5 - 1 = 4
      const matches = await Match.find({ tournament: tournament._id }).sort({ round: 1, position: 1 });
      expect(matches.length).toBe(4);

      const r1Matches = matches.filter((m) => m.round === 1);
      const r2Matches = matches.filter((m) => m.round === 2);
      const finalMatch = matches.find((m) => m.round === 3);

      // R1 has 1 match, R2 has 2 matches, R3 has 1 match (Final)
      expect(r1Matches.length).toBe(1);
      expect(r2Matches.length).toBe(2);
      expect(finalMatch).not.toBeNull();

      // Verify Round 2 byes: exactly 3 slots in Round 2 must be pre-populated with teams!
      const r2PopulatedSlots = [
        r2Matches[0].homeTeam,
        r2Matches[0].awayTeam,
        r2Matches[1].homeTeam,
        r2Matches[1].awayTeam
      ].filter(Boolean);
      expect(r2PopulatedSlots.length).toBe(3);

      // The 1 empty slot in Round 2 must be pointed to by the Round 1 match
      const r1Match = r1Matches[0];
      const targetR2Match = r2Matches.find((m) => m._id.toString() === r1Match.nextMatchId.toString());
      expect(targetR2Match).toBeDefined();

      if (r1Match.nextSlot === 'teamA') {
        expect(targetR2Match.homeTeam).toBeNull();
      } else {
        expect(targetR2Match.awayTeam).toBeNull();
      }

      // Complete Round 1 match: homeTeam wins
      const r1Res = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Match._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 1, awayScore: 0, winner: 'home' });
      expect(r1Res.status).toBe(200);

      // Verify the target Round 2 match now has its open slot filled with R1 winner!
      const updatedTargetR2 = await Match.findById(targetR2Match._id);
      const slottedTeam = r1Match.nextSlot === 'teamA' ? updatedTargetR2.homeTeam : updatedTargetR2.awayTeam;
      expect(slottedTeam.toString()).toBe(r1Match.homeTeam.toString());

      // Progress through Round 2 matches to Final
      await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r2Matches[0]._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 2, awayScore: 0, winner: 'home' });

      await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r2Matches[1]._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 0, awayScore: 3, winner: 'away' });

      // Check Final is now populated with winners of R2
      const readyFinal = await Match.findById(finalMatch._id);
      expect(readyFinal.homeTeam).not.toBeNull();
      expect(readyFinal.awayTeam).not.toBeNull();

      // Complete Final
      await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${finalMatch._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 4, awayScore: 2, winner: 'home' });

      const finishedTourn = await Tournament.findById(tournament._id);
      expect(finishedTourn.status).toBe('completed');
      expect(finishedTourn.champion.toString()).toBe(readyFinal.homeTeam.toString());
    });
  });

  // --- 8 TEAMS (Power of 2: 7 matches, Edit Protection verification) ---
  describe('8 Teams Bracket (0 byes, 7 matches total, with Edit Protection)', () => {
    it('should block editing result if next match has started, but allow edit if next match is still scheduled', async () => {
      const { tournament } = await setupTournamentWithApprovedTeams(8);

      await request(app)
        .post(`/api/tournaments/${tournament._id}/start`)
        .set('Authorization', `Bearer ${organizerToken}`);

      const matches = await Match.find({ tournament: tournament._id }).sort({ round: 1, position: 1 });
      expect(matches.length).toBe(7); // 8 - 1 = 7

      const r1Match0 = matches.find((m) => m.round === 1 && m.position === 0);
      const nextMatch = await Match.findById(r1Match0.nextMatchId);

      // 1. Submit initial result for Match 0: Team A wins
      await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Match0._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 3, awayScore: 1, winner: 'home' });

      let checkNext = await Match.findById(nextMatch._id);
      expect(checkNext.homeTeam.toString()).toBe(r1Match0.homeTeam.toString());

      // 2. Edit result while next match is still scheduled: Team B should now win
      const editRes1 = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Match0._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 1, awayScore: 2, winner: 'away' });
      expect(editRes1.status).toBe(200);

      // Verify downstream slot was corrected to Team B
      checkNext = await Match.findById(nextMatch._id);
      expect(checkNext.homeTeam.toString()).toBe(r1Match0.awayTeam.toString());

      // 3. Now start the next match (status = 'live')
      checkNext.status = 'live';
      await checkNext.save();

      // 4. Attempt to edit Match 0 now: MUST be blocked with 400!
      const blockedEditRes = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${r1Match0._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 5, awayScore: 2, winner: 'home' });

      expect(blockedEditRes.status).toBe(400);
      expect(blockedEditRes.body.error).toContain('already started or completed');
    });
  });

  // --- 11 TEAMS (Non-power of 2: 5 byes, 10 matches total) ---
  describe('11 Teams Bracket (5 byes, 10 matches total, 4 rounds)', () => {
    it('should correctly configure 11-team bracket, advance 5 byes to R2, and conclude tournament', async () => {
      const { tournament } = await setupTournamentWithApprovedTeams(11);

      await request(app)
        .post(`/api/tournaments/${tournament._id}/start`)
        .set('Authorization', `Bearer ${organizerToken}`);

      const matches = await Match.find({ tournament: tournament._id }).sort({ round: 1, position: 1 });
      // Total matches must be 11 - 1 = 10
      expect(matches.length).toBe(10);

      const r1 = matches.filter((m) => m.round === 1);
      const r2 = matches.filter((m) => m.round === 2);
      const r3 = matches.filter((m) => m.round === 3);
      const r4 = matches.filter((m) => m.round === 4);

      expect(r1.length).toBe(3); // 3 Round 1 matches
      expect(r2.length).toBe(4); // 4 Round 2 matches (8 slots)
      expect(r3.length).toBe(2); // 2 Semifinals
      expect(r4.length).toBe(1); // 1 Final

      // Verify Round 2 pre-populated byes = 5
      const r2Prepopulated = r2
        .flatMap((m) => [m.homeTeam, m.awayTeam])
        .filter(Boolean);
      expect(r2Prepopulated.length).toBe(5);

      // Verify all 3 Round 1 matches have nextMatchId pointing to Round 2 matches
      for (const m of r1) {
        expect(m.nextMatchId).not.toBeNull();
        expect(['teamA', 'teamB']).toContain(m.nextSlot);
        const parentMatch = r2.find((pm) => pm._id.toString() === m.nextMatchId.toString());
        expect(parentMatch).toBeDefined();
      }

      // Complete all 3 Round 1 matches
      for (const m of r1) {
        await request(app)
          .put(`/api/tournaments/${tournament._id}/matches/${m._id}/result`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({ homeScore: 2, awayScore: 1, winner: 'home' });
      }

      // Now all 8 slots in Round 2 must be full!
      const updatedR2 = await Match.find({ tournament: tournament._id, round: 2 });
      const r2Filled = updatedR2.flatMap((m) => [m.homeTeam, m.awayTeam]).filter(Boolean);
      expect(r2Filled.length).toBe(8);

      // Complete Round 2 matches
      for (const m of updatedR2) {
        await request(app)
          .put(`/api/tournaments/${tournament._id}/matches/${m._id}/result`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({ homeScore: 3, awayScore: 0, winner: 'home' });
      }

      // Complete Round 3 matches
      const updatedR3 = await Match.find({ tournament: tournament._id, round: 3 });
      expect(updatedR3.flatMap((m) => [m.homeTeam, m.awayTeam]).filter(Boolean).length).toBe(4);

      for (const m of updatedR3) {
        await request(app)
          .put(`/api/tournaments/${tournament._id}/matches/${m._id}/result`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({ homeScore: 1, awayScore: 0, winner: 'home' });
      }

      // Complete Final (Round 4)
      const finalM = await Match.findOne({ tournament: tournament._id, round: 4 });
      expect(finalM.homeTeam).not.toBeNull();
      expect(finalM.awayTeam).not.toBeNull();

      await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${finalM._id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ homeScore: 2, awayScore: 0, winner: 'home' });

      // Verify tournament completed & champion stored
      const completedTournament = await Tournament.findById(tournament._id);
      expect(completedTournament.status).toBe('completed');
      expect(completedTournament.champion.toString()).toBe(finalM.homeTeam.toString());
    });
  });
});

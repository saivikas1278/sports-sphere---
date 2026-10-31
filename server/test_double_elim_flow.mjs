import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Tournament from './src/models/Tournament.js';
import Team from './src/models/Team.js';
import Match from './src/models/Match.js';
import User from './src/models/User.js';
import { advanceTournamentWinner } from './src/controllers/tournaments.js';

async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  try {
    // 1. Get or create organizer
    let organizer = await User.findOne({ email: 'test_organizer_de@example.com' });
    if (!organizer) {
      organizer = await User.create({
        name: 'DE Organizer',
        firstName: 'DE',
        lastName: 'Organizer',
        email: 'test_organizer_de@example.com',
        password: 'password123',
        role: 'organizer'
      });
    }

    // 2. Create 4 test teams
    const teamNames = ['DE Alpha', 'DE Bravo', 'DE Charlie', 'DE Delta'];
    const teams = [];
    for (const name of teamNames) {
      let team = await Team.findOne({ name });
      if (!team) {
        team = await Team.create({
          name,
          sport: 'football',
          captain: organizer._id,
          members: [{ user: organizer._id, role: 'captain' }]
        });
      }
      teams.push(team);
    }

    const now = new Date();
    // 3. Create double elimination tournament
    const tournament = await Tournament.create({
      name: 'Test Double Elimination Cup',
      description: 'Testing complete loser progression',
      sport: 'football',
      format: 'double-elimination',
      organizer: organizer._id,
      registeredTeams: teams.map(t => ({ team: t._id, status: 'approved' })),
      maxTeams: 4,
      dates: {
        registrationStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        registrationEnd: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        tournamentStart: now,
        tournamentEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      status: 'ongoing'
    });

    console.log(`Created tournament: ${tournament._id}`);

    // Pre-generate downstream matches with linked slots
    const wbFinalsId = new mongoose.Types.ObjectId();
    const lbFinalsId = new mongoose.Types.ObjectId();
    const grandFinalsId = new mongoose.Types.ObjectId();
    const lbR1Id = new mongoose.Types.ObjectId();

    // WB R1 Matches (2 matches)
    const wbR1M1 = await Match.create({
      tournament: tournament._id,
      round: 1,
      roundName: 'Winners Round 1',
      matchNumber: 1,
      position: 0,
      homeTeam: teams[0]._id, // Alpha
      awayTeam: teams[1]._id, // Bravo
      sport: 'football',
      nextMatchId: wbFinalsId,
      nextSlot: 'teamA',
      loserMatchId: lbR1Id,
      loserSlot: 'teamA',
      bracketType: 'winners',
      scheduledTime: new Date(),
      status: 'scheduled'
    });

    const wbR1M2 = await Match.create({
      tournament: tournament._id,
      round: 1,
      roundName: 'Winners Round 1',
      matchNumber: 2,
      position: 1,
      homeTeam: teams[2]._id, // Charlie
      awayTeam: teams[3]._id, // Delta
      sport: 'football',
      nextMatchId: wbFinalsId,
      nextSlot: 'teamB',
      loserMatchId: lbR1Id,
      loserSlot: 'teamB',
      bracketType: 'winners',
      scheduledTime: new Date(),
      status: 'scheduled'
    });

    // WB Finals Match
    const wbFinals = await Match.create({
      _id: wbFinalsId,
      tournament: tournament._id,
      round: 2,
      roundName: 'Winners Finals',
      matchNumber: 3,
      position: 0,
      homeTeam: null,
      awayTeam: null,
      sport: 'football',
      nextMatchId: grandFinalsId,
      nextSlot: 'teamA',
      loserMatchId: lbFinalsId,
      loserSlot: 'teamB',
      bracketType: 'winners',
      scheduledTime: new Date(),
      status: 'scheduled'
    });

    // LB R1 Match
    const lbR1 = await Match.create({
      _id: lbR1Id,
      tournament: tournament._id,
      round: 3,
      roundName: 'Losers Round 1',
      matchNumber: 4,
      position: 0,
      homeTeam: null,
      awayTeam: null,
      sport: 'football',
      nextMatchId: lbFinalsId,
      nextSlot: 'teamA',
      loserMatchId: null,
      loserSlot: null,
      bracketType: 'losers',
      scheduledTime: new Date(),
      status: 'scheduled'
    });

    // LB Finals Match
    const lbFinals = await Match.create({
      _id: lbFinalsId,
      tournament: tournament._id,
      round: 4,
      roundName: 'Losers Finals',
      matchNumber: 5,
      position: 0,
      homeTeam: null,
      awayTeam: null,
      sport: 'football',
      nextMatchId: grandFinalsId,
      nextSlot: 'teamB',
      loserMatchId: null,
      loserSlot: null,
      bracketType: 'losers',
      scheduledTime: new Date(),
      status: 'scheduled'
    });

    // Grand Finals Match
    const grandFinals = await Match.create({
      _id: grandFinalsId,
      tournament: tournament._id,
      round: 5,
      roundName: 'Grand Finals',
      matchNumber: 6,
      position: 0,
      homeTeam: null,
      awayTeam: null,
      sport: 'football',
      nextMatchId: null,
      nextSlot: null,
      loserMatchId: null,
      loserSlot: null,
      bracketType: 'finals',
      scheduledTime: new Date(),
      status: 'scheduled'
    });

    console.log('✓ All 6 tournament matches created and linked.');

    // Step 1: Simulate WB R1 Match 1 completion (Alpha vs Bravo -> Alpha wins)
    wbR1M1.status = 'completed';
    wbR1M1.result = { winner: teams[0]._id, homeScore: 3, awayScore: 1 };
    await wbR1M1.save();
    await advanceTournamentWinner(tournament, wbR1M1, teams[0]._id);

    // Verify WB Finals has Alpha in teamA, and LB R1 has Bravo in teamA
    let checkWbFinals = await Match.findById(wbFinalsId);
    let checkLbR1 = await Match.findById(lbR1Id);
    console.assert(checkWbFinals.homeTeam?.toString() === teams[0]._id.toString(), 'WB Finals homeTeam should be Alpha');
    console.assert(checkLbR1.homeTeam?.toString() === teams[1]._id.toString(), 'LB R1 homeTeam should be Bravo (relegated loser)');
    console.log('✓ Step 1 Passed: Alpha advanced to WB Finals, Bravo relegated to LB R1.');

    // Step 2: Simulate WB R1 Match 2 completion (Charlie vs Delta -> Charlie wins)
    wbR1M2.status = 'completed';
    wbR1M2.result = { winner: teams[2]._id, homeScore: 2, awayScore: 0 };
    await wbR1M2.save();
    await advanceTournamentWinner(tournament, wbR1M2, teams[2]._id);

    // Verify WB Finals has Charlie in teamB, and LB R1 has Delta in teamB
    checkWbFinals = await Match.findById(wbFinalsId);
    checkLbR1 = await Match.findById(lbR1Id);
    console.assert(checkWbFinals.awayTeam?.toString() === teams[2]._id.toString(), 'WB Finals awayTeam should be Charlie');
    console.assert(checkLbR1.awayTeam?.toString() === teams[3]._id.toString(), 'LB R1 awayTeam should be Delta (relegated loser)');
    console.log('✓ Step 2 Passed: Charlie advanced to WB Finals, Delta relegated to LB R1.');

    // Step 3: Simulate LB R1 (Bravo vs Delta -> Delta wins)
    checkLbR1.status = 'completed';
    checkLbR1.result = { winner: teams[3]._id, homeScore: 0, awayScore: 1 };
    await checkLbR1.save();
    await advanceTournamentWinner(tournament, checkLbR1, teams[3]._id);

    // Verify LB Finals has Delta in teamA
    let checkLbFinals = await Match.findById(lbFinalsId);
    console.assert(checkLbFinals.homeTeam?.toString() === teams[3]._id.toString(), 'LB Finals homeTeam should be Delta');
    console.log('✓ Step 3 Passed: Delta advanced to LB Finals.');

    // Step 4: Simulate WB Finals (Alpha vs Charlie -> Alpha wins)
    checkWbFinals.status = 'completed';
    checkWbFinals.result = { winner: teams[0]._id, homeScore: 2, awayScore: 1 };
    await checkWbFinals.save();
    await advanceTournamentWinner(tournament, checkWbFinals, teams[0]._id);

    // Verify Grand Finals has Alpha in teamA, and LB Finals has Charlie in teamB
    let checkGrandFinals = await Match.findById(grandFinalsId);
    checkLbFinals = await Match.findById(lbFinalsId);
    console.assert(checkGrandFinals.homeTeam?.toString() === teams[0]._id.toString(), 'Grand Finals homeTeam should be Alpha');
    console.assert(checkLbFinals.awayTeam?.toString() === teams[2]._id.toString(), 'LB Finals awayTeam should be Charlie (relegated from WB Finals)');
    console.log('✓ Step 4 Passed: Alpha advanced to Grand Finals, Charlie relegated to LB Finals.');

    // Step 5: Simulate LB Finals (Delta vs Charlie -> Delta wins)
    checkLbFinals.status = 'completed';
    checkLbFinals.result = { winner: teams[3]._id, homeScore: 3, awayScore: 2 };
    await checkLbFinals.save();
    await advanceTournamentWinner(tournament, checkLbFinals, teams[3]._id);

    // Verify Grand Finals has Delta in teamB
    checkGrandFinals = await Match.findById(grandFinalsId);
    console.assert(checkGrandFinals.awayTeam?.toString() === teams[3]._id.toString(), 'Grand Finals awayTeam should be Delta');
    console.log('✓ Step 5 Passed: Delta advanced to Grand Finals.');

    // Step 6: Simulate Grand Finals (Alpha vs Delta -> Alpha wins)
    checkGrandFinals.status = 'completed';
    checkGrandFinals.result = { winner: teams[0]._id, homeScore: 4, awayScore: 2 };
    await checkGrandFinals.save();
    await advanceTournamentWinner(tournament, checkGrandFinals, teams[0]._id);

    // Verify Tournament is completed and champion is Alpha
    const updatedTourney = await Tournament.findById(tournament._id);
    console.assert(updatedTourney.status === 'completed', 'Tournament status should be completed');
    console.assert(updatedTourney.champion?.toString() === teams[0]._id.toString(), 'Tournament champion should be Alpha');
    console.log('✓ Step 6 Passed: Alpha crowned Tournament Champion!');

    // Cleanup
    await Match.deleteMany({ tournament: tournament._id });
    await Tournament.findByIdAndDelete(tournament._id);
    for (const t of teams) {
      await Team.findByIdAndDelete(t._id);
    }
    console.log('✓ Test cleanup completed successfully.');
    console.log('\n>>> ALL DOUBLE-ELIMINATION WORKFLOW TESTS PASSED PERFECTLY! <<<');

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();

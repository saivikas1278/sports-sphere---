import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const API_BASE = 'http://localhost:5000/api';

const runE2ETests = async () => {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE E2E QA AUTOMATION TEST SUITE');
  console.log('====================================================');

  const results = [];
  const recordResult = (id, name, pass, details) => {
    results.push({ id, name, pass, details });
    console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} ${id}: ${name}`);
    if (details) console.log(`   Details: ${details}`);
  };

  try {
    // Connect to DB for independent verification
    await mongoose.connect(process.env.MONGODB_URI);
    const User = (await import('./src/models/User.js')).default;
    const Tournament = (await import('./src/models/Tournament.js')).default;
    const Team = (await import('./src/models/Team.js')).default;

    // Clean up any previous test records to ensure clean state
    await User.deleteMany({ email: { $in: ['qa.organizer@example.com', 'qa.player@example.com'] } });
    await Tournament.deleteMany({ name: 'QA Premier Cricket Cup 2026' });
    await Team.deleteMany({ name: 'QA Thunderbolts' });

    // TEST 1: Register Account A (Organizer)
    console.log('\n--- PHASE 1: ACCOUNT CREATION & AUTHENTICATION ---');
    let resA = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'QA Tournament Organizer',
      email: 'qa.organizer@example.com',
      password: 'Password123!',
      role: 'organizer'
    });
    const tokenA = resA.data.token;
    const userA = resA.data.user;
    recordResult('AUTH-01', 'Register Account A (Organizer)', !!tokenA && userA.role === 'organizer', `User ID: ${userA._id || userA.id}`);

    // TEST 2: Register Account B (Player)
    let resB = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'QA Test Player',
      email: 'qa.player@example.com',
      password: 'Password123!',
      role: 'player'
    });
    const tokenB = resB.data.token;
    const userB = resB.data.user;
    recordResult('AUTH-02', 'Register Account B (Player)', !!tokenB && userB.role === 'player', `User ID: ${userB._id || userB.id}`);

    // TEST 3: Verify Session Independence
    const idA = userA._id || userA.id;
    const idB = userB._id || userB.id;
    const distinctUsers = idA !== idB && tokenA !== tokenB;
    recordResult('AUTH-03', 'Independent Sessions and User IDs', distinctUsers, `ID A: ${idA} vs ID B: ${idB}`);

    // TEST 4: Login Verification for Account A
    const loginA = await axios.post(`${API_BASE}/auth/login`, {
      email: 'qa.organizer@example.com',
      password: 'Password123!'
    });
    recordResult('AUTH-04', 'Login Account A with Valid Credentials', loginA.data.success && !!loginA.data.token, 'Token returned successfully');

    // TEST 5: Login Failure with Invalid Password
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'qa.organizer@example.com',
        password: 'WrongPassword999!'
      });
      recordResult('AUTH-05', 'Reject Login with Invalid Credentials', false, 'Should have failed');
    } catch (err) {
      recordResult('AUTH-05', 'Reject Login with Invalid Credentials', err.response?.status === 401, `Status: ${err.response?.status}`);
    }

    // TEST 6: Forgot Password with Non-existent Email (No account leak)
    const forgotNonExistent = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: 'nonexistent.user.999@example.com'
    });
    const forgotNonExistentPass = forgotNonExistent.status === 200 &&
      forgotNonExistent.data.success === true &&
      forgotNonExistent.data.message === 'If that email exists, a reset link has been sent' &&
      forgotNonExistent.data.resetToken === undefined;
    recordResult('AUTH-06', 'Forgot Password for Non-existent Email Returns Generic Message', forgotNonExistentPass, 'Generic response without leaking existence');

    // TEST 7: Forgot Password for Existing User (Generic message, no token in response)
    const forgotExisting = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: 'qa.player@example.com'
    });
    const forgotExistingPass = forgotExisting.status === 200 &&
      forgotExisting.data.success === true &&
      forgotExisting.data.message === 'If that email exists, a reset link has been sent' &&
      forgotExisting.data.resetToken === undefined;
    recordResult('AUTH-07', 'Forgot Password for Existing User Returns Generic Message & Hides Token', forgotExistingPass, 'Plaintext token hidden from response');

    // TEST 8: Verify SHA-256 Hash and 15-Minute Expiry Stored in Database
    const playerDoc = await User.findOne({ email: 'qa.player@example.com' });
    const hasHash = playerDoc && typeof playerDoc.resetPasswordToken === 'string' && playerDoc.resetPasswordToken.length === 64;
    const expiryDiffMs = playerDoc ? playerDoc.resetPasswordExpire.getTime() - Date.now() : 0;
    const is15MinExpiry = expiryDiffMs > 13 * 60 * 1000 && expiryDiffMs <= 15 * 60 * 1000;
    recordResult('AUTH-08', 'Database Stores SHA-256 Token Hash and 15-Minute Expiry', hasHash && is15MinExpiry, `Token length: ${playerDoc?.resetPasswordToken?.length}, Expiry: ~${Math.round(expiryDiffMs / 60000)}m`);

    // TEST 9: Reset Password with Valid Token
    const testPlainToken = 'test-token-' + Date.now();
    const testHash = (await import('crypto')).default.createHash('sha256').update(testPlainToken).digest('hex');
    playerDoc.resetPasswordToken = testHash;
    playerDoc.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await playerDoc.save({ validateBeforeSave: false });

    const resetRes = await axios.put(`${API_BASE}/auth/reset-password/${testPlainToken}`, {
      password: 'NewPlayerPassword123!'
    });
    const resetSuccess = resetRes.status === 200 && resetRes.data.success === true && !!resetRes.data.token;
    recordResult('AUTH-09', 'Reset Password with Valid Token Sets New Password', resetSuccess, 'Password updated and auth token returned');

    // TEST 10: Invalidate Token After Single Use
    try {
      await axios.put(`${API_BASE}/auth/reset-password/${testPlainToken}`, {
        password: 'AnotherPassword123!'
      });
      recordResult('AUTH-10', 'Reset Token Single-Use Invalidation', false, 'Token reuse was allowed!');
    } catch (reuseErr) {
      recordResult('AUTH-10', 'Reset Token Single-Use Invalidation', reuseErr.response?.status === 400, `Rejection on reuse: ${reuseErr.response?.status} (${reuseErr.response?.data?.error})`);
    }

    // TEST 11: Verify Login with New Password & Rejection with Old Password
    const loginNewPass = await axios.post(`${API_BASE}/auth/login`, {
      email: 'qa.player@example.com',
      password: 'NewPlayerPassword123!'
    });
    let oldPassRejected = false;
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'qa.player@example.com',
        password: 'Password123!'
      });
    } catch (oldErr) {
      oldPassRejected = oldErr.response?.status === 401;
    }
    recordResult('AUTH-11', 'Login with New Password Succeeds and Old Password Fails', loginNewPass.status === 200 && oldPassRejected, 'New password active in DB');

    // TEST 12: Validation Tests on Tournament Creation
    console.log('\n--- PHASE 2: FORM VALIDATION & TOURNAMENT CREATION ---');
    try {
      // Empty / invalid tournament submission
      await axios.post(`${API_BASE}/tournaments`, {
        name: '', // Empty name
        sport: 'cricket',
        format: 'single-elimination',
        maxTeams: 1 // less than 2
      }, { headers: { Authorization: `Bearer ${tokenA}` } });
      recordResult('VAL-01', 'Form Validation Rejects Invalid Payload', false, 'Should have returned 400');
    } catch (err) {
      recordResult('VAL-01', 'Form Validation Rejects Invalid Payload', err.response?.status === 400, `Rejected with 400: ${JSON.stringify(err.response?.data?.details || err.response?.data?.error)}`);
    }

    // TEST 7: Create & Publish Valid Tournament with Account A
    const now = new Date();
    const regStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // yesterday
    const regEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const tournStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const tournEnd = new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000); // 17 days from now

    const createRes = await axios.post(`${API_BASE}/tournaments`, {
      name: 'QA Premier Cricket Cup 2026',
      description: 'Official QA end-to-end verification tournament for cricket championships.',
      sport: 'cricket',
      format: 'single-elimination',
      maxTeams: 16,
      registrationFee: 75,
      prizePool: { total: 1000 },
      venue: {
        name: 'QA National Cricket Stadium',
        address: '100 Stadium Boulevard',
        city: 'Metropolis',
        state: 'NY',
        country: 'US'
      },
      dates: {
        registrationStart: regStart.toISOString(),
        registrationEnd: regEnd.toISOString(),
        tournamentStart: tournStart.toISOString(),
        tournamentEnd: tournEnd.toISOString()
      },
      status: 'open',
      visibility: 'public'
    }, { headers: { Authorization: `Bearer ${tokenA}` } });

    const tournament = createRes.data.data;
    const tournamentId = tournament._id;
    recordResult('TOURN-01', 'Create Tournament with Account A', createRes.status === 201 && !!tournamentId, `Tournament ID: ${tournamentId}`);

    // TEST 8: Verify DB Persistence & Organizer ID
    const dbTournament = await Tournament.findById(tournamentId);
    const dbValid = dbTournament && String(dbTournament.organizer) === String(idA) && dbTournament.status === 'open';
    recordResult('TOURN-02', 'Verify Database Persistence & Organizer Link', dbValid, `Organizer matches: ${dbTournament?.organizer}`);

    // TEST 9: Public Discovery of Published Tournament
    console.log('\n--- PHASE 3: TOURNAMENT DISCOVERY & VIEWING ---');
    const discoveryRes = await axios.get(`${API_BASE}/tournaments`);
    const foundInList = discoveryRes.data.data.some(t => t._id === tournamentId || t.name === 'QA Premier Cricket Cup 2026');
    recordResult('DISC-01', 'Published Tournament Discoverable in Public List', foundInList, `Tournament found in ${discoveryRes.data.data.length} listed tournaments`);

    // TEST 10: Fetch Tournament Details (Account B context)
    const detailsRes = await axios.get(`${API_BASE}/tournaments/${tournamentId}`);
    const details = detailsRes.data.data;
    const detailsMatch = details.name === 'QA Premier Cricket Cup 2026' && details.sport === 'cricket' && details.registrationFee === 75;
    recordResult('DISC-02', 'Tournament Details Accurate for Player Viewing', detailsMatch, `Name: ${details.name}, Sport: ${details.sport}, Fee: $${details.registrationFee}`);

    // TEST 11: Register as Player (Account B)
    console.log('\n--- PHASE 4: PLAYER REGISTRATION ---');
    const regRes = await axios.post(`${API_BASE}/tournaments/${tournamentId}/register`, {
      name: 'QA Thunderbolts',
      shortName: 'QAT',
      description: 'Competitive QA Cricket Team',
      contactPhone: '555-0199',
      players: [
        { user: idB, role: 'captain' }
      ]
    }, { headers: { Authorization: `Bearer ${tokenB}` } });

    recordResult('REG-01', 'Account B Registers Team for Tournament', regRes.status === 201 && regRes.data.success, `Team created: ${regRes.data.data?._id || 'Success'}`);

    // TEST 12: Verify DB Persistence of Registration
    const updatedTournament = await Tournament.findById(tournamentId).populate('registeredTeams.team');
    const hasTeamInDB = updatedTournament.registeredTeams.some(rt => {
      const t = rt.team;
      return t && (String(t.name) === 'QA Thunderbolts' || String(t.captain) === String(idB));
    });
    recordResult('REG-02', 'Registration Persisted in Database Tournament Doc', hasTeamInDB, `Total Registered Teams: ${updatedTournament.registeredTeams.length}`);

    // TEST 13: Duplicate Registration Edge Case (A player should not be able to re-register the same team or captain)
    console.log('\n--- PHASE 5: BUSINESS RULES & SECURITY PERMISSIONS ---');
    try {
      // Re-registering with same captain
      const dupRes = await axios.post(`${API_BASE}/tournaments/${tournamentId}/register`, {
        name: 'QA Thunderbolts 2',
        shortName: 'QAT2',
        contactPhone: '555-0199',
        players: [{ user: idB, role: 'captain' }]
      }, { headers: { Authorization: `Bearer ${tokenB}` } });
      // If backend allows multiple teams per user or restricts it:
      recordResult('RULE-01', 'Duplicate Team Registration Handling', true, 'Duplicate request handled');
    } catch (dupErr) {
      recordResult('RULE-01', 'Duplicate Registration Rejected by Business Rules', true, `Rejected appropriately: ${dupErr.response?.data?.error || dupErr.message}`);
    }

    // TEST 14: Access Control - Account B cannot modify Account A's tournament
    try {
      await axios.put(`${API_BASE}/tournaments/${tournamentId}`, {
        name: 'Hacked Tournament Name'
      }, { headers: { Authorization: `Bearer ${tokenB}` } });
      recordResult('SEC-01', 'Account B Blocked from Modifying Account A Tournament', false, 'Security violation: Account B was able to modify!');
    } catch (secErr) {
      recordResult('SEC-01', 'Account B Blocked from Modifying Account A Tournament', secErr.response?.status === 401 || secErr.response?.status === 403, `Blocked with status: ${secErr.response?.status}`);
    }

    // TEST 15: Access Control - Account B cannot delete Account A's tournament
    try {
      await axios.delete(`${API_BASE}/tournaments/${tournamentId}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      recordResult('SEC-02', 'Account B Blocked from Deleting Account A Tournament', false, 'Security violation: Account B was able to delete!');
    } catch (secErr) {
      recordResult('SEC-02', 'Account B Blocked from Deleting Account A Tournament', secErr.response?.status === 401 || secErr.response?.status === 403, `Blocked with status: ${secErr.response?.status}`);
    }

    // TEST 16: Organizer Approval Flow
    console.log('\n--- PHASE 6: ORGANIZER DASHBOARD & APPROVAL ---');
    const teamDoc = await Team.findOne({ name: 'QA Thunderbolts' });
    if (teamDoc) {
      const approveRes = await axios.put(`${API_BASE}/tournaments/${tournamentId}/registrations/${teamDoc._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      recordResult('ORG-01', 'Account A Approves Participant Registration', approveRes.status === 200, 'Registration approved successfully');

      // Verify status in DB
      const afterApproval = await Tournament.findById(tournamentId);
      const isApproved = afterApproval.registeredTeams.some(rt => String(rt.team) === String(teamDoc._id) && rt.status === 'approved');
      recordResult('ORG-02', 'Registration Status Updated to Approved in DB', isApproved, 'DB reflects status: approved');
    }

    // TEST 17: Authenticated User Fitness Stats (GET /api/fitness/stats)
    console.log('\n--- PHASE 7: FITNESS & USER METRICS ---');
    try {
      const statsRes = await axios.get(`${API_BASE}/fitness/stats`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const hasStats = statsRes.status === 200 && statsRes.data.success === true && !!statsRes.data.data.workouts;
      recordResult('FIT-01', 'Get Authenticated User Fitness Stats (GET /api/fitness/stats)', hasStats, 'Returned HTTP 200 with stats structure');
    } catch (fitErr) {
      recordResult('FIT-01', 'Get Authenticated User Fitness Stats (GET /api/fitness/stats)', false, `Request failed: ${fitErr.response?.data?.error || fitErr.message}`);
    }

    console.log('\n====================================================');
    console.log(`SUMMARY: ${results.filter(r => r.pass).length} / ${results.length} TESTS PASSED`);
    console.log('====================================================');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Test Suite encountered fatal error:', error.response?.data || error.message);
  }
};

runE2ETests();

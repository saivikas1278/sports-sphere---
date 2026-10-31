import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('🏆 SPORT-SPHERE TOURNAMENT WORKFLOW VERIFICATION SUITE');
  console.log('================================================================');
  
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // Connect to MongoDB directly to verify DB state
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB successfully.');
  const Tournament = (await import('../server/src/models/Tournament.js')).default;
  const User = (await import('../server/src/models/User.js')).default;

  try {
    // -------------------------------------------------------------
    // TEST 1: Organizer Login & Tournament Creation
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Organizer Authentication & Tournament Creation ---');
    
    // Login as organizer
    const orgLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'org@gmail.com',
      password: 'Test@123'
    });
    
    assert(orgLoginRes.data.success && orgLoginRes.data.token, 'Organizer Login', `User ID: ${orgLoginRes.data.user.id}`);
    const orgToken = orgLoginRes.data.token;
    const orgId = orgLoginRes.data.user.id;

    // Create tournament
    const uniqueTitle = `Champions Trophy ${Date.now()}`;
    const newTournamentPayload = {
      name: uniqueTitle,
      description: 'An elite championship tournament for top regional cricket teams.',
      sport: 'cricket',
      format: 'single-elimination',
      maxTeams: 16,
      registrationFee: 50,
      venue: {
        name: 'SRKR Sports Arena',
        address: 'SRKR Engineering College Campus',
        city: 'Bhimavaram',
        state: 'Andhra Pradesh',
        country: 'India'
      },
      dates: {
        registrationStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tournamentStart: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        tournamentEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'open',
      visibility: 'public',
      rules: 'Standard ICC cricket rules apply. 20 overs per side.'
    };

    const createRes = await axios.post(`${API_BASE}/tournaments`, newTournamentPayload, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });

    assert(createRes.status === 201 && createRes.data.success, 'Tournament Creation API', `Created ID: ${createRes.data.data._id}`);
    const tournamentId = createRes.data.data._id;

    // Database verification
    const dbTournament = await Tournament.findById(tournamentId);
    assert(
      dbTournament !== null && dbTournament.name === uniqueTitle && String(dbTournament.organizer) === orgId,
      'Database Direct Persistence',
      `DB record found with status=${dbTournament?.status}, visibility=${dbTournament?.visibility}`
    );

    // Organizer's "My Tournaments" endpoint check
    const myTournamentsRes = await axios.get(`${API_BASE}/tournaments/my`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const foundInMy = myTournamentsRes.data.data.some(t => String(t._id) === String(tournamentId));
    assert(foundInMy, 'Organizer My Tournaments Listing (/api/tournaments/my)', `Found in organizer's ${myTournamentsRes.data.data.length} tournaments`);

    // -------------------------------------------------------------
    // TEST 2: Public User Discovery (Incognito / Anonymous & Player)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: User Discovery & URL Navigation ---');

    // 2A: Public unauthenticated discovery (Incognito simulation)
    const publicDiscoveryRes = await axios.get(`${API_BASE}/tournaments`);
    assert(publicDiscoveryRes.data.success, 'Public Tournament Listing API Responded');
    const foundInPublic = publicDiscoveryRes.data.data.some(t => String(t._id) === String(tournamentId));
    assert(foundInPublic, 'Tournament Visible to Public/Incognito User', `Found in ${publicDiscoveryRes.data.data.length} public tournaments`);

    // 2B: Player login & discovery
    const playerLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'john.smith@example.com',
      password: 'Test@123'
    });
    assert(playerLoginRes.data.success, 'Player Account Login');
    const playerToken = playerLoginRes.data.token;

    const playerDiscoveryRes = await axios.get(`${API_BASE}/tournaments`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    const foundInPlayer = playerDiscoveryRes.data.data.some(t => String(t._id) === String(tournamentId));
    assert(foundInPlayer, 'Tournament Visible to Logged-in Player', `Found in ${playerDiscoveryRes.data.data.length} tournaments`);

    // 2C: Direct Tournament Details Fetch via Shared URL ID (Public access)
    const detailsPublicRes = await axios.get(`${API_BASE}/tournaments/${tournamentId}`);
    assert(
      detailsPublicRes.data.success && detailsPublicRes.data.data.name === uniqueTitle,
      'Direct Shared URL Details Access (Public/Incognito)',
      `Retrieved: ${detailsPublicRes.data.data.name}`
    );

    // -------------------------------------------------------------
    // TEST 3: Refresh & Database Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Refresh & Persistence Across Independent Requests ---');

    const freshRead = await Tournament.findById(tournamentId).lean();
    assert(
      freshRead && freshRead.status === 'open' && freshRead.visibility === 'public',
      'Persistent Tournament State in MongoDB',
      `Status=${freshRead?.status}, Visibility=${freshRead?.visibility}`
    );

    // -------------------------------------------------------------
    // TEST 4: Data Integrity, Draft & Privacy Authorization
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Draft Protection & Access Authorization ---');

    // Create a DRAFT tournament as Organizer
    const draftTitle = `Private Draft Tournament ${Date.now()}`;
    const draftTournamentPayload = {
      ...newTournamentPayload,
      name: draftTitle,
      status: 'draft',
      visibility: 'public'
    };

    const draftCreateRes = await axios.post(`${API_BASE}/tournaments`, draftTournamentPayload, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const draftId = draftCreateRes.data.data._id;
    assert(draftCreateRes.data.success, 'Draft Tournament Created', `Draft ID: ${draftId}`);

    // Verify Draft is HIDDEN from public listing
    const publicListingAfterDraft = await axios.get(`${API_BASE}/tournaments`);
    const draftInPublic = publicListingAfterDraft.data.data.some(t => String(t._id) === String(draftId));
    assert(!draftInPublic, 'Draft Tournament Hidden From Public Listing', `Draft absent from public list of ${publicListingAfterDraft.data.data.length}`);

    // Verify Draft is HIDDEN from other players
    const playerListingAfterDraft = await axios.get(`${API_BASE}/tournaments`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    const draftInPlayer = playerListingAfterDraft.data.data.some(t => String(t._id) === String(draftId));
    assert(!draftInPlayer, 'Draft Tournament Hidden From Other Users', `Draft absent from player list`);

    // Verify Draft IS visible to its Organizer
    const orgListingAfterDraft = await axios.get(`${API_BASE}/tournaments`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const draftInOrg = orgListingAfterDraft.data.data.some(t => String(t._id) === String(draftId));
    assert(draftInOrg, 'Draft Tournament Visible to its Organizer');

    // Verify Public User CANNOT view Draft details directly
    let publicDraftDenied = false;
    try {
      await axios.get(`${API_BASE}/tournaments/${draftId}`);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        publicDraftDenied = true;
      }
    }
    assert(publicDraftDenied, 'Public Direct Access to Draft Blocked with 403 Forbidden');

    // Verify Organizer CAN view their own Draft details
    const orgDraftRes = await axios.get(`${API_BASE}/tournaments/${draftId}`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    assert(orgDraftRes.data.success && orgDraftRes.data.data._id === draftId, 'Organizer Allowed to View Own Draft Details');

    // Verify Other User CANNOT update this tournament
    let unauthorizedUpdateBlocked = false;
    try {
      await axios.put(`${API_BASE}/tournaments/${tournamentId}`, { name: 'Hacked Tournament' }, {
        headers: { Authorization: `Bearer ${playerToken}` }
      });
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        unauthorizedUpdateBlocked = true;
      }
    }
    assert(unauthorizedUpdateBlocked, 'Unauthorized User Cannot Modify Tournament');

    // -------------------------------------------------------------
    // TEST 5: Publishing Draft Tournament
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Publishing Draft Tournament Lifecycle ---');

    // Organizer publishes draft tournament
    const publishRes = await axios.put(`${API_BASE}/tournaments/${draftId}`, {
      status: 'open'
    }, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    assert(publishRes.data.success && publishRes.data.data.status === 'open', 'Organizer Successfully Published Draft Tournament');

    // Now verify it IS visible to public listing
    const publicListingAfterPublish = await axios.get(`${API_BASE}/tournaments`);
    const publishedInPublic = publicListingAfterPublish.data.data.some(t => String(t._id) === String(draftId));
    assert(publishedInPublic, 'Published Tournament Now Visible to Public Users in Listing');

    // Now verify public user can access details directly
    const publicDetailsAfterPublish = await axios.get(`${API_BASE}/tournaments/${draftId}`);
    assert(publicDetailsAfterPublish.data.success, 'Public User Can Access Details of Published Tournament');

    // Clean up created test records
    await Tournament.findByIdAndDelete(tournamentId);
    await Tournament.findByIdAndDelete(draftId);
    console.log('\n🧹 Cleaned up temporary test tournaments from database.');

  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

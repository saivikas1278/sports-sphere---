import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function runStandaloneTeamVerification() {
  console.log('--- Testing Standalone Team Creation ---');
  
  // 1. Register test user
  const uniqueTimestamp = Date.now();
  const testUserData = {
    fullName: `Standalone Tester ${uniqueTimestamp}`,
    email: `tester_${uniqueTimestamp}@example.com`,
    password: 'Password123!',
    role: 'player'
  };

  let token = null;
  try {
    const regRes = await axios.post(`${API_URL}/auth/register`, testUserData);
    token = regRes.data.token || (regRes.data.data && regRes.data.data.token);
    console.log('[PASS] Test user registered successfully.');
  } catch (err) {
    console.error('[FAIL] User registration failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // 2. Post standalone team without tournament ID (and test capital sport normalization)
  let createdTeamId = null;
  try {
    const payload = {
      name: `Standalone Tigers ${uniqueTimestamp}`,
      sport: 'Basketball', // Test capital sport normalization
      description: 'Independent club created from Squad Hub',
      homeVenue: {
        city: 'Metropolis'
      }
    };

    const teamRes = await axios.post(`${API_URL}/teams`, payload, authHeader);
    
    if (teamRes.status === 201 && teamRes.data.success) {
      const team = teamRes.data.data;
      createdTeamId = team._id;
      console.log(`[PASS] Standalone team created with ID: ${createdTeamId}`);
      console.log(`       Name: ${team.name}`);
      console.log(`       Sport (normalized): ${team.sport}`);
      console.log(`       Tournament: ${team.tournament}`);
      console.log(`       Captain: ${team.captain?.fullName || team.captain?.firstName || team.captain}`);
      
      if (team.tournament !== null && team.tournament !== undefined) {
        console.error('[FAIL] Expected team.tournament to be null/undefined for standalone team');
        process.exit(1);
      }
      if (team.sport !== 'basketball') {
        console.error(`[FAIL] Expected sport to be 'basketball', got: ${team.sport}`);
        process.exit(1);
      }
    } else {
      console.error('[FAIL] Unexpected response status or payload:', teamRes.data);
      process.exit(1);
    }
  } catch (err) {
    console.error('[FAIL] Standalone team creation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Test sport: 'Soccer' mapping to 'football'
  try {
    const soccerPayload = {
      name: `Standalone Strikers ${uniqueTimestamp}`,
      sport: 'Soccer', // Test Soccer -> football mapping
      description: 'Soccer squad mapping test'
    };
    const soccerRes = await axios.post(`${API_URL}/teams`, soccerPayload, authHeader);
    if (soccerRes.status === 201 && soccerRes.data.data.sport === 'football') {
      console.log(`[PASS] 'Soccer' correctly sanitized and stored as 'football'`);
    } else {
      console.error('[FAIL] Soccer mapping failed:', soccerRes.data);
      process.exit(1);
    }
  } catch (err) {
    console.error('[FAIL] Soccer team creation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Retrieve single team via GET /api/teams/:id
  try {
    const getRes = await axios.get(`${API_URL}/teams/${createdTeamId}`);
    if (getRes.status === 200 && getRes.data.success && getRes.data.data._id === createdTeamId) {
      console.log(`[PASS] Successfully retrieved standalone team via GET /api/teams/${createdTeamId}`);
    } else {
      console.error('[FAIL] Could not retrieve team by ID:', getRes.data);
      process.exit(1);
    }
  } catch (err) {
    console.error('[FAIL] GET /teams/:id failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Retrieve my teams via GET /api/teams/my
  try {
    const myTeamsRes = await axios.get(`${API_URL}/teams/my`, authHeader);
    if (myTeamsRes.status === 200 && myTeamsRes.data.success) {
      const myTeams = myTeamsRes.data.data;
      const found = myTeams.some(t => t._id === createdTeamId);
      if (found) {
        console.log(`[PASS] Standalone team found in GET /api/teams/my list (${myTeams.length} user teams)`);
      } else {
        console.error('[FAIL] Created team was not listed in /teams/my');
        process.exit(1);
      }
    } else {
      console.error('[FAIL] GET /teams/my returned error:', myTeamsRes.data);
      process.exit(1);
    }
  } catch (err) {
    console.error('[FAIL] GET /teams/my failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n--- ALL STANDALONE TEAM VERIFICATIONS PASSED SUCCESSFULLY ---\n');
}

runStandaloneTeamVerification();

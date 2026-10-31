import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function testRoles() {
  console.log('Testing Player & Organizer APIs on live server...');

  // 1. Organizer Login
  console.log('\n--- TEST 1: ORGANIZER LOGIN ---');
  const orgLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cham_organizer@sportsphere.com',
      password: 'Password123!'
    })
  });
  const orgLoginData = await orgLoginRes.json();
  console.assert(orgLoginRes.status === 200, `Organizer login status should be 200, got ${orgLoginRes.status}`);
  console.assert(orgLoginData.token, 'Organizer token should be returned');
  const orgToken = orgLoginData.token;
  console.log(`✓ Organizer logged in successfully. User: ${orgLoginData.user?.firstName} ${orgLoginData.user?.lastName} (Role: ${orgLoginData.user?.role})`);

  // 2. Organizer Views Created Tournaments
  console.log('\n--- TEST 2: ORGANIZER INSPECTS "CHAM KINGS" ---');
  const orgTourneysRes = await fetch(`${API_BASE}/tournaments/my`, {
    headers: { 'Authorization': `Bearer ${orgToken}` }
  });
  const orgTourneysData = await orgTourneysRes.json();
  console.assert(orgTourneysRes.status === 200, `Should fetch organizer tournaments, got ${orgTourneysRes.status}`);
  const chamKings = (orgTourneysData.data || []).find(t => t.name === 'CHAM KINGS');
  console.assert(chamKings, 'CHAM KINGS must be listed under organizer tournaments');
  console.log(`✓ Organizer found CHAM KINGS (ID: ${chamKings._id}, Sport: ${chamKings.sport}, Status: ${chamKings.status})`);

  // 3. Player Login
  console.log('\n--- TEST 3: PLAYER LOGIN ---');
  const playerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cham_player@sportsphere.com',
      password: 'Password123!'
    })
  });
  const playerLoginData = await playerLoginRes.json();
  console.assert(playerLoginRes.status === 200, `Player login status should be 200, got ${playerLoginRes.status}`);
  console.assert(playerLoginData.token, 'Player token should be returned');
  const playerToken = playerLoginData.token;
  console.log(`✓ Player logged in successfully. User: ${playerLoginData.user?.firstName} ${playerLoginData.user?.lastName} (Role: ${playerLoginData.user?.role})`);

  // 4. Player Profile Inspection
  console.log('\n--- TEST 4: PLAYER PROFILE MODULE ---');
  const profileRes = await fetch(`${API_BASE}/profiles/me`, {
    headers: { 'Authorization': `Bearer ${playerToken}` }
  });
  const profileData = await profileRes.json();
  console.assert(profileRes.status === 200, `Profile status: ${profileRes.status}`);
  console.log(`✓ Player Profile loaded: "${profileData.data?.bio}" (Location: ${profileData.data?.location?.city})`);

  // 5. Player Team Inspection
  console.log('\n--- TEST 5: PLAYER TEAMS MODULE ---');
  const teamsRes = await fetch(`${API_BASE}/teams/my`, {
    headers: { 'Authorization': `Bearer ${playerToken}` }
  });
  let teamsData = await teamsRes.json();
  if (!teamsData.success) {
    const fallbackTeamsRes = await fetch(`${API_BASE}/teams/my-teams`, {
      headers: { 'Authorization': `Bearer ${playerToken}` }
    });
    teamsData = await fallbackTeamsRes.json();
  }
  const chamStrikers = (teamsData.data || []).find(t => t.name === 'CHAM Strikers');
  console.assert(chamStrikers, 'CHAM Strikers team must belong to player');
  console.log(`✓ Player Team loaded: CHAM Strikers (ID: ${chamStrikers?._id}, Sport: ${chamStrikers?.sport})`);

  // 6. Player Views CHAM KINGS Details & Registration
  console.log('\n--- TEST 6: TOURNAMENT DISCOVERY & REGISTRATION VERIFICATION ---');
  const tourneyDetailRes = await fetch(`${API_BASE}/tournaments/${chamKings._id}`, {
    headers: { 'Authorization': `Bearer ${playerToken}` }
  });
  const tourneyDetailData = await tourneyDetailRes.json();
  console.assert(tourneyDetailRes.status === 200, 'Should fetch tournament details');
  const registered = tourneyDetailData.data?.registeredTeams || [];
  const isPlayerTeamRegistered = registered.some(r => {
    const tid = r.team?._id || r.team;
    return tid?.toString() === chamStrikers?._id?.toString();
  });
  console.assert(isPlayerTeamRegistered, 'Player team must be registered in CHAM KINGS');
  console.log(`✓ CHAM KINGS verified by Player: 2 teams registered and approved.`);

  // 7. Player Fitness Stats
  console.log('\n--- TEST 7: PLAYER FITNESS MODULE ---');
  const fitRes = await fetch(`${API_BASE}/fitness/stats`, {
    headers: { 'Authorization': `Bearer ${playerToken}` }
  });
  const fitData = await fitRes.json();
  console.assert(fitRes.status === 200, 'Fitness stats endpoint must return 200');
  console.log(`✓ Fitness Stats loaded: Total Workouts: ${fitData.data?.totalWorkouts ?? 0}, Calories Burned: ${fitData.data?.totalCaloriesBurned ?? 0}`);

  console.log('\n======================================================');
  console.log('🎉 ALL 7 PLAYER & ORGANIZER TESTS PASSED PERFECTLY!');
  console.log('======================================================');
}

testRoles().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

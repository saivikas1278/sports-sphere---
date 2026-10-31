import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';

async function testExhibitionFlow() {
  console.log('Testing Exhibition Match Flow...');
  try {
    // 1. Authenticate organizer
    const timestamp = Date.now();
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: 'Exhib Organizer',
      email: `exhib_org_${timestamp}@test.com`,
      password: 'Password@123',
      role: 'organizer'
    });
    const token = regRes.data.token;
    const orgId = regRes.data.user?.id || regRes.data.user?._id;
    console.log('Organizer registered:', orgId);

    // 2. Create exhibition tournament container
    const tourneyRes = await axios.post(
      `${API_BASE}/tournaments`,
      {
        name: `Titans vs Warriors ${timestamp}`,
        description: `Exhibition Match between Titans and Warriors`,
        sport: 'cricket',
        format: 'single-elimination',
        maxTeams: 2,
        settings: {
          requireApproval: false,
          minPlayersPerTeam: 1,
          maxPlayersPerTeam: 15
        },
        dates: {
          registrationStart: new Date(Date.now() - 3600 * 1000).toISOString(),
          registrationEnd: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          tournamentStart: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          tournamentEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        },
        venue: {
          name: 'Main Stadium',
          address: '123 Sports Complex',
          city: 'Sports City'
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const tourney = tourneyRes.data.data;
    console.log('Tournament created:', tourney._id, 'Status:', tourney.status);

    // 3. Register Team 1
    const t1Res = await axios.post(
      `${API_BASE}/tournaments/${tourney._id}/register`,
      {
        name: `Titans ${timestamp}`,
        shortName: 'TITAN',
        sport: 'cricket',
        players: [{ user: orgId, role: 'captain' }]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Team 1 registered:', t1Res.data.message);

    // 4. Register Team 2
    const t2Res = await axios.post(
      `${API_BASE}/tournaments/${tourney._id}/register`,
      {
        name: `Warriors ${timestamp}`,
        shortName: 'WAR',
        sport: 'cricket',
        players: [{ user: orgId, role: 'player' }]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Team 2 registered:', t2Res.data.message);

    // 5. Start Tournament
    const startRes = await axios.post(
      `${API_BASE}/tournaments/${tourney._id}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Tournament started! Response success:', startRes.data.success);
    const matches = startRes.data.data?.matches || [];
    console.log('Matches generated count:', matches.length);
    if (matches.length > 0) {
      console.log('Match 0 ID:', matches[0]._id, 'Sport:', matches[0].sport, 'Status:', matches[0].status);
    }

    if (startRes.data.success && matches.length > 0) {
      console.log('SUCCESS: Exhibition match flow works completely!');
    } else {
      console.error('FAILURE: Tournament started without matches generated.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testExhibitionFlow();

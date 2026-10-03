const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Starting browser verification...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.toString()}`);
  });

  try {
    // 1. Progress Tracking View
    console.log('Testing Progress Tracker...');
    await page.goto('http://localhost:3000/fitness/progress', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/progress_tracker.png' });
    console.log('Progress Tracker screenshot taken.');

    // 2. Match Creation Flow (we will just test that the page loads)
    console.log('Testing Match Creation...');
    await page.goto('http://localhost:3000/matches/create', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/match_creation.png' });

    // 3. Live Tournament Board with Map (Mocked API)
    console.log('Testing Live Board...');
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/tournaments/dummy-id-123/standings')) {
        request.respond({
          content: 'application/json',
          headers: {"Access-Control-Allow-Origin": "*"},
          body: JSON.stringify({
            success: true,
            data: [
              { team: { name: 'Strikers', logo: '' }, played: 5, won: 4, drawn: 1, lost: 0, points: 13, for: 10, against: 2 },
              { team: { name: 'Titans', logo: '' }, played: 5, won: 3, drawn: 1, lost: 1, points: 10, for: 8, against: 4 },
              { team: { name: 'Rangers', logo: '' }, played: 5, won: 2, drawn: 0, lost: 3, points: 6, for: 5, against: 8 }
            ]
          })
        });
      } else if (url.includes('/api/tournaments/dummy-id-123/bracket')) {
        request.respond({
          content: 'application/json',
          headers: {"Access-Control-Allow-Origin": "*"},
          body: JSON.stringify({
            success: true,
            data: {
              rounds: [
                { name: 'Semi-Finals', matches: 2 },
                { name: 'Finals', matches: 1 }
              ]
            }
          })
        });
      } else if (url.includes('/api/tournaments/dummy-id-123/schedule')) {
        request.respond({
          content: 'application/json',
          headers: {"Access-Control-Allow-Origin": "*"},
          body: JSON.stringify({
            success: true,
            data: [
              { _id: 'm1', round: 'Semi-Finals', homeTeam: { name: 'Strikers' }, awayTeam: { name: 'Rangers' }, status: 'completed', result: { homeScore: 2, awayScore: 0, winner: 'home' } },
              { _id: 'm2', round: 'Semi-Finals', homeTeam: { name: 'Titans' }, awayTeam: { name: 'Knights' }, status: 'completed', result: { homeScore: 3, awayScore: 1, winner: 'home' } },
              { _id: 'm3', round: 'Finals', homeTeam: { name: 'Strikers' }, awayTeam: { name: 'Titans' }, status: 'in_progress', result: { homeScore: 1, awayScore: 1 } }
            ]
          })
        });
      } else if (url.includes('/api/tournaments/dummy-id-123')) {
        request.respond({
          content: 'application/json',
          headers: {"Access-Control-Allow-Origin": "*"},
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'dummy-id-123',
              name: 'Strikers vs Titans',
              status: 'ongoing',
              sport: 'cricket',
              format: 'single-elimination',
              venue: {
                name: 'Main Stadium',
                coordinates: { lat: 28.6139, lng: 77.2090 } // New Delhi
              }
            }
          })
        });
      } else {
        request.continue();
      }
    });

    await page.goto('http://localhost:3000/tournaments/dummy-id-123/live', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000)); // wait for map tiles
    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/live_board_map.png' });
    console.log('Live Board (Map) screenshot taken.');

    // Click Bracket Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Bracket Tree'));
      if(btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/live_board_bracket.png' });
    console.log('Live Board (Bracket) screenshot taken.');

    // Click Standings Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Standings Table'));
      if(btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/live_board_standings.png' });
    console.log('Live Board (Standings) screenshot taken.');

    // 4. Scoring Console
    console.log('Testing Scoring Console...');
    
    // We mock the score update endpoint
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/tournaments/dummy-id-123/matches/m1/cricket-ball') && request.method() === 'PUT') {
        request.respond({
          content: 'application/json',
          headers: {"Access-Control-Allow-Origin": "*"},
          body: JSON.stringify({
            success: true,
            data: {
              cricketData: {
                innings: [{ team: 'home', runs: 11, wickets: 1, overs: 0, balls: 4 }],
                recentBalls: ['1', '4', '6', 'W']
              }
            }
          })
        });
      }
    });

    await page.goto('http://localhost:3000/tournaments/dummy-id-123/matches/m1/score', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Attempt to click [1] and [4] if buttons exist
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn1 = buttons.find(b => b.innerText.trim() === '1');
      if (btn1) btn1.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn4 = buttons.find(b => b.innerText.trim() === '4');
      if (btn4) btn4.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/scoring_console.png' });
    console.log('Scoring Console screenshot taken.');

    // 5. Chat Room
    console.log('Testing Chat Room...');
    page.on('request', request => {
      if (request.isInterceptResolutionHandled()) return;
      const url = request.url();
      if (url.includes('/api/chat/tournament/dummy-id-123') && request.method() === 'GET') {
        request.respond({
          content: 'application/json',
          headers: {"Access-Control-Allow-Origin": "*"},
          body: JSON.stringify({
            success: true,
            data: [
              {
                text: 'Welcome to the tournament chat!',
                isAnnouncement: true,
                sender: { firstName: 'Admin', lastName: 'User' },
                createdAt: new Date().toISOString()
              },
              {
                text: 'Good luck everyone!',
                isAnnouncement: false,
                sender: { firstName: 'John', lastName: 'Doe' },
                createdAt: new Date().toISOString()
              }
            ]
          })
        });
      }
    });

    await page.goto('http://localhost:3000/tournaments/dummy-id-123/live', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Click Discussions tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const chatBtn = buttons.find(b => b.innerText.trim() === 'Discussions');
      if (chatBtn) chatBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Type and send message
    await page.type('textarea', 'Hello from Puppeteer!');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Find the send button - usually it's the only one inside the form or has an icon
      const form = document.querySelector('form');
      if (form) {
        const sendBtn = form.querySelector('button[type="submit"]');
        if (sendBtn) sendBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'C:/Users/Sai vikas/.gemini/antigravity-ide/brain/483e8ed5-b00e-441b-b44e-b7182e7a8bf6/chat_room.png' });
    console.log('Chat Room screenshot taken.');

  } catch (error) {
    console.error('Test script error:', error);
  }

  await browser.close();
  
  if (errors.length > 0) {
    console.log('--- ENCOUNTERED ERRORS ---');
    errors.forEach(e => console.log(e));
  } else {
    console.log('--- ZERO CONSOLE ERRORS VERIFIED ---');
  }
})();

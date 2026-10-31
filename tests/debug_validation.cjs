const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  
  // Login as organizer
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#email');
  await page.type('#email', 'qa.organizer@example.com');
  await page.type('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  
  // Go to create
  await page.goto('http://localhost:3000/tournaments/create', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[name="organizerName"]');
  
  // Trigger validation
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));
  
  // Fill all fields
  await page.type('input[name="organizerName"]', 'QA Tournament Organization');
  await page.focus('input[name="organizerEmail"]');
  await page.type('input[name="organizerEmail"]', 'qa.organizer@example.com');
  await page.keyboard.press('Tab');
  await page.type('input[name="organizerPhone"]', '555-0100');
  await page.type('input[name="tournamentName"]', 'QA Premier Cricket Cup 2026');

  await page.select('select[name="sport"]', 'Cricket');
  await new Promise(r => setTimeout(r, 400));
  await page.select('select[name="format"]', 'Knockout');

  await page.type('input[name="venueName"]', 'QA National Cricket Stadium');
  await page.type('input[name="venueAddress"]', '100 Sports Blvd, Metropolis');

  await page.type('input[name="reportingTime"]', '45 minutes prior');
  await page.type('textarea[name="equipment"]', 'Cricket kit and standard uniform');

  await page.type('textarea[name="prizes"]', '1st Place: $1000 Championship Trophy, 2nd Place: $500 Silver Cup');

  await page.type('input[name="paymentDetails"]', 'Online UPI or payment at stadium reception');
  await page.type('input[name="eligibility"]', 'Open to all amateur & club cricket players');

  // Submit
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  
  const errs = await page.$$eval('.text-red-500', els => els.map(e => e.innerText));
  console.log('REMAINING VALIDATION ERRORS:', JSON.stringify(errs, null, 2));
  console.log('CURRENT URL:', page.url());
  
  await browser.close();
})();

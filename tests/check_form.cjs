const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Login as organizer
  await page.goto('http://localhost:3000/login');
  await page.type('#email', 'qa.organizer@example.com');
  await page.type('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  // Go to create
  await page.goto('http://localhost:3000/tournaments/create', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[name="organizerName"]');
  await page.type('input[name="organizerName"]', 'QA Organization');
  await page.type('input[name="organizerEmail"]', 'qa.organizer@example.com');
  await page.type('input[name="organizerPhone"]', '555-0100');
  await page.type('input[name="tournamentName"]', 'QA Premier Cricket Cup 2026');
  await page.select('select[name="sport"]', 'Cricket');
  await new Promise(r => setTimeout(r, 400));
  await page.select('select[name="format"]', 'Knockout');
  await page.type('input[name="venueName"]', 'QA Stadium');
  await page.type('input[name="venueAddress"]', '100 Stadium Road');
  await page.type('input[name="reportingTime"]', '1 hour before');
  await page.type('textarea[name="equipment"]', 'Cricket bats and balls');
  await page.type('textarea[name="prizes"]', '1st place $1000 cash');
  await page.type('input[name="paymentDetails"]', 'Pay via UPI');
  await page.type('input[name="eligibility"]', 'Open to all');

  // Submit
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  const errs = await page.$$eval('.text-red-500', els => els.map(e => e.innerText));
  console.log('Any validation errors remaining on page:', errs);
  console.log('Final URL:', page.url());
  
  await browser.close();
})();

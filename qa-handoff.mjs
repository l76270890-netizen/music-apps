// Checks the install -> app hand-off end to end:
//  1. a crafted `launch` value is refused (no open redirect)
//  2. opening `?launch=app` leaves the user in the app, with the flag stripped
//  3. the app asks the browser to open its start URL as the installed app
//  4. the install card is gone once installed
//   node <skill>/browser.mjs http://localhost:8099 --script ./qa-handoff.mjs
export default async function run(page) {
  const result = {};
  const opened = [];
  page.context().on('page', (p) => opened.push(p.url()));

  // 1. open-redirect guard
  const hammer = 'https://evil.example/phish';
  await page.goto(`http://localhost:8099/?source=pwa&launch=${encodeURIComponent('app,' + hammer)}`);
  await page.waitForTimeout(2000);
  result.hammerRejected = opened.every((u) => u.startsWith('http://localhost:8099'));

  // 2. hand-off leaves the user in the app and cleans the URL
  opened.length = 0;
  await page.goto('http://localhost:8099/?source=pwa&launch=app');
  await page.waitForTimeout(2500);
  result.urlAfterHandoff = await page.evaluate(() => location.pathname + location.search);
  result.appRendered = (await page.getByText('Your Music, Your Way').count()) > 0;

  // 3. the app opened its own start URL (as the installed app)
  result.openedUrls = opened;

  // 4. install card only shows while not installed
  await page.goto('http://localhost:8099/account');
  await page.waitForTimeout(1500);
  result.installCardInTab = (await page.getByText('Install TuneIt').count()) > 0;

  return result;
}

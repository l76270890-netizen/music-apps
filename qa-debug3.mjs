export default async function run(page) {
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  const responses = [];
  page.on('response', (r) => responses.push(`${r.status()} ${r.url()}`));

  await page.goto('http://localhost:8099/?source=pwa&launch=app');
  await page.waitForTimeout(3000);

  return {
    body: await page.evaluate(() => document.body.innerText.slice(0, 40)),
    url: await page.evaluate(() => location.search),
    entryRequests: requests.filter((u) => u.includes('entry-')),
    swRequests: responses.filter((r) => r.includes('sw.js') || r.includes('entry-')),
    controlled: await page.evaluate(() => !!navigator.serviceWorker?.controller),
    cacheKeys: await page.evaluate(async () => (await caches.keys()).join(',')),
  };
}

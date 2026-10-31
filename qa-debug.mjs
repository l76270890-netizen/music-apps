// Diagnoses why the ?launch=app hand-off does or doesn't run.
export default async function run(page) {
  const out = {};
  await page.goto('http://localhost:8099/?source=pwa&launch=app');
  await page.waitForTimeout(2500);
  out.url = await page.evaluate(() => location.pathname + location.search);

  // Does the app's own launcher code run if invoked directly?
  out.directOpen = await page.evaluate(() => {
    const calls = [];
    const original = window.open;
    window.open = (...args) => { calls.push(args); return { closed: false }; };
    try {
      const url = new URL('/', window.location.origin);
      url.search = '?source=pwa';
      window.open(url.toString(), 'tuneit-app', 'noopener,noreferrer');
    } finally {
      window.open = original;
    }
    return calls;
  });

  // Is the hook + hand-off component actually in the rendered tree?
  out.installCardText = await page.getByText('Install TuneIt').count();
  out.handoffText = await page.getByText('Opening TuneIt').count();
  out.linksInHead = await page.evaluate(() =>
    [...document.querySelectorAll('link')].map((l) => `${l.rel}:${l.getAttribute('href')}`)
  );
  return out;
}

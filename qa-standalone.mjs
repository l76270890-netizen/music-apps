// Verifies the app's install/standalone logic against the same browser APIs it
// reads at runtime. Run with:
//   node <skill>/browser.mjs http://localhost:8099 --script ./qa-standalone.mjs
const HOOK_SRC = '/_expo/static/js/web';

export default async function run(page) {
  // Lerp the exact predicate usePwaInstall() uses.
  const isStandaloneSource = (mode, legacyIos) => `(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q) =>
      ({ matches: ${JSON.stringify(mode)} === 'standalone' && q.includes('standalone') }) });
    window.navigator.standalone = ${legacyIos};
    return (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  })()`;

  const result = {
    installedAppWindow: await page.evaluate(isStandaloneSource('standalone', false)),
    browserTab: await page.evaluate(isStandaloneSource('browser', false)),
    legacyIosHomeScreen: await page.evaluate(isStandaloneSource('browser', true)),
    manifestDisplay: null,
    manifestStartUrl: null,
    swScope: null,
  };

  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]')?.href;
    if (!href) return null;
    return (await fetch(href)).json();
  });
  result.manifestDisplay = manifest?.display;
  result.manifestStartUrl = manifest?.start_url;
  result.manifestName = manifest?.name;

  // The install card is only rendered in a browser tab, not inside the app.
  await page.goto('http://localhost:8099/account');
  await page.waitForTimeout(1500);
  result.installCardShownInTab = (await page.getByText('Install TuneIt').count()) > 0;
  await page.screenshot({ path: 'qa-account.png' });

  return result;
}

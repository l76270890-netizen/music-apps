// Verifies the tab -> installed-app hand-off: when the page opens with
// ?launch=app it must strip the param and close the tab, so the user is left in
// the standalone app window rather than the browser.
//   node <skill>/browser.mjs http://localhost:8099/?launch=app --script ./qa-redirect.mjs
export default async function run(page) {
  let closed = false;
  page.on('close', () => { closed = true; });

  // Let the app mount, the hand-off run, and its 500ms close timer fire.
  await page.waitForTimeout(3000).catch(() => {});

  if (closed) return { tabClosed: true, note: 'hand-off closed the tab as intended' };

  // Still open: report what state the app is in.
  const state = await page.evaluate(() => ({
    path: location.pathname + location.search,
    launched: window.__tuneitLaunchedInstalledApp === true,
  })).catch(() => ({ path: 'unavailable', launched: null }));
  return { tabClosed: false, ...state };
}

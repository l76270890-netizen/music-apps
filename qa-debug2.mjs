export default async function run(page) {
  await page.goto('http://localhost:8099/?source=pwa&launch=app');
  await page.waitForTimeout(2500);
  return page.evaluate(() => {
    const script = [...document.querySelectorAll('script[src]')].map((s) => s.src).pop();
    return {
      url: location.pathname + location.search,
      body: document.body.innerText.slice(0, 60),
      bodyHtmlLen: document.body.innerHTML.length,
      rootLen: document.getElementById('root')?.innerHTML.length,
      script,
      hasHandoff: document.body.innerText.includes('Opening TuneIt'),
    };
  });
}

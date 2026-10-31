import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/* Tracks PWA installability on the web build.
 * - Chrome / Edge / Samsung Internet / Opera: captures `beforeinstallprompt`, so we
 *   can show an in-app "Install" button that opens the native install dialog.
 * - iOS Safari (and Firefox desktop): no prompt API, so we hand back manual steps.
 *
 * Once installed, opening the app must not keep a browser tab around:
 * - `?launch=app` is our hand-off URL. It asks the browser to open the installed
 *   app (via the manifest start_url) and closes the tab that is now redundant.
 * - While a tab does the hand-off it shows a short "Opening TuneIt" screen
 *   instead of flashing the browser UI.
 */
const DISMISS_KEY = 'tuneit.installDismissed';
const LAUNCH_PARAM = 'launch';
const LAUNCH_VALUE = 'app';

/* `launch=app` is only added by our own hand-off code, and the value must be
 * exactly "app". Anything else (e.g. `app,https://evil.example`) is a crafted
 * link and is refused, so it can never become an open redirect. */
function isLaunchHandoff() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    const raw = new URLSearchParams(window.location.search).get(LAUNCH_PARAM);
    return raw !== null && raw.trim() === LAUNCH_VALUE;
  } catch {
    return false;
  }
}

/* Strip ?launch=app so the address bar and the app's own routes stay clean. */
function clearLaunchFlag() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(LAUNCH_PARAM);
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

function isStandalone() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/* Opens the installed PWA in its own app window and closes the browser tab.
 * A bare window.open() would just make another tab, so we point at the
 * start_url, which launches the installed app when it exists and opens a normal
 * tab otherwise. The tab that triggered it closes itself when it can. */
/* Opens the installed app: with "noopener" the browser resolves the app's
 * start URL to the installed app window instead of a new tab. The URL is always
 * built from our own origin, never from the query string. */
function openInstalledApp() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (isStandalone()) return; // already inside the app
  try {
    const url = new URL('/', window.location.origin);
    url.search = '?source=pwa';
    // An app window (not a tab) reuses its existing instance for this URL,
    // so repeated installs/clicks don't stack windows.
    window.open(url.toString(), 'tuneit-app', 'noopener,noreferrer');
  } catch {}
}

/* One-shot hand-off, run at app boot rather than from a React effect: the
 * layout and the screen mount in an unpredictable order, and whichever mounts
 * first must not swallow the hand-off. Returns true while handing off. */
export function startLaunchHandoffIfRequested() {
  if (!isLaunchHandoff()) return false;
  if (!isStandalone()) openInstalledApp();
  clearLaunchFlag();
  return true;
}

function launchInstalledApp() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  openInstalledApp();
  // Best effort: only works for tabs this page opened itself.
  try { window.setTimeout(() => window.close(), 600); } catch {}
}

function detectPlatform() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'native';
  const ua = navigator.userAgent || '';
  // iPadOS reports itself as "Macintosh"; touch points give it away.
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(false);
  // startLaunchHandoffIfRequested() reports the same state at boot.
  const [handingOff, setHandingOff] = useState(() => false);
  const platform = detectPlatform();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    try { setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true'); } catch {}

    // The tab -> installed-app hand-off already ran at boot
    // (startLaunchHandoffIfRequested), before any screen could swallow it.

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      // Launch the installed app so you land in the app window, not the tab.
      launchInstalledApp();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return 'unavailable';
    setHandingOff(true);
    promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => ({ outcome: 'dismissed' }));
    setPromptEvent(null);
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      // `appinstalled` does the hand-off too; this covers browsers that skip it.
      window.setTimeout(() => { if (!isStandalone()) launchInstalledApp(); }, 3000);
      return 'accepted';
    }
    setHandingOff(false);
    return 'dismissed';
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { window.localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
  }, []);

  return {
    canPrompt: Boolean(promptEvent),
    installed,
    // True when running inside the installed app window (no browser chrome).
    standalone: isStandalone(),
    // True while this tab is handing over to the installed app.
    handingOff,
    dismissed,
    platform, // 'ios' | 'android' | 'desktop' | 'native'
    // Show the card on web when the app is not yet installed and the user has not dismissed it.
    available: Platform.OS === 'web' && !installed && !dismissed && !handingOff,
    install,
    dismiss,
  };
}

export default usePwaInstall;

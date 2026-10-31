```javascript
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const DISMISS_KEY = 'tuneit.installDismissed';
const LAUNCH_PARAM = 'launch';
const LAUNCH_VALUE = 'app';

function isLaunchHandoff() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  try {
    const raw = new URLSearchParams(window.location.search).get(LAUNCH_PARAM);
    return raw !== null && raw.trim() === LAUNCH_VALUE;
  } catch {
    return false;
  }
}

function clearLaunchFlag() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(LAUNCH_PARAM);
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

function isStandalone() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function openInstalledApp() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (isStandalone()) return;

  try {
    const url = new URL('/', window.location.origin);
    url.search = '?source=pwa';
    window.open(url.toString(), 'tuneit-app', 'noopener,noreferrer');
  } catch {}
}

export function startLaunchHandoffIfRequested() {
  if (!isLaunchHandoff()) return false;

  if (!isStandalone()) openInstalledApp();

  clearLaunchFlag();
  return true;
}

function launchInstalledApp() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  openInstalledApp();

  try {
    window.setTimeout(() => window.close(), 600);
  } catch {}
}

function detectPlatform() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'native';

  const ua = navigator.userAgent || '';

  if (
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  ) {
    return 'ios';
  }

  if (/android/i.test(ua)) return 'android';

  return 'desktop';
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(false);
  const [handingOff, setHandingOff] = useState(false);

  const platform = detectPlatform();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true');
    } catch {}

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
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

    const choice = await promptEvent.userChoice.catch(() => ({
      outcome: 'dismissed',
    }));

    setPromptEvent(null);

    if (choice.outcome === 'accepted') {
      setInstalled(true);

      window.setTimeout(() => {
        if (!isStandalone()) launchInstalledApp();
      }, 3000);

      return 'accepted';
    }

    setHandingOff(false);
    return 'dismissed';
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setDismissed(true);

    try {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    } catch {}
  }, []);

  return {
    canPrompt: Boolean(promptEvent),
    installed,
    standalone: isStandalone(),
    handingOff,
    dismissed,
    platform,
    available:
      Platform.OS === 'web' &&
      !installed &&
      !dismissed &&
      !handingOff,
    install,
    dismiss,
  };
}

export default usePwaInstall;
```
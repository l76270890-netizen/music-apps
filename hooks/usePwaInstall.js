import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/* Tracks PWA installability on the web build.
 * - Chrome / Edge / Samsung Internet / Opera: captures `beforeinstallprompt`, so we
 *   can show an in-app "Install" button that opens the native install dialog.
 * - iOS Safari (and Firefox desktop): no prompt API, so we hand back manual steps.
 */
const DISMISS_KEY = 'tuneit.installDismissed';

function isStandalone() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
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
  const platform = detectPlatform();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    try { setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true'); } catch {}

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return 'unavailable';
    promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => ({ outcome: 'dismissed' }));
    setPromptEvent(null);
    if (choice.outcome === 'accepted') { setInstalled(true); return 'accepted'; }
    return 'dismissed';
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { window.localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
  }, []);

  return {
    canPrompt: Boolean(promptEvent),
    installed,
    dismissed,
    platform, // 'ios' | 'android' | 'desktop' | 'native'
    // Show the card on web when the app is not yet installed and the user has not dismissed it.
    available: Platform.OS === 'web' && !installed && !dismissed,
    install,
    dismiss,
  };
}

export default usePwaInstall;

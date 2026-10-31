import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { usePwaInstall } from '../hooks/usePwaInstall';

/* One-tap PWA install for the web build.
 * Chrome/Edge get the native install prompt; iOS/Safari and Firefox get manual steps. */
const STEPS = {
  ios: ['Open TuneIt in Safari.', 'Tap the Share button (square with an arrow).', 'Choose “Add to Home Screen”, then Add.'],
  android: ['Open TuneIt in Chrome.', 'Tap ⋮ (top-right).', 'Choose “Install app” or “Add to Home screen”.'],
  desktop: ['Open TuneIt in Chrome or Edge.', 'Click the install icon in the address bar, or ⋮ → “Install TuneIt”.', 'Confirm “Install”.'],
};

export default function InstallAppCard({ style }) {
  const { available, canPrompt, platform, install } = usePwaInstall();
  const [showSteps, setShowSteps] = useState(false);
  const [message, setMessage] = useState('');
  if (!available) return null;
  const steps = STEPS[platform] || STEPS.desktop;

  const onPress = async () => {
    if (!canPrompt) { setShowSteps((value) => !value); return; }
    const result = await install();
    if (result === 'dismissed') setMessage('Install cancelled. You can try again any time.');
  };

  return (
    <View style={[s.card, style]}>
      <View style={s.row}>
        <View style={s.icon}><Text style={s.iconGlyph}>⤓</Text></View>
        <View style={s.copy}>
          <Text style={s.title}>Install TuneIt</Text>
          <Text style={s.sub}>Add TuneIt to your device for a full-screen, app-like player that works offline.</Text>
        </View>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Install TuneIt app" onPress={onPress} style={s.button}>
        <Text style={s.buttonText}>{canPrompt ? 'Install app' : 'How to install'}</Text>
      </TouchableOpacity>
      {(showSteps || !canPrompt) && <View style={s.steps}>
        {steps.map((step, index) => <Text key={step} style={s.step}>{index + 1}. {step}</Text>)}
      </View>}
      {!!message && <Text accessibilityRole="alert" style={s.message}>{message}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  iconGlyph: { color: colors.onAccent, fontSize: 22, fontWeight: '800' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  button: { minHeight: 42, marginTop: 13, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  buttonText: { color: colors.onAccent, fontSize: 13, fontWeight: '700' },
  steps: { marginTop: 12, gap: 6 },
  step: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  message: { color: colors.accentLight, fontSize: 11, marginTop: 10 },
});

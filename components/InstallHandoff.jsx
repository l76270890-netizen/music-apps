import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

/* Shown in the browser tab while it opens the installed app, so the user sees
 * "Opening TuneIt" instead of a flash of browser chrome before the app window
 * takes over. If the browser refuses to close the tab we fall back to a link. */
export default function InstallHandoff() {
  return (
    <View style={s.root}>
      <View style={s.badge}><Text style={s.glyph}>♫</Text></View>
      <ActivityIndicator color={colors.accent} />
      <Text style={s.title}>Opening TuneIt</Text>
      <Text style={s.sub}>Taking you into the app. If nothing happens, open TuneIt from your home screen.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 32, gap: 14 },
  badge: { width: 84, height: 84, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, marginBottom: 6 },
  glyph: { color: colors.onAccent, fontSize: 40, fontWeight: '800' },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 300 },
});

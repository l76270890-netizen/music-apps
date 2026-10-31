import { Platform, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default StyleSheet.create({
  wrap: { minHeight: 76, flexDirection: 'column', alignItems: 'stretch', marginHorizontal: 12, marginTop: 8, marginBottom: 5, paddingHorizontal: 12, paddingTop: 2, paddingBottom: 3, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 16, position: 'relative', ...Platform.select({ web: { boxShadow: '0px 3px 10px rgba(12, 29, 50, 0.08)' }, default: { shadowColor: colors.background, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 } }) },
  seekArea: { width: '100%', height: 18, justifyContent: 'center' },
  progressTrack: { width: '100%', height: 3, borderRadius: 3, backgroundColor: colors.line, position: 'relative' },
  progress: { height: 3, borderRadius: 3, backgroundColor: colors.accent },
  progressThumb: { position: 'absolute', top: -3, marginLeft: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accentLight },
  controlsRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 5 },
  track: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  cover: { width: 42, height: 42, borderRadius: 9 }, fallback: { alignItems: 'center', justifyContent: 'center' }, glyph: { color: colors.text, fontSize: 20 },
  copy: { flex: 1, minWidth: 0 }, title: { color: colors.text, fontSize: 12, fontWeight: '700' }, artist: { color: colors.muted, fontSize: 10, marginTop: 3 },
  control: { width: 38, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 22 }, controlText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});

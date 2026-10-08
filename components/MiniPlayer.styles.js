import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default StyleSheet.create({
  wrap: { minHeight: 66, flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 8, marginBottom: 5, paddingHorizontal: 12, gap: 9, backgroundColor: colors.panel, borderWidth: 1, borderColor: '#ECEAF2', borderRadius: 16, position: 'relative', shadowColor: '#241A42', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  progress: { position: 'absolute', top: 0, left: 0, height: 2, backgroundColor: colors.accent },
  track: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54 },
  cover: { width: 42, height: 42, borderRadius: 9 }, fallback: { alignItems: 'center', justifyContent: 'center' }, glyph: { color: colors.text, fontSize: 20 },
  copy: { flex: 1, minWidth: 0 }, title: { color: colors.text, fontSize: 12, fontWeight: '700' }, artist: { color: colors.muted, fontSize: 10, marginTop: 3 },
  control: { width: 38, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 22 }, controlText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});

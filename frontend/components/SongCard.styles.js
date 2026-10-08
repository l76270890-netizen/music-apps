import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default StyleSheet.create({
  row: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  compact: { minHeight: 52, paddingVertical: 5 },
  cover: { width: 46, height: 46, borderRadius: 9 },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  coverGlyph: { color: colors.text, fontSize: 20, fontWeight: '700' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 13, fontWeight: '600' },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  active: { color: colors.accentLight },
  action: { minWidth: 28, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.muted, fontSize: 16 },
});

import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default StyleSheet.create({ card: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, cover: { width: 54, height: 54, borderRadius: 10 }, fallback: { alignItems: 'center', justifyContent: 'center' }, glyph: { color: colors.text, fontSize: 23 }, copy: { flex: 1 }, title: { color: colors.text, fontSize: 13, fontWeight: '600' }, subtitle: { color: colors.muted, fontSize: 11, marginTop: 4 }, menu: { padding: 8 }, menuText: { color: colors.muted, fontSize: 15 } });

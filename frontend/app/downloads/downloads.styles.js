import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 22, paddingBottom: 32 }, heading: { color: colors.text, fontSize: 26, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 12, marginTop: 6, marginBottom: 18 }, count: { color: colors.accentLight, fontSize: 12, fontWeight: '600', marginBottom: 8 }, empty: { alignItems: 'center', padding: 28 }, emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 } });

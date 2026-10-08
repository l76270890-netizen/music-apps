import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 22, paddingBottom: 32 }, heading: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 15 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }, filter: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card }, filterText: { color: colors.text, fontSize: 11 }, sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 14, marginBottom: 10 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 } });

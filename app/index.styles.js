import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 }, heading: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 16 }, section: { marginTop: 22 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 } });

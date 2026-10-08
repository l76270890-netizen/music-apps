import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 22, paddingBottom: 32 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, heading: { color: colors.text, fontSize: 26, fontWeight: '800' }, createButton: { minWidth: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }, createText: { color: colors.text, fontSize: 23 }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }, separator: { height: 1, backgroundColor: colors.line, marginVertical: 14 } });

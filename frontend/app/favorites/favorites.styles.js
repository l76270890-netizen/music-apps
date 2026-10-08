import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 22, paddingBottom: 32 }, hero: { minHeight: 178, borderRadius: 18, padding: 20, justifyContent: 'flex-end', backgroundColor: '#34214F', marginBottom: 22 }, heroIcon: { color: colors.text, fontSize: 38, marginBottom: 10 }, heading: { color: colors.text, fontSize: 25, fontWeight: '800' }, subtitle: { color: '#D0C5E0', fontSize: 12, marginTop: 6 }, sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 } });

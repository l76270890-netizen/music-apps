import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}><Text style={styles.brandNote}>♫</Text></View>
          <Text style={styles.brand}>TuneIt</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>YOUR MUSIC. YOUR MOMENT.</Text>
          <Text style={styles.title}>Make room{ '\n' }for the music.</Text>
          <Text style={styles.subtitle}>Your favorite songs, ready whenever you are.</Text>
        </View>

        <View style={styles.artwork} accessibilityLabel="Purple music illustration">
          <View style={styles.halo} />
          <View style={styles.smallSpark}><Text style={styles.sparkText}>✦</Text></View>
          <View style={styles.noteOne}><Text style={styles.noteText}>♪</Text></View>
          <View style={styles.noteTwo}><Text style={styles.noteText}>♫</Text></View>
          <View style={styles.recordOuter}>
            <View style={styles.recordRing}>
              <View style={styles.recordCenter}><View style={styles.recordDot} /></View>
            </View>
          </View>
          <View style={styles.headphoneBand} />
          <View style={styles.headphoneLeft} />
          <View style={styles.headphoneRight} />
          <View style={styles.artCaption}>
            <View style={styles.captionBars}>
              <View style={[styles.bar, { height: 9 }]} /><View style={[styles.bar, { height: 18 }]} />
              <View style={[styles.bar, { height: 13 }]} /><View style={[styles.bar, { height: 24 }]} />
              <View style={[styles.bar, { height: 15 }]} />
            </View>
            <View style={styles.captionText}><Text style={styles.captionTitle}>Press play</Text><Text style={styles.captionSub}>Let the moment find its rhythm</Text></View>
            <View style={styles.captionPlay}><Text style={styles.playGlyph}>▶</Text></View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>A little more you in every note.</Text>
          <Text style={styles.footerCopy}>Listen to your local library, online or offline.</Text>
          <Pressable accessibilityRole="button" onPress={onGetStarted} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Get started</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
          <Text style={styles.localNote}>YOUR MUSIC STAYS YOURS</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, paddingHorizontal: 25, paddingTop: 12, paddingBottom: 12, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  brandNote: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 25 },
  brand: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  copy: { marginTop: 15 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 9 },
  title: { color: colors.text, fontSize: 37, lineHeight: 42, fontWeight: '800', letterSpacing: -1.3 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  artwork: { flex: 1, minHeight: 210, maxHeight: 350, marginTop: 12, marginBottom: 15, borderRadius: 30, overflow: 'hidden', backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#DDD3FF', top: '8%' },
  recordOuter: { width: 188, height: 188, borderRadius: 94, backgroundColor: '#28213D', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-14deg' }], elevation: 8 },
  recordRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: '#776A91', alignItems: 'center', justifyContent: 'center' },
  recordCenter: { width: 67, height: 67, borderRadius: 34, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  recordDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#F5F1FF' },
  headphoneBand: { position: 'absolute', width: 112, height: 133, borderWidth: 11, borderColor: colors.accent, borderBottomColor: 'transparent', borderRadius: 70, top: '13%', transform: [{ rotate: '12deg' }] },
  headphoneLeft: { position: 'absolute', width: 29, height: 60, borderRadius: 14, backgroundColor: '#493579', left: '23%', top: '43%', transform: [{ rotate: '12deg' }] },
  headphoneRight: { position: 'absolute', width: 29, height: 60, borderRadius: 14, backgroundColor: '#493579', right: '23%', top: '43%', transform: [{ rotate: '-12deg' }] },
  smallSpark: { position: 'absolute', top: '16%', right: '21%' },
  sparkText: { color: colors.accentLight, fontSize: 30 },
  noteOne: { position: 'absolute', left: '19%', top: '23%', transform: [{ rotate: '-12deg' }] },
  noteTwo: { position: 'absolute', right: '15%', top: '49%', transform: [{ rotate: '9deg' }] },
  noteText: { color: colors.accent, fontSize: 31, fontWeight: '700' },
  artCaption: { position: 'absolute', bottom: 14, left: 14, right: 14, height: 61, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.94)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  captionBars: { height: 26, width: 25, flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.accentLight },
  captionText: { flex: 1, marginLeft: 10 },
  captionTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  captionSub: { color: colors.muted, fontSize: 9, marginTop: 3 },
  captionPlay: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  playGlyph: { color: '#FFF', fontSize: 12, marginLeft: 2 },
  footer: { paddingBottom: 4 },
  footerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  footerCopy: { color: colors.muted, fontSize: 12, marginTop: 5 },
  button: { height: 56, marginTop: 20, borderRadius: 18, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: colors.accent, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  buttonArrow: { color: '#FFF', fontSize: 20, position: 'absolute', right: 20 },
  localNote: { textAlign: 'center', color: colors.muted, fontSize: 9, letterSpacing: 1.6, fontWeight: '700', marginTop: 13 },
});

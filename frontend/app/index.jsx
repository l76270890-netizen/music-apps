import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';
import TuneItApp from '../components/TuneItApp';
import WelcomeScreen from '../components/WelcomeScreen';
import { appStorage } from '../services/storage';

export default function HomeScreen() {
  const [welcomeSeen, setWelcomeSeen] = useState(null);

  useEffect(() => {
    let active = true;
    appStorage.getItem('tuneit.welcomeSeen')
      .then((value) => { if (active) setWelcomeSeen(value === 'true'); })
      .catch(() => { if (active) setWelcomeSeen(false); });
    return () => { active = false; };
  }, []);

  if (welcomeSeen === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!welcomeSeen) {
    return (
      <WelcomeScreen
        onGetStarted={async () => {
          try { await appStorage.setItem('tuneit.welcomeSeen', 'true'); } catch {}
          setWelcomeSeen(true);
        }}
      />
    );
  }

  return <TuneItApp screen="home" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});

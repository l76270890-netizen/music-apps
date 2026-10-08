import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MusicProvider } from '../context/MusicContext';
import { colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MusicProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </MusicProvider>
    </SafeAreaProvider>
  );
}

import { Stack } from 'expo-router';
import { MusicProvider } from '../context/MusicContext';
import { colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <MusicProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </MusicProvider>
  );
}

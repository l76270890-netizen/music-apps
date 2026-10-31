import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MusicProvider } from '../context/MusicContext';
import InstallHandoff from '../components/InstallHandoff';
import { startLaunchHandoffIfRequested } from '../hooks/usePwaInstall';
import { colors } from '../constants/colors';

// If this tab was opened by the install hand-off, open the installed app now
// instead of rendering another browser tab.
function InstallHandoffGate() {
  const [handingOff] = useState(startLaunchHandoffIfRequested);
  return handingOff ? <InstallHandoff /> : null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MusicProvider>
        <InstallHandoffGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </MusicProvider>
    </SafeAreaProvider>
  );
}

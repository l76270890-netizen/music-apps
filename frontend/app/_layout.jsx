import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MusicProvider } from '../context/MusicContext';
import InstallHandoff from '../components/InstallHandoff';
import { startLaunchHandoffIfRequested } from '../hooks/usePwaInstall';
import { colors } from '../constants/colors';

// Runs at the very start of the render, before the Stack (and its screen) can
// mount: if this tab was opened by the install hand-off, open the installed app
// instead of rendering a second browser tab.
const handedOff = startLaunchHandoffIfRequested();

function InstallHandoffGate() {
  return handedOff ? <InstallHandoff /> : null;
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

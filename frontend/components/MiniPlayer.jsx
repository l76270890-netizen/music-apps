import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMusic } from '../context/MusicContext';
import styles from './MiniPlayer.styles';

export default function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, playerStatus, togglePlay, playNext } = useMusic();
  if (!currentTrack) return null;
  const progress = playerStatus?.duration ? Math.min(1, playerStatus.currentTime / playerStatus.duration) : 0;
  return <View style={styles.wrap}>
    <View style={[styles.progress, { width: `${progress * 100}%` }]} />
    <Pressable accessibilityRole="button" onPress={() => router.push('/player/current')} style={styles.track}>
      {currentTrack.artwork ? <Image source={{ uri: currentTrack.artwork }} style={styles.cover} /> : <View style={[styles.cover, styles.fallback, { backgroundColor: currentTrack.color || '#393044' }]}><Text style={styles.glyph}>{currentTrack.art || '♫'}</Text></View>}
      <View style={styles.copy}><Text numberOfLines={1} style={styles.title}>{currentTrack.title}</Text><Text numberOfLines={1} style={styles.artist}>{currentTrack.artist}</Text></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={playerStatus?.playing ? 'Pause' : 'Play'} onPress={togglePlay} style={styles.control}><Text style={styles.controlText}>{playerStatus?.playing ? 'Ⅱ' : '▶'}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Next track" onPress={playNext} style={styles.control}><Text style={styles.controlText}>▶|</Text></Pressable>
  </View>;
}

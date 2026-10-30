import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMusic } from '../context/MusicContext';
import { colors } from '../constants/colors';
import styles from './MiniPlayer.styles';

export default function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, player, playerStatus, togglePlay, playNext } = useMusic();
  const [seekWidth, setSeekWidth] = useState(0);
  if (!currentTrack) return null;
  const duration = playerStatus?.duration || 0;
  const progress = duration ? Math.max(0, Math.min(1, playerStatus.currentTime / duration)) : 0;
  const seekAt = (event) => {
    if (!duration || !seekWidth) return;
    const x = Math.max(0, Math.min(seekWidth, event.nativeEvent.locationX || 0));
    player.seekTo((x / seekWidth) * duration);
  };
  return <View style={styles.wrap}>
    <View accessibilityRole="adjustable" accessibilityLabel="Track progress" accessibilityValue={{ min: 0, max: duration, now: playerStatus?.currentTime || 0 }} onLayout={(event) => setSeekWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => Boolean(duration)} onMoveShouldSetResponder={() => Boolean(duration)} onResponderGrant={seekAt} onResponderMove={seekAt} style={styles.seekArea}>
      <View style={styles.progressTrack}><View style={[styles.progress, { width: `${progress * 100}%` }]} /><View style={[styles.progressThumb, { left: `${progress * 100}%` }]} /></View>
    </View>
    <View style={styles.controlsRow}>
    <Pressable accessibilityRole="button" onPress={() => router.push('/player/current')} style={styles.track}>
      {currentTrack.artwork ? <Image source={{ uri: currentTrack.artwork }} style={styles.cover} /> : <View style={[styles.cover, styles.fallback, { backgroundColor: currentTrack.color || colors.cardLight }]}><Text style={styles.glyph}>{currentTrack.art || '♫'}</Text></View>}
      <View style={styles.copy}><Text numberOfLines={1} style={styles.title}>{currentTrack.title}</Text><Text numberOfLines={1} style={styles.artist}>{currentTrack.artist}</Text></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={playerStatus?.playing ? 'Pause' : 'Play'} onPress={togglePlay} style={styles.control}><Text style={styles.controlText}>{playerStatus?.playing ? 'Ⅱ' : '▶'}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Next track" onPress={playNext} style={styles.control}><Text style={styles.controlText}>▶|</Text></Pressable>
    </View>
  </View>;
}

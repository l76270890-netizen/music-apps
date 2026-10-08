import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useMusic } from '../context/MusicContext';
import { colors } from '../constants/colors';
import styles from './MusicPlayer.styles';

function time(value = 0) { const seconds = Math.max(0, Math.floor(Number(value) || 0)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

export default function MusicPlayer({ track: trackProp }) {
  const [seekWidth, setSeekWidth] = useState(0);
  const { currentTrack, playerStatus, togglePlay, playNext, playPrevious, liked, toggleLike, player } = useMusic();
  const track = trackProp || currentTrack;
  if (!track) return null;
  const duration = playerStatus?.duration || 0;
  const elapsed = playerStatus?.currentTime || 0;
  const progress = duration ? Math.max(0, Math.min(1, elapsed / duration)) : 0;
  const seek = (amount) => { if (duration) player.seekTo(duration * amount); };
  return <View style={styles.container}>
    {track.artwork ? <Image source={{ uri: track.artwork }} style={styles.art} /> : <View style={[styles.art, styles.fallback, { backgroundColor: track.color || colors.card }]}><Text style={styles.glyph}>{track.art || '♫'}</Text></View>}
    <View style={styles.info}><Text numberOfLines={1} style={styles.title}>{track.title}</Text><Text numberOfLines={1} style={styles.artist}>{track.artist}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={liked.includes(track.title) ? 'Unlike track' : 'Like track'} onPress={() => toggleLike(track)} style={styles.heart}><Text style={styles.heartText}>{liked.includes(track.title) ? '♥' : '♡'}</Text></Pressable>
    <View style={styles.seekRow}><Text style={styles.time}>{time(elapsed)}</Text><Pressable accessibilityRole="adjustable" accessibilityLabel="Seek track" onLayout={(event) => setSeekWidth(event.nativeEvent.layout.width)} onPress={(event) => { if (seekWidth) seek(event.nativeEvent.locationX / seekWidth); }} style={styles.seekTrack}><View style={[styles.seekFill, { width: `${progress * 100}%` }]} /></Pressable><Text style={styles.time}>{time(duration)}</Text></View>
    <View style={styles.controls}><Pressable accessibilityRole="button" accessibilityLabel="Previous track" onPress={playPrevious} style={styles.control}><Text style={styles.controlText}>|◀</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={playerStatus?.playing ? 'Pause' : 'Play'} onPress={togglePlay} style={styles.play}><Text style={styles.playText}>{playerStatus?.playing ? 'Ⅱ' : '▶'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next track" onPress={playNext} style={styles.control}><Text style={styles.controlText}>▶|</Text></Pressable></View>
  </View>;
}

import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useMusic } from '../context/MusicContext';
import { colors } from '../constants/colors';
import styles from './SongCard.styles';

export default function SongCard({ track, song, onPress, onMenu, compact = false, showArtist = true }) {
  const item = track || song || {};
  const { currentTrack, playTrack, liked, toggleLike, setMenu } = useMusic();
  const active = currentTrack?.title === item.title;
  const likedTrack = liked.includes(item.title);
  const play = () => (onPress ? onPress(item) : playTrack(item));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Play ${item.title || 'track'}`} onPress={play} style={[styles.row, compact && styles.compact]}>
      {item.artwork || item.image ? <Image source={{ uri: item.artwork || item.image }} style={styles.cover} /> : <View style={[styles.cover, styles.coverFallback, { backgroundColor: item.color || colors.cardLight }]}><Text style={styles.coverGlyph}>{item.art || '♫'}</Text></View>}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, active && styles.active]}>{item.title || 'Unknown track'}</Text>
        {showArtist && <Text numberOfLines={1} style={styles.subtitle}>{item.artist || 'Unknown artist'}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={likedTrack ? 'Unlike track' : 'Like track'} onPress={(event) => { event.stopPropagation?.(); toggleLike(item); }} hitSlop={8} style={styles.action}><Text style={[styles.actionText, likedTrack && styles.active]}>{likedTrack ? '♥' : '♡'}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${item.title || 'track'}`} onPress={(event) => { event.stopPropagation?.(); onMenu ? onMenu(item) : setMenu({ type: 'track', track: item }); }} hitSlop={8} style={styles.action}><Text style={styles.actionText}>•••</Text></Pressable>
    </Pressable>
  );
}

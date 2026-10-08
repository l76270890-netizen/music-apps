import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import styles from './PlaylistCard.styles';

export default function PlaylistCard({ playlist = {}, onPress, onMenu }) {
  const title = playlist.name || playlist.title || 'Untitled playlist';
  const art = playlist.artwork || playlist.image;
  return <Pressable accessibilityRole="button" onPress={() => onPress?.(playlist)} style={styles.card}>
    {art ? <Image source={{ uri: art }} style={styles.cover} /> : <View style={[styles.cover, styles.fallback, { backgroundColor: playlist.color || colors.accent }]}><Text style={styles.glyph}>{playlist.icon || '♫'}</Text></View>}
    <View style={styles.copy}><Text numberOfLines={1} style={styles.title}>{title}</Text><Text style={styles.subtitle}>{playlist.count ?? playlist.tracks?.length ?? 0} songs</Text></View>
    {onMenu && <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${title}`} onPress={(event) => { event.stopPropagation?.(); onMenu(playlist); }} hitSlop={8} style={styles.menu}><Text style={styles.menuText}>•••</Text></Pressable>}
  </Pressable>;
}

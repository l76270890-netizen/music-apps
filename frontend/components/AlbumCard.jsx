import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import styles from './AlbumCard.styles';

export default function AlbumCard({ album = {}, onPress, width = 150 }) {
  const title = album.title || album.name || 'Untitled album';
  const art = album.artwork || album.image;
  return <Pressable accessibilityRole="button" onPress={() => onPress?.(album)} style={[styles.card, { width }]}>
    {art ? <Image source={{ uri: art }} style={[styles.cover, { width, height: width }]} /> : <View style={[styles.cover, styles.fallback, { width, height: width, backgroundColor: album.color || colors.card }]}><Text style={styles.glyph}>{album.art || '♫'}</Text></View>}
    <Text numberOfLines={1} style={styles.title}>{title}</Text><Text numberOfLines={1} style={styles.subtitle}>{album.artist || album.year || 'Album'}</Text>
  </Pressable>;
}

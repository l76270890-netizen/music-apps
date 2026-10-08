import React from 'react';
import { FlatList, Text, View } from 'react-native';
import SongCard from './SongCard';
import styles from './SongList.styles';

export default function SongList({ songs = [], tracks, onSongPress, onMenu, emptyMessage = 'No songs here yet.', ListHeaderComponent }) {
  const items = tracks || songs;
  if (!items.length) return <View style={styles.empty}><Text style={styles.emptyText}>{emptyMessage}</Text></View>;
  return <FlatList data={items} keyExtractor={(item, index) => String(item.id || `${item.title || 'song'}-${index}`)} renderItem={({ item }) => <SongCard track={item} onPress={onSongPress} onMenu={onMenu} />} ListHeaderComponent={ListHeaderComponent} style={styles.list} />;
}

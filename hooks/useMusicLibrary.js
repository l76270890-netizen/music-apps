import { useMemo } from 'react';
import { useMusic } from '../context/MusicContext';

export default function useMusicLibrary(query = '') {
  const { localTracks, liked, playlists, searchQuery } = useMusic();
  const term = (query || searchQuery).trim().toLocaleLowerCase();
  const tracks = useMemo(() => term
    ? localTracks.filter((track) => `${track.title} ${track.artist} ${track.album || ''}`.toLocaleLowerCase().includes(term))
    : localTracks, [term, localTracks]);
  const likedTracks = useMemo(() => localTracks.filter((track) => liked.includes(track.title)), [localTracks, liked]);
  return { tracks, likedTracks, downloadedTracks: localTracks, playlists, isSearching: Boolean(term), query: query || searchQuery };
}

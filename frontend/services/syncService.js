import { api } from './api';

export function metadataKey(track) {
  const value = `${track.title || ''}|${track.artist || ''}|${track.album || ''}|${Math.floor(track.duration || 0)}`.toLocaleLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `tuneit-${(hash >>> 0).toString(16)}`;
}

export async function syncLibraryState({ localTracks, liked, playlists, playlistTracks, deletedRemotePlaylistIds = [], removedFavoriteTitles = [] }) {
  const keyByLocalId = new Map(localTracks.map((track) => [track.id, metadataKey(track)]));
  const songPayload = localTracks.map((track) => ({
    device_key: metadataKey(track),
    title: track.title,
    artist: track.artist || 'Unknown artist',
    album: track.album || '',
    duration_seconds: Math.max(0, Math.floor(track.duration || 0)),
  }));
  let songs = [];
  for (let index = 0; index < Math.max(1, songPayload.length); index += 1000) {
    songs = await api.post('/songs/sync', songPayload.slice(index, index + 1000));
    if (!songPayload.length) break;
  }
  const songByKey = new Map(songs.map((song) => [song.device_key, song]));

  const desiredFavorites = songs.filter((song) => localTracks.some((track) =>
    keyByLocalId.get(track.id) === song.device_key && liked.includes(track.title)));
  const serverFavorites = await api.get('/favorites');
  const serverFavoriteIds = new Set(serverFavorites.map((song) => song.id));
  const deletedFavoriteSet = new Set(removedFavoriteTitles);
  for (const song of serverFavorites) {
    if (deletedFavoriteSet.has(song.title)) await api.delete(`/favorites/${song.id}`);
  }
  for (const song of desiredFavorites) if (!serverFavoriteIds.has(song.id)) await api.post(`/favorites/${song.id}`, {});

  const remotePlaylists = await api.get('/playlists');
  const remoteByName = new Map(remotePlaylists.map((playlist) => [playlist.name.toLocaleLowerCase(), playlist]));
  const remoteById = new Map(remotePlaylists.map((playlist) => [playlist.id, playlist]));
  const deletedSet = new Set(deletedRemotePlaylistIds);
  for (const remote of remotePlaylists) {
    if (deletedSet.has(remote.id)) {
      await api.delete(`/playlists/${remote.id}`);
      remoteByName.delete(remote.name.toLocaleLowerCase());
      remoteById.delete(remote.id);
    }
  }
  let syncedPlaylists = 0;
  for (const playlist of playlists.filter((item) => item.id !== 'liked-songs')) {
    let remote = playlist.remoteId ? remoteById.get(playlist.remoteId) : remoteByName.get(playlist.name.toLocaleLowerCase());
    if (remote && remote.name.toLocaleLowerCase() !== playlist.name.toLocaleLowerCase()) {
      const oldName = remote.name.toLocaleLowerCase();
      remote = await api.put(`/playlists/${remote.id}`, { name: playlist.name });
      remoteByName.delete(oldName);
      remoteByName.set(playlist.name.toLocaleLowerCase(), remote);
      remoteById.set(remote.id, remote);
    }
    if (!remote) {
      remote = await api.post('/playlists', { name: playlist.name });
      remoteByName.set(playlist.name.toLocaleLowerCase(), remote);
      remoteById.set(remote.id, remote);
    }
    const localItems = playlistTracks[playlist.id] || [];
    const expectedSongs = localItems.map((track) => songByKey.get(keyByLocalId.get(track.id))).filter(Boolean);
    const expectedIds = new Set(expectedSongs.map((song) => song.id));
    const existingIds = new Set((remote.songs || []).map((song) => song.id));
    for (const songId of expectedIds) if (!existingIds.has(songId)) remote = await api.post(`/playlists/${remote.id}/songs/${songId}`, {});
    syncedPlaylists += 1;
  }
  const [mergedFavorites, mergedPlaylists] = await Promise.all([
    api.get('/favorites'),
    api.get('/playlists'),
  ]);
  return {
    songs: songs.length,
    playlists: syncedPlaylists,
    deletedPlaylistIds: [...deletedSet],
    deletedFavoriteTitles: [...deletedFavoriteSet],
    favorites: mergedFavorites.map((song) => song.title),
    remotePlaylists: mergedPlaylists,
  };
}

export default { syncLibraryState };

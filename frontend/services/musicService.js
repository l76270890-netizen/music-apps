import { api } from './api';

export async function getTracks({ query = '', limit } = {}) {
  const result = await api.get('/songs');
  const needle = query.trim().toLocaleLowerCase();
  const tracks = result.map((song) => ({
    ...song,
    duration: song.duration_seconds,
    time: `${Math.floor(song.duration_seconds / 60)}:${String(song.duration_seconds % 60).padStart(2, '0')}`,
    source: 'synced-metadata',
  })).filter((song) => !needle || `${song.title} ${song.artist} ${song.album}`.toLocaleLowerCase().includes(needle));
  return typeof limit === 'number' ? tracks.slice(0, limit) : tracks;
}

export function getAlbums() {
  return api.get('/albums');
}

export function getPlaylists() {
  return api.get('/playlists');
}

export default { getTracks, getAlbums, getPlaylists };

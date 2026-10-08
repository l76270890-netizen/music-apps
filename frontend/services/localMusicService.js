import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

function titleFromFilename(filename = '') {
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled track';
}

function durationLabel(seconds = 0) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function toTrack(asset, index) {
  const fileTitle = titleFromFilename(asset.filename || asset.name);
  const separator = fileTitle.indexOf(' - ');
  const title = separator > 0 ? fileTitle.slice(separator + 3) : fileTitle;
  const artist = asset.artist || (separator > 0 ? fileTitle.slice(0, separator) : 'Local audio');
  const duration = Number(asset.duration) || 0;
  return {
    id: String(asset.id || asset.uri || `${title}-${index}`),
    title,
    artist,
    album: asset.album || '',
    duration,
    time: durationLabel(duration),
    audioUrl: asset.uri,
    localUri: asset.uri,
    color: '#44305F',
    art: '♫',
    source: asset.source || 'device',
  };
}

export async function scanDeviceAudio() {
  if (Platform.OS === 'web') return { tracks: [], permission: 'unsupported' };
  const permission = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
  if (!permission.granted) return { tracks: [], permission: permission.status };
  const assets = [];
  let page;
  do {
    page = await MediaLibrary.getAssetsAsync({ mediaType: 'audio', first: 1000, after: page?.endCursor });
    assets.push(...page.assets);
  } while (page.hasNextPage && page.endCursor);
  const tracks = assets.map((asset, index) => toTrack({
    id: asset.id,
    filename: asset.filename,
    duration: asset.duration,
    uri: asset.uri,
    source: 'media-library',
  }, index));
  return { tracks, permission: permission.status };
}

export async function pickAudioFiles(existingTracks = []) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*', '.mp3', '.m4a', '.wav', '.aac', '.flac', '.ogg'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];

  const audioDirectory = `${FileSystem.documentDirectory}TuneIt/Music/`;
  if (Platform.OS !== 'web' && !(await FileSystem.getInfoAsync(audioDirectory)).exists) {
    await FileSystem.makeDirectoryAsync(audioDirectory, { intermediates: true });
  }
  const existingImports = new Map(existingTracks.filter((track) => track.source === 'imported').map((track) => [track.id, track]));
  return Promise.all(result.assets.map(async (asset, index) => {
    const stableId = `import-${asset.name.trim().toLocaleLowerCase()}-${asset.size || 0}`;
    if (Platform.OS !== 'web' && existingImports.has(stableId)) return existingImports.get(stableId);
    let uri = asset.uri;
    if (Platform.OS !== 'web') {
      const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `audio-${Date.now()}-${index}.mp3`;
      uri = `${audioDirectory}${Date.now()}-${index}-${safeName}`;
      await FileSystem.copyAsync({ from: asset.uri, to: uri });
    }
    return toTrack({ id: stableId, name: asset.name, uri, source: 'imported' }, index);
  }));
}

export function combineLocalTracks(...groups) {
  const byId = new Map();
  groups.flat().forEach((track) => { if (track?.id && track?.localUri) byId.set(track.id, track); });
  return [...byId.values()];
}

export default { scanDeviceAudio, pickAudioFiles, combineLocalTracks };

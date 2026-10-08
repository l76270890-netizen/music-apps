import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { combineLocalTracks, pickAudioFiles, scanDeviceAudio } from '../services/localMusicService';
import * as auth from '../services/authService';
import { metadataKey, syncLibraryState } from '../services/syncService';
import Storage from '../services/storage';

const MusicContext = createContext(null);
const seedPlaylists = [
  { id: 'liked-songs', name: 'Liked Songs', count: 0, color: '#824EFF', icon: '♥' },
];
const legacyDemoPlaylistIds = new Set(['chill-vibes', 'workout', 'afrobeats', 'rock-classics']);

export function MusicProvider({ children }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const playerStatus = useAudioPlayerStatus(player);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [liked, setLiked] = useState([]);
  const [removedFavoriteTitles, setRemovedFavoriteTitles] = useState([]);
  const [menu, setMenu] = useState(null);
  const [toast, setToast] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolumeState] = useState(0.72);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlists, setPlaylists] = useState(seedPlaylists);
  const [playlistTracks, setPlaylistTracks] = useState({});
  const [deletedRemotePlaylistIds, setDeletedRemotePlaylistIds] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [libraryStatus, setLibraryStatus] = useState('idle');
  const [libraryImporting, setLibraryImporting] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [stateHydrated, setStateHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authError, setAuthError] = useState('');
  const finishedTrackId = useRef(null);
  const toastTimeout = useRef(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentTrack) { player.setActiveForLockScreen(false); return; }
    player.setActiveForLockScreen(true, {
      title: currentTrack.title,
      artist: currentTrack.artist,
      albumTitle: currentTrack.album || undefined,
      artworkUrl: currentTrack.artwork || undefined,
    });
  }, [currentTrack, player]);

  useEffect(() => {
    let mounted = true;
    Storage.getItem('tuneit-library-v1').then((raw) => {
      if (!mounted) return;
      if (raw) {
        const saved = JSON.parse(raw);
        const storedTracks = Array.isArray(saved.localTracks) ? saved.localTracks : [];
        const savedTracks = Platform.OS === 'web' ? storedTracks.filter((track) => track.source !== 'imported') : storedTracks;
        const rawPlaylistTracks = saved.playlistTracks && typeof saved.playlistTracks === 'object' ? saved.playlistTracks : {};
        if (Array.isArray(saved.deletedRemotePlaylistIds)) setDeletedRemotePlaylistIds(saved.deletedRemotePlaylistIds);
        if (Array.isArray(saved.removedFavoriteTitles)) setRemovedFavoriteTitles(saved.removedFavoriteTitles);
        if (Array.isArray(saved.liked)) setLiked(saved.liked);
        const savedTrackIds = new Set(savedTracks.map((track) => track.id));
        const savedPlaylistTracks = Object.fromEntries(Object.entries(rawPlaylistTracks).map(([id, tracks]) => [id, Array.isArray(tracks) ? tracks.filter((track) => savedTrackIds.has(track.id)) : []]));
        if (Array.isArray(saved.playlists)) {
          const userPlaylists = saved.playlists.filter((playlist) => !legacyDemoPlaylistIds.has(playlist.id));
          if (!userPlaylists.some((playlist) => playlist.id === 'liked-songs')) userPlaylists.unshift(seedPlaylists[0]);
          setPlaylists(userPlaylists.map((playlist) => ({ ...playlist, count: (savedPlaylistTracks[playlist.id] || []).length })));
        }
        setPlaylistTracks(savedPlaylistTracks);
        setLocalTracks(savedTracks);
        if (Array.isArray(saved.recentTracks)) setRecentTracks(saved.recentTracks.filter((track) => savedTracks.some((local) => local.id === track.id)));
      }
      setStateHydrated(true);
    }).catch(() => { if (mounted) setStateHydrated(true); });
    auth.restoreSession().then((restoredUser) => {
      if (mounted) { setUser(restoredUser); setAuthStatus('ready'); }
    }).catch((error) => { if (mounted) { setAuthError(error?.message || 'Could not restore your account session.'); setAuthStatus('error'); } });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!stateHydrated) return;
    Storage.setItem('tuneit-library-v1', JSON.stringify({ liked, removedFavoriteTitles, playlists, playlistTracks, deletedRemotePlaylistIds, localTracks, recentTracks })).catch(() => {});
  }, [stateHydrated, liked, removedFavoriteTitles, playlists, playlistTracks, deletedRemotePlaylistIds, localTracks, recentTracks]);

  const notify = useCallback((message) => {
    setToast(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(''), 2400);
  }, []);

  useEffect(() => () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); }, []);

  const audioFor = useCallback((track) => {
    return track?.localUri || track?.audioUrl || null;
  }, []);

  const playTrack = useCallback((track, autoPlay = true) => {
    if (!track) return;
    const audioUrl = audioFor(track);
    if (!audioUrl) { notify('This track has no playable audio file on this device.'); return; }
    const nextTrack = { ...track, audioUrl };
    setHistory((items) => (currentTrack ? items.concat(currentTrack) : items).slice(-20));
    setRecentTracks((items) => [nextTrack, ...items.filter((item) => item.id !== nextTrack.id && item.title !== nextTrack.title)].slice(0, 30));
    setCurrentTrack(nextTrack);
    if (track.localUri) setQueue(localTracks.filter((item) => item.id !== track.id));
    player.replace(nextTrack.audioUrl);
    if (autoPlay) player.play();
  }, [audioFor, currentTrack, localTracks, notify, player]);

  const playTrackFromList = useCallback((track, tracks) => {
    const index = tracks.findIndex((item) => item.id === track?.id);
    playTrack(track);
    if (index >= 0) setQueue(tracks.slice(index + 1));
  }, [playTrack]);

  const scanLocalMusic = useCallback(async () => {
    setLibraryStatus('scanning');
    setLibraryError('');
    try {
      const result = await scanDeviceAudio();
      if (result.permission !== 'granted') {
        setLibraryStatus('permission-denied');
        setLibraryError(result.permission === 'unsupported'
          ? 'Automatic device scanning is available in the Android and iOS app. Use Add audio files on web.'
          : 'Allow audio access to scan music stored on this device.');
        return [];
      }
      setLocalTracks((items) => combineLocalTracks(items.filter((track) => track.source !== 'media-library'), result.tracks));
      setLibraryStatus('ready');
      if (!result.tracks.length) setLibraryError('No audio files were found. You can add files from your device.');
      return result.tracks;
    } catch (error) {
      setLibraryStatus('error');
      setLibraryError(error?.message || 'Could not scan device music.');
      return [];
    }
  }, []);

  const importLocalMusic = useCallback(async () => {
    setLibraryError('');
    setLibraryImporting(true);
    try {
      const imported = await pickAudioFiles(localTracks);
      setLocalTracks((items) => combineLocalTracks(items, imported));
      if (imported.length) setLibraryStatus('ready');
      return imported;
    } catch (error) {
      setLibraryError(error?.message || 'Could not add the selected audio files.');
      return [];
    } finally {
      setLibraryImporting(false);
    }
  }, [localTracks]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (playerStatus.playing) player.pause();
    else player.play();
  }, [currentTrack, player, playerStatus.playing]);

  const playNext = useCallback(() => {
    if (!queue.length) {
      if (repeat && currentTrack) {
        player.seekTo(0);
        player.play();
      } else {
        player.pause();
      }
      return;
    }
    const next = shuffle ? queue[Math.floor(Math.random() * queue.length)] : queue[0];
    setQueue((items) => items.filter((item) => item !== next));
    setHistory((items) => (currentTrack ? items.concat(currentTrack) : items).slice(-20));
    setRecentTracks((items) => [next, ...items.filter((item) => item.id !== next.id && item.title !== next.title)].slice(0, 30));
    setCurrentTrack(next);
    player.replace(audioFor(next));
    player.play();
  }, [audioFor, currentTrack, player, queue, repeat, shuffle]);

  const playQueuedTrack = useCallback((index) => {
    const selected = queue[index];
    if (!selected) return;
    playTrack(selected, false);
    setQueue(queue.slice(index + 1));
    player.play();
  }, [playTrack, player, queue]);

  useEffect(() => {
    if (!playerStatus.didJustFinish) {
      finishedTrackId.current = null;
      return;
    }
    if (!currentTrack || finishedTrackId.current === currentTrack.id) return;
    finishedTrackId.current = currentTrack.id;
    if (repeat) {
      player.seekTo(0);
      player.play();
    } else playNext();
  }, [playerStatus.didJustFinish, currentTrack, repeat, player, playNext]);

  const playPrevious = useCallback(() => {
    if (!currentTrack) return;
    if ((playerStatus.currentTime || 0) > 4) {
      player.seekTo(0);
      return;
    }
    const previous = history[history.length - 1];
    if (previous) {
      setHistory((items) => items.slice(0, -1));
      setQueue((items) => [currentTrack, ...items]);
      setRecentTracks((items) => [previous, ...items.filter((item) => item.id !== previous.id && item.title !== previous.title)].slice(0, 30));
      setCurrentTrack(previous);
      player.replace(audioFor(previous));
      player.play();
    } else player.seekTo(0);
  }, [audioFor, currentTrack, history, player, playerStatus.currentTime]);

  const addToQueue = useCallback((value) => {
    const tracks = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
    if (!tracks.length) return;
    setQueue((items) => [...items, ...tracks]);
    notify(tracks.length === 1 ? `${tracks[0].title} added to your queue` : `${tracks.length} songs added to your queue`);
  }, [notify]);

  const toggleLike = useCallback((track) => {
    if (liked.includes(track.title)) {
      setLiked((items) => items.filter((title) => title !== track.title));
      setRemovedFavoriteTitles((items) => items.includes(track.title) ? items : [...items, track.title]);
      notify('Removed from Liked Songs');
    } else {
      setLiked((items) => [...items, track.title]);
      setRemovedFavoriteTitles((items) => items.filter((title) => title !== track.title));
      notify('Added to Liked Songs');
    }
  }, [liked, notify]);

  const setVolume = useCallback((value) => {
    const safeVolume = Math.max(0, Math.min(1, value));
    setVolumeState(safeVolume);
    player.volume = safeVolume;
  }, [player]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    notify('Queue cleared');
  }, [notify]);

  const createPlaylist = useCallback((name, initialTrack = null) => {
    const cleanName = name.trim();
    if (!cleanName) return false;
    if (playlists.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
      notify('A playlist with that name already exists');
      return false;
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPlaylists((items) => [...items, { id, name: cleanName, count: initialTrack ? 1 : 0, color: '#7451BC', icon: '♫' }]);
    if (initialTrack) setPlaylistTracks((items) => ({ ...items, [id]: [initialTrack] }));
    notify(initialTrack ? `Created “${cleanName}” and added ${initialTrack.title}` : `Created “${cleanName}”`);
    return id;
  }, [notify, playlists]);

  const renamePlaylist = useCallback((id, name) => {
    const cleanName = name.trim();
    if (!cleanName) return false;
    if (id === 'liked-songs') { notify('Liked Songs cannot be renamed'); return false; }
    if (playlists.some((item) => item.id !== id && item.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) {
      notify('A playlist with that name already exists');
      return false;
    }
    setPlaylists((items) => items.map((item) => item.id === id ? { ...item, name: cleanName } : item));
    notify('Playlist renamed');
    return true;
  }, [notify, playlists]);

  const removePlaylist = useCallback((id) => {
    if (id === 'liked-songs') { notify('Liked Songs cannot be removed'); return; }
    const playlist = playlists.find((item) => item.id === id);
    if (playlist?.remoteId && !deletedRemotePlaylistIds.includes(playlist.remoteId)) {
      setDeletedRemotePlaylistIds((items) => [...items, playlist.remoteId]);
    }
    setPlaylists((items) => items.filter((item) => item.id !== id));
    setPlaylistTracks((items) => { const next = { ...items }; delete next[id]; return next; });
    notify('Playlist removed from your library');
  }, [deletedRemotePlaylistIds, notify, playlists]);

  const addTrackToPlaylist = useCallback((playlistId, track) => {
    if (!track || !playlists.some((item) => item.id === playlistId)) return false;
    const existing = playlistTracks[playlistId] || [];
    if (existing.some((item) => item.id === track.id)) { notify('This song is already in the playlist'); return false; }
    const updatedTracks = [...existing, track];
    setPlaylistTracks((items) => ({ ...items, [playlistId]: updatedTracks }));
    setPlaylists((items) => items.map((item) => item.id === playlistId ? { ...item, count: updatedTracks.length } : item));
    notify(`Added ${track.title} to playlist`);
    return true;
  }, [notify, playlistTracks, playlists]);

  const removeTrackFromPlaylist = useCallback((playlistId, track) => {
    const remaining = (playlistTracks[playlistId] || []).filter((item) => item.id !== track.id);
    setPlaylistTracks((items) => ({ ...items, [playlistId]: remaining }));
    setPlaylists((items) => items.map((item) => item.id === playlistId ? { ...item, count: remaining.length } : item));
  }, [playlistTracks]);

  const signIn = useCallback(async (email, password) => {
    const nextUser = await auth.signIn(email, password);
    setUser(nextUser);
    setAuthError('');
    setAuthStatus('ready');
    return nextUser;
  }, []);

  const signUp = useCallback(async (email, username, password) => {
    const nextUser = await auth.signUp(email, username, password);
    setUser(nextUser);
    setAuthError('');
    setAuthStatus('ready');
    return nextUser;
  }, []);

  const signOut = useCallback(async () => { await auth.signOut(); setUser(null); setAuthError(''); setAuthStatus('ready'); }, []);

  const syncLibrary = useCallback(async () => {
    if (!user) throw new Error('Sign in before syncing your library.');
    let result;
    try {
      result = await syncLibraryState({ localTracks, liked, playlists, playlistTracks, deletedRemotePlaylistIds, removedFavoriteTitles });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        await auth.signOut();
        setUser(null);
        setAuthError('Your account session expired. Sign in again.');
        setAuthStatus('error');
      }
      throw error;
    }
    setRemovedFavoriteTitles((items) => items.filter((title) => !result.deletedFavoriteTitles.includes(title)));
    setDeletedRemotePlaylistIds((items) => items.filter((id) => !result.deletedPlaylistIds.includes(id)));
    setLiked((items) => [...new Set([...items.filter((title) => !result.deletedFavoriteTitles.includes(title)), ...result.favorites])]);
    const tracksByKey = new Map(localTracks.map((track) => [metadataKey(track), track]));
    const remotePlaylistTracks = {};
    const cloudPlaylists = result.remotePlaylists.map((remote) => {
      const localPlaylist = playlists.find((item) => item.name.toLocaleLowerCase() === remote.name.toLocaleLowerCase());
      const localId = localPlaylist?.id || `cloud-${remote.id}`;
      remotePlaylistTracks[localId] = (remote.songs || []).map((song) => tracksByKey.get(song.device_key)).filter(Boolean);
      return { id: localId, remoteId: remote.id, name: remote.name, count: remotePlaylistTracks[localId].length, color: localPlaylist?.color || '#7451BC', icon: localPlaylist?.icon || '♫' };
    });
    setPlaylists((items) => {
      const remoteNames = new Set(cloudPlaylists.map((item) => item.name.toLocaleLowerCase()));
      return [...items.filter((item) => !remoteNames.has(item.name.toLocaleLowerCase())), ...cloudPlaylists];
    });
    setPlaylistTracks((items) => ({ ...items, ...remotePlaylistTracks }));
    notify(`Synced ${result.songs} songs and ${result.playlists} playlists`);
    return result;
  }, [user, localTracks, liked, playlists, playlistTracks, deletedRemotePlaylistIds, removedFavoriteTitles, notify]);

  const value = useMemo(() => ({
    player, playerStatus, currentTrack, queue, recentTracks, liked, playlists, playlistTracks, localTracks, libraryStatus, libraryImporting, libraryError, user, authStatus, authError, menu, toast, repeat, shuffle, volume, searchQuery,
    setMenu, setRepeat, setShuffle, playTrack, playTrackFromList, playQueuedTrack, togglePlay, playNext, playPrevious,
    addToQueue, toggleLike, setVolume, clearQueue, notify, setSearchQuery,
    createPlaylist, renamePlaylist, removePlaylist, scanLocalMusic, importLocalMusic, addTrackToPlaylist, removeTrackFromPlaylist,
    signIn, signUp, signOut, syncLibrary,
  }), [player, playerStatus, currentTrack, queue, liked, playlists, menu, toast, repeat, shuffle, volume, authError,
    playlistTracks, deletedRemotePlaylistIds, removedFavoriteTitles, localTracks, recentTracks, libraryStatus, libraryImporting, libraryError, user, authStatus, searchQuery, playTrack, playTrackFromList, playQueuedTrack, togglePlay, playNext, playPrevious, addToQueue, toggleLike, setVolume, clearQueue, notify, setSearchQuery, createPlaylist, renamePlaylist, removePlaylist, scanLocalMusic, importLocalMusic, addTrackToPlaylist, removeTrackFromPlaylist, signIn, signUp, signOut, syncLibrary]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used inside MusicProvider');
  return context;
}

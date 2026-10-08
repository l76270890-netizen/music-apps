import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, Image, Modal, Pressable, Share,
  useWindowDimensions, StatusBar, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';
import { useMusic } from '../context/MusicContext';
import MiniPlayer from './MiniPlayer';

function Label({ children, style }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

function formatTime(seconds = 0) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function Cover({ color = '#633F91', icon = '♫', size = 54, round = 12, imageUri }) {
  return (
    <View style={[s.cover, { width: size, height: size, borderRadius: round, backgroundColor: color }]}>
      {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={s.coverImage} /> : <><View style={s.coverGlow} /><Text style={[s.coverIcon, { fontSize: size * 0.43 }]}>{icon}</Text></>}
    </View>
  );
}

function Button({ children, onPress, style, textStyle, disabled = false }) {
  return <TouchableOpacity accessibilityRole="button" activeOpacity={0.78} disabled={disabled} onPress={onPress} style={[s.button, style, disabled && { opacity: 0.55 }]}>
    <Text style={[s.buttonText, textStyle]}>{children}</Text>
  </TouchableOpacity>;
}

function TrackRow({ item, index, onPress, trailing, onMenu }) {
  return (
    <View style={s.trackRow}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Play ${item.title}`} style={s.trackMain} activeOpacity={0.75} onPress={onPress}>
        <Text style={s.trackIndex}>{String(index + 1).padStart(2, '0')}</Text>
        <Cover size={46} color={item.color} icon={item.art} imageUri={item.artwork} />
        <View style={s.trackCopy}>
          <Text numberOfLines={1} style={s.trackTitle}>{item.title}</Text>
          <Text numberOfLines={1} style={s.trackSub}>{item.artist}</Text>
        </View>
      </TouchableOpacity>
      {trailing || <View style={s.rowActions}><Text style={s.duration}>{item.time}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`More options for ${item.title}`} onPress={() => onMenu?.(item)} style={s.rowMore}><Text style={s.more}>•••</Text></TouchableOpacity></View>}
    </View>
  );
}

function NavItem({ icon, title, route, active, compact }) {
  const router = useRouter();
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: Boolean(active) }} accessibilityLabel={title} onPress={() => router.push(route)} style={[compact ? s.bottomItem : s.navItem, active && (compact ? s.bottomItemActive : s.navItemActive)]}>
      <Text style={[compact ? s.bottomIcon : s.navIcon, active && s.activeText]}>{icon}</Text>
      <Text style={[compact ? s.bottomLabel : s.navLabel, active && s.activeText]}>{title}</Text>
    </TouchableOpacity>
  );
}

function SideBar({ screen }) {
  const router = useRouter();
  const { setMenu, playlists, playlistTracks, localTracks } = useMusic();
  const menu = [
    ['⌂', 'Home', '/', 'home'], ['⌕', 'Search', '/search', 'search'],
    ['▤', 'Your Library', '/library', 'library'], ['⇩', 'Offline Music', '/downloads', 'downloads'],
    ['♫', 'Playlists', '/playlists', 'playlists'], ['♡', 'Liked Songs', '/favorites', 'favorites'],
  ];
  return (
    <View style={s.sidebar}>
      <TouchableOpacity onPress={() => router.push('/')} style={s.brand}>
        <View style={s.brandIcon}><Text style={s.brandGlyph}>♫</Text></View>
        <View><Text style={s.brandName}>TuneIt</Text><Text style={s.brandSub}>Your Music, Your Way</Text></View>
      </TouchableOpacity>
      <View style={s.menu}>
        {menu.map(([icon, title, route, key]) => <NavItem key={key} icon={icon} title={title} route={route} active={screen === key} />)}
      </View>
      <View style={s.sideSectionHead}><Text style={s.sideHeading}>MY PLAYLISTS</Text><TouchableOpacity onPress={() => setMenu({ type: 'createPlaylist' })}><Text style={s.addIcon}>＋</Text></TouchableOpacity></View>
      {playlists.slice(0, 4).map((p) => (
        <View key={p.id || p.name} style={s.sidePlaylist}>
          <TouchableOpacity accessibilityRole="button" style={s.sidePlaylistMain} onPress={() => router.push(p.id === 'liked-songs' ? '/favorites' : `/playlists/${p.id}`)}>
            <Cover size={34} round={8} color={p.color} icon={p.icon} />
            <View style={s.trackCopy}><Text numberOfLines={1} style={s.sidePlaylistName}>{p.name}</Text><Text style={s.sidePlaylistMeta}>{(playlistTracks[p.id] || []).length} songs</Text></View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`More options for ${p.name}`} onPress={() => setMenu({ type: 'playlist', playlist: p })}><Text style={s.more}>•••</Text></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={() => router.push('/local-music')} style={s.localCard}>
        <Text style={s.localIcon}>▣</Text><View style={s.trackCopy}><Text style={s.sidePlaylistName}>Local Music</Text><Text style={s.sidePlaylistMeta}>{localTracks.length} songs on device</Text></View>
      </TouchableOpacity>
    </View>
  );
}

function MiniNowPlaying({ router }) {
  const { player, currentTrack, queue, playerStatus, togglePlay, playQueuedTrack, playNext, playPrevious, setMenu, setRepeat, repeat, shuffle, setShuffle, volume, setVolume, clearQueue } = useMusic();
  const [seekWidth, setSeekWidth] = useState(274);
  const [volumeWidth, setVolumeWidth] = useState(200);
  if (!currentTrack) return <View style={s.rightPanel}><Text style={s.nowEyebrow}>YOUR PLAYER</Text><View style={[s.nowArt, { alignItems: 'center' }]}><Text style={s.scanMusic}>♫</Text></View><Text style={s.nowTitle}>No song selected</Text><Text style={s.nowArtist}>Choose a file from Local Music.</Text><TouchableOpacity onPress={() => router.push('/local-music')} style={{ marginTop: 18 }}><Text style={s.seeAll}>Open local library ↗</Text></TouchableOpacity></View>;
  const progress = playerStatus.duration ? playerStatus.currentTime / playerStatus.duration : 0;
  return (
      <View style={s.rightPanel}>
      <View style={s.nowTop}><Text style={s.nowEyebrow}>NOW PLAYING</Text><TouchableOpacity onPress={() => setMenu({ type: 'track', track: currentTrack })}><Text style={s.more}>•••</Text></TouchableOpacity></View>
      <TouchableOpacity onPress={() => router.push('/player/1')} activeOpacity={0.85}>
        <View style={s.nowArt}><Cover size={190} round={20} color={currentTrack.color} icon={currentTrack.art} imageUri={currentTrack.artwork} /></View>
        <Text style={s.nowTitle}>{currentTrack.title}</Text><Text style={s.nowArtist}>{currentTrack.artist}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="adjustable" accessibilityLabel="Seek in track" activeOpacity={1} onLayout={(event) => setSeekWidth(event.nativeEvent.layout.width || 274)} onPress={(event) => playerStatus.duration && player.seekTo((event.nativeEvent.locationX / seekWidth) * playerStatus.duration)} style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /><View style={[s.progressDot, { left: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /></TouchableOpacity>
      <View style={s.timeRow}><Text style={s.duration}>{formatTime(playerStatus.currentTime)}</Text><Text style={s.duration}>{formatTime(playerStatus.duration || currentTrack.duration)}</Text></View>
      <View style={s.playerControls}><TouchableOpacity accessibilityRole="button" accessibilityLabel={shuffle ? 'Disable shuffle' : 'Enable shuffle'} onPress={() => setShuffle(!shuffle)}><Text style={[s.control, shuffle && s.activeText]}>⤨</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous track" onPress={playPrevious}><Text style={s.control}>|◀</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={playerStatus.playing ? 'Pause' : 'Play'} onPress={togglePlay} style={s.playButton}><Text style={s.playGlyph}>{playerStatus.playing ? 'Ⅱ' : '▶'}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Next track" onPress={playNext}><Text style={s.control}>▶|</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={repeat ? 'Disable repeat' : 'Enable repeat'} onPress={() => setRepeat(!repeat)}><Text style={[s.control, repeat && s.activeText]}>⤻</Text></TouchableOpacity></View>
       <View style={s.volume}>
         <Text style={s.duration}>◖</Text>
         <TouchableOpacity
           accessibilityRole="adjustable"
           accessibilityLabel="Volume"
           onLayout={(event) => setVolumeWidth(event.nativeEvent.layout.width || 200)}
           onPress={(event) => setVolume(event.nativeEvent.locationX / volumeWidth)}
           style={[s.progressTrack, s.volumeTrack]}
         >
           <View style={[s.progressFill, { width: `${volume * 100}%` }]} />
         </TouchableOpacity>
       </View>
      <View style={s.queueHeader}><Text style={s.queueTitle}>Up next <Text style={s.trackSub}>· {queue.length} songs</Text></Text><TouchableOpacity onPress={clearQueue}><Text style={s.seeAll}>Clear</Text></TouchableOpacity></View>
      {[currentTrack, ...queue].slice(0, 5).map((track, i) => <TrackRow key={`${track.title}-${i}`} item={track} index={i} onPress={() => i > 0 && playQueuedTrack(i - 1)} trailing={i === 0 ? <Text style={s.equalizer}>▂▅▇</Text> : undefined} onMenu={(item) => setMenu({ type: 'track', track: item })} />)}
    </View>
  );
}

function TopBar() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setMenu, user } = useMusic();
  return (
    <View style={s.topBar}>
      <View style={[s.searchBox, s.topSearchBox]}><Text style={s.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={() => router.push('/search')} returnKeyType="search" placeholder="Search songs, artists, albums, playlists..." placeholderTextColor={colors.muted} style={s.searchInput} /></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={user ? `Account for ${user.username}` : 'Sign in'} onPress={() => setMenu({ type: 'profile' })} style={s.profile}><Text style={s.avatar}>{user?.username?.[0]?.toUpperCase() || '♫'}</Text><Text style={s.profileName}>{user?.username || 'Sign in'}</Text><Text style={s.profileChevron}>⌄</Text></TouchableOpacity>
    </View>
  );
}

function HomeScreen({ router, compact }) {
  const { localTracks, recentTracks, currentTrack, liked, user, searchQuery, setSearchQuery, playTrackFromList, setMenu } = useMusic();
  const [category, setCategory] = useState('All');
  const searchTerm = searchQuery.trim().toLocaleLowerCase();
  const recentItems = [];
  const recentIds = new Set();
  for (const track of recentTracks) {
    const id = track.id ?? track.uri ?? `${track.title}-${track.artist}`;
    if (!recentIds.has(id)) {
      recentIds.add(id);
      recentItems.push(track);
    }
  }
  const visibleTracks = searchTerm
    ? localTracks.filter((track) => `${track.title} ${track.artist} ${track.album || ''}`.toLocaleLowerCase().includes(searchTerm))
    : localTracks.filter((track) => !recentIds.has(track.id ?? track.uri ?? `${track.title}-${track.artist}`));
  const categoryTracks = category === 'Recent'
    ? recentItems
    : category === 'Liked'
      ? localTracks.filter((track) => liked.includes(track.title))
      : localTracks;
  const recommendations = [...recentItems, ...localTracks.filter((track) => !recentIds.has(track.id ?? track.uri ?? `${track.title}-${track.artist}`))].slice(0, 6);
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <>
      {compact && <View style={s.mobileHomeTop}>
        {!searchTerm && <View style={s.greetingRow}>
          <View><Text style={s.greeting}>{greeting}</Text><Text style={s.homeSearchTitle}>Make today{'\n'}sound better</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Account" onPress={() => setMenu({ type: 'profile' })} style={s.homeAvatar}><Text style={s.homeAvatarText}>{user?.username?.[0]?.toUpperCase() || '♫'}</Text></TouchableOpacity>
        </View>}
        <View style={[s.searchBox, s.homeSearchBox]}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search your music"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => router.push('/search')}
            returnKeyType="search"
            placeholder="Search your offline music"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
          {!!searchQuery && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchQuery('')} style={s.searchClear}><Text style={s.searchClearText}>×</Text></TouchableOpacity>}
        </View>
        {!searchTerm && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.homeCategoryRow}>
          {['All', 'Recent', 'Liked'].map((item) => <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[s.homeCategory, category === item && s.homeCategoryActive]}><Text style={[s.homeCategoryText, category === item && s.homeCategoryTextActive]}>{item}</Text></TouchableOpacity>)}
        </ScrollView>}
      </View>}
      {searchTerm ? <>
        <View style={s.sectionHeader}><Label>Search results</Label><Text style={s.pageSub}>{visibleTracks.length} {visibleTracks.length === 1 ? 'song' : 'songs'}</Text></View>
        {visibleTracks.map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, visibleTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
        {!visibleTracks.length && <Text style={s.emptyText}>No songs match “{searchQuery}”. Try another title or artist.</Text>}
      </> : compact ? <>
        {!!currentTrack && <TouchableOpacity onPress={() => router.push('/player/1')} style={s.offlineNowPlaying}><View style={s.offlineDot} /><Text style={s.offlineNowText} numberOfLines={1}>Now playing · {currentTrack.title}</Text><Text style={s.offlineNowArrow}>›</Text></TouchableOpacity>}
        <View style={[s.sectionHeader, s.homeSectionHeader]}><Label>For you</Label><TouchableOpacity onPress={() => router.push('/local-music')}><Text style={s.seeAll}>My library ›</Text></TouchableOpacity></View>
        {recommendations.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recommendationRow}>
          {recommendations.map((item, index) => <TouchableOpacity key={item.id ?? item.uri ?? `${item.title}-${index}`} activeOpacity={0.85} onPress={() => playTrackFromList(item, recommendations)} style={s.recommendationCard}>
            <View style={s.recommendationArt}><Cover size={148} round={17} color={item.color} icon={item.art} imageUri={item.artwork} /><View style={s.recommendationPlay}><Text style={s.recommendationPlayGlyph}>▶</Text></View></View>
            <Text numberOfLines={1} style={s.recommendationTitle}>{item.title}</Text><Text numberOfLines={1} style={s.recommendationArtist}>{item.artist}</Text>
          </TouchableOpacity>)}
        </ScrollView> : <View style={s.homeEmpty}><Text style={s.homeEmptyTitle}>Your music starts here</Text><Text style={s.homeEmptyText}>Add audio files stored on this device to build your offline library.</Text><Button onPress={() => router.push('/local-music')}>Add local music</Button></View>}
        <View style={[s.sectionHeader, s.trendingHeader]}><Label>{category === 'All' ? 'Your music' : category === 'Recent' ? 'Recently played' : 'Liked songs'}</Label><TouchableOpacity onPress={() => router.push(category === 'Liked' ? '/favorites' : '/local-music')}><Text style={s.seeAll}>See all ›</Text></TouchableOpacity></View>
        {categoryTracks.slice(0, 8).map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, categoryTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
        {!categoryTracks.length && <Text style={s.emptyText}>{category === 'Liked' ? 'Like a song to find it here.' : category === 'Recent' ? 'Recently played songs will show here.' : 'Add local audio to see your music here.'}</Text>}
      </> : <>
        <View style={s.hero}>
          <View style={s.heroGlow} /><View style={[s.heroCopy, compact && s.heroCopyCompact]}>
            <Text style={s.heroEyebrow}>YOUR MUSIC, ON YOUR DEVICE</Text><Text style={s.heroTitle}>Your library.{ '\n' }Your way.</Text>
            <Text style={s.heroSub}>Find and play audio stored on this phone. Your music stays yours.</Text>
            <Button onPress={() => router.push('/local-music')}>Open local music　↗</Button>
          </View>
        </View>
        <View style={s.sectionHeader}><Label>Your music</Label><TouchableOpacity onPress={() => router.push('/local-music')}><Text style={s.seeAll}>See all · {localTracks.length}</Text></TouchableOpacity></View>
        {currentTrack && <View style={s.sectionHeader}><Text style={s.pageSub}>Now playing: {currentTrack.title}</Text><TouchableOpacity onPress={() => router.push('/player/1')}><Text style={s.seeAll}>Open player</Text></TouchableOpacity></View>}
        {!!recentItems.length && <><View style={[s.sectionHeader, { marginTop: 20 }]}><Label>Recently played</Label></View>{recentItems.slice(0, 5).map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} compact onPress={() => playTrackFromList(item, recentItems)} onMenu={(track) => setMenu({ type: 'track', track })} />)}</>}
        {visibleTracks.map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, visibleTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
        {!localTracks.length && <Text style={s.emptyText}>Your library is empty. Scan the device or add audio files to get started.</Text>}
      </>}
    </>
  );
}

function LibraryScreen({ router }) {
  const [tab, setTab] = useState('Playlists');
  const { setMenu, playlists, playlistTracks, localTracks, playTrackFromList } = useMusic();
  const artists = [...new Set(localTracks.map((track) => track.artist).filter(Boolean))];
  const albums = [...new Set(localTracks.map((track) => track.album).filter(Boolean))];
  return <>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Your Library</Text><Text style={s.pageSub}>{localTracks.length} songs · stored on this device</Text></View><TouchableOpacity onPress={() => setMenu({ type: 'createPlaylist' })}><Text style={s.addIcon}>＋</Text></TouchableOpacity></View>
    <View style={s.chips}>{['Playlists', 'Songs', 'Artists', 'Albums'].map((v) => <TouchableOpacity key={v} onPress={() => setTab(v)} style={[s.chip, tab === v && s.chipActive]}><Text style={[s.chipText, tab === v && s.activeText]}>{v}</Text></TouchableOpacity>)}</View>
    {tab === 'Songs' && localTracks.map((item, i, list) => <TrackRow key={item.id} item={item} index={i} onPress={() => playTrackFromList(item, list)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {tab === 'Playlists' && playlists.filter((item) => item.id !== 'liked-songs').map((item) => <View key={item.id} style={s.libraryRow}><TouchableOpacity style={s.libraryMain} onPress={() => router.push(`/playlists/${item.id}`)}><Cover size={55} color={item.color} icon={item.icon} /><View style={s.trackCopy}><Text style={s.trackTitle}>{item.name}</Text><Text style={s.trackSub}>{(playlistTracks[item.id] || []).length} songs</Text></View></TouchableOpacity><TouchableOpacity style={s.moreButton} onPress={() => setMenu({ type: 'playlist', playlist: item })}><Text style={s.more}>•••</Text></TouchableOpacity></View>)}
    {tab === 'Artists' && artists.map((artist) => <View key={artist} style={s.libraryRow}><Cover size={55} color="#353549" icon="♫" /><View style={s.trackCopy}><Text style={s.trackTitle}>{artist}</Text><Text style={s.trackSub}>{localTracks.filter((item) => item.artist === artist).length} songs</Text></View></View>)}
    {tab === 'Albums' && albums.map((album) => <View key={album} style={s.libraryRow}><Cover size={55} color="#353549" icon="♫" /><View style={s.trackCopy}><Text style={s.trackTitle}>{album}</Text><Text style={s.trackSub}>{localTracks.filter((item) => item.album === album).length} songs</Text></View></View>)}
    {tab !== 'Songs' && tab !== 'Playlists' && !(tab === 'Artists' ? artists.length : albums.length) && <Text style={s.emptyText}>No {tab.toLowerCase()} information found in your local audio files.</Text>}
    {tab === 'Songs' && !localTracks.length && <Text style={s.emptyText}>Scan your device to find local audio files.</Text>}
    {tab === 'Playlists' && !playlists.filter((item) => item.id !== 'liked-songs').length && <Text style={s.emptyText}>Create your first playlist with the + button.</Text>}
  </>;
}

function FavoritesScreen({ router }) {
  const { liked, localTracks, toggleLike, playTrackFromList, setMenu } = useMusic();
  const favorites = localTracks.filter((item) => liked.includes(item.title));
  const elsewhereCount = Math.max(0, liked.filter((title) => !localTracks.some((item) => item.title === title)).length);
  return <>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Liked Songs</Text><Text style={s.pageSub}>{favorites.length} available on this device{elsewhereCount ? ` · ${elsewhereCount} synced from another device` : ''}</Text></View><Text style={s.addIcon}>♥</Text></View>
    <Button disabled={!favorites.length} onPress={() => { if (!favorites[0]) return; playTrackFromList(favorites[0], favorites); router.push('/player/1'); }}>▶　Play all</Button>
    <View style={{ marginTop: 16 }}>{favorites.map((item, i) => <TrackRow key={item.id} item={item} index={i} onPress={() => { playTrackFromList(item, favorites); router.push('/player/1'); }} onMenu={(track) => setMenu({ type: 'track', track })} trailing={<View style={s.rowActions}><TouchableOpacity onPress={() => toggleLike(item)}><Text style={s.heart}>♥</Text></TouchableOpacity><TouchableOpacity onPress={() => setMenu({ type: 'track', track: item })}><Text style={s.more}>•••</Text></TouchableOpacity></View>} />)}</View>
    {!favorites.length && <Text style={s.emptyText}>Songs you like will show up here.</Text>}
  </>;
}

function SearchScreen() {
  const { localTracks, searchQuery, setSearchQuery, playTrackFromList, setMenu } = useMusic();
  const results = localTracks.filter((item) => `${item.title} ${item.artist} ${item.album || ''}`.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
  return <>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Search your music</Text><Text style={s.pageSub}>Search audio files on this device.</Text></View></View>
    <View style={s.searchBox}><Text style={s.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Songs, artists, albums..." placeholderTextColor={colors.muted} style={s.searchInput} /></View>
    {searchQuery ? <Label style={s.listCaption}>{results.length} RESULTS</Label> : null}
    {results.map((item, i) => <TrackRow key={item.id} item={item} index={i} onPress={() => playTrackFromList(item, results)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {!results.length && <Text style={s.emptyText}>{localTracks.length ? 'No matching songs.' : 'Scan your device first to search local music.'}</Text>}
  </>;
}

function LocalMusicScreen() {
  const { localTracks, libraryStatus, libraryImporting, libraryError, scanLocalMusic, importLocalMusic, playTrackFromList, setMenu } = useMusic();
  useEffect(() => { scanLocalMusic(); }, [scanLocalMusic]);
  const statusLabel = libraryStatus === 'scanning' ? 'Scanning audio on this device…' : libraryImporting ? 'Adding selected audio…' : `${localTracks.length} songs on this device`;
  return <View>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Local Music</Text><Text style={s.pageSub}>{statusLabel}</Text></View><Text style={s.downloadCount}>♫ {localTracks.length}</Text></View>
    <View style={s.playlistActions}>
      <Button disabled={libraryStatus === 'scanning' || libraryImporting} onPress={scanLocalMusic} style={s.secondaryButton}>{libraryStatus === 'scanning' ? 'Scanning…' : '↻  Scan device'}</Button>
      <Button disabled={libraryStatus === 'scanning' || libraryImporting} onPress={importLocalMusic}>{libraryImporting ? 'Adding…' : '＋  Add audio files'}</Button>
    </View>
    {!!libraryError && <Text style={[s.pageSub, { marginBottom: 12 }]}>{libraryError}</Text>}
    {localTracks.map((item, index) => <TrackRow key={item.id} item={item} index={index} onPress={() => playTrackFromList(item, localTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {!localTracks.length && libraryStatus !== 'scanning' && <View style={s.scanScreen}>
      <View style={s.scanOrb}><Text style={s.scanMusic}>♫</Text><View style={s.orbit} /></View>
      <Text style={[s.pageSub, { textAlign: 'center', maxWidth: 300 }]}>Scan this device or choose audio files to build your offline library. Your music stays on this device.</Text>
    </View>}
  </View>;
}

function DownloadsScreen({ router }) {
  const { localTracks, playTrackFromList, setMenu } = useMusic();
  return <>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Offline Music</Text><Text style={s.pageSub}>Audio files available on this device.</Text></View><Text style={s.downloadCount}>♫ {localTracks.length}</Text></View>
    {localTracks.map((item, i) => <TrackRow key={item.id} item={item} index={i} onPress={() => { playTrackFromList(item, localTracks); router.push('/player/1'); }} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {!localTracks.length && <Text style={s.emptyText}>No local audio has been added yet. Open Local Music to scan your device or select files.</Text>}
  </>;
}

function PlaylistScreen({ router, playlistId, compact }) {
  const { playlists, playlistTracks, playTrackFromList, removeTrackFromPlaylist, setMenu, setShuffle } = useMusic();
  const selectedPlaylist = playlists.find((item) => item.id === String(playlistId)) || (!playlistId ? playlists[0] : null);
  if (!selectedPlaylist) return <View><Text style={s.pageTitle}>Playlist not found</Text><Text style={s.pageSub}>It may have been removed from your library.</Text><Button onPress={() => router.replace('/playlists')}>Back to playlists</Button></View>;
  const songs = playlistTracks[selectedPlaylist?.id] || [];
  return <>
    {compact ? <View style={s.mobilePlaylistArtwork}>
      {songs[0]?.artwork ? <Image source={{ uri: songs[0].artwork }} resizeMode="cover" style={s.coverImage} /> : <View style={[s.mobilePlaylistFallback, { backgroundColor: selectedPlaylist.color || '#D9D3E7' }]}><Text style={s.mobilePlaylistGlyph}>{selectedPlaylist.icon || '♫'}</Text></View>}
      <View style={s.mobilePlaylistShade} />
      <View style={s.mobilePlaylistCopy}><Text style={s.mobilePlaylistEyebrow}>OFFLINE PLAYLIST</Text><Text style={s.mobilePlaylistTitle}>{selectedPlaylist.name}</Text><Text style={s.mobilePlaylistSub}>{songs.length} songs · available on this device</Text></View>
    </View> : <View style={s.playlistHero}><Cover size={compactSize()} color={selectedPlaylist?.color || '#EF9475'} icon={selectedPlaylist?.icon || '♫'} /><View style={s.playlistInfo}><Text style={s.listCaption}>OFFLINE PLAYLIST</Text><Text style={s.pageTitle}>{selectedPlaylist?.name || 'Playlist'}</Text><Text style={s.pageSub}>{songs.length} songs · your device</Text></View></View>}
    <View style={s.playlistActions}>
      <Button disabled={!songs.length} onPress={() => songs[0] && playTrackFromList(songs[0], songs)}>▶　Play</Button>
      {compact && <Button disabled={!songs.length} onPress={() => { setShuffle(true); if (songs[0]) playTrackFromList(songs[0], songs); }} style={s.shufflePlaylistButton}>⤨　Shuffle</Button>}
      <Button accessibilityRole="button" onPress={() => setMenu({ type: 'playlist', playlist: selectedPlaylist })} style={s.secondaryButton}>•••</Button>
    </View>
    <Label style={s.listCaption}>TRACKS · {songs.length}</Label>
    {songs.map((item, i) => <TrackRow key={item.id || item.title} item={item} index={i} onPress={() => playTrackFromList(item, songs)} onMenu={(track) => setMenu({ type: 'track', track, playlistId: selectedPlaylist?.id })} trailing={<View style={s.rowActions}><Text style={s.duration}>{item.time}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${item.title} from playlist`} onPress={() => removeTrackFromPlaylist(selectedPlaylist.id, item)}><Text style={s.more}>−</Text></TouchableOpacity></View>} />)}
    {!songs.length && <Text style={s.emptyText}>Add tracks to this playlist from a song’s ••• menu.</Text>}
  </>;
}

function PlayerScreen({ compact }) {
  const { currentTrack, playerStatus, togglePlay, playNext, playPrevious, liked, toggleLike, setMenu, setRepeat, repeat, shuffle, setShuffle, player } = useMusic();
  const [progressWidth, setProgressWidth] = useState(520);
  const progress = playerStatus.duration ? playerStatus.currentTime / playerStatus.duration : 0;
  if (!currentTrack) return <View style={[s.fullPlayer, compact && s.fullPlayerCompact]}><View style={s.scanOrb}><Text style={s.scanMusic}>♫</Text></View><Text style={s.pageTitle}>Choose a song</Text><Text style={[s.pageSub, { textAlign: 'center' }]}>Scan this device or add an audio file to start listening.</Text></View>;
  return <View style={[s.fullPlayer, compact && s.fullPlayerCompact]}>
    {compact && <View style={s.playerSource}><Text style={s.playerSourceEyebrow}>PLAYING FROM</Text><Text style={s.playerSourceName} numberOfLines={1}>{currentTrack.album || 'Your offline library'}</Text></View>}
    <View style={[s.playerArtwork, compact && s.playerArtworkCompact]}>{currentTrack.artwork ? <Image source={{ uri: currentTrack.artwork }} resizeMode="cover" style={s.coverImage} /> : <View style={s.playerArtworkFallback}><Text style={s.playerSilhouette}>♫</Text><Text style={s.playerOfflineStamp}>ON THIS DEVICE</Text></View>}</View>
    <View style={s.playerMeta}><View style={s.playerTrackInfo}><Text numberOfLines={1} style={[s.nowTitle, s.playerTrackName]}>{currentTrack.title}</Text><Text numberOfLines={1} style={[s.nowArtist, s.playerTrackArtist]}>{currentTrack.artist}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={liked.includes(currentTrack.title) ? 'Unlike song' : 'Like song'} onPress={() => toggleLike(currentTrack)}><Text style={[s.heart, liked.includes(currentTrack.title) && { color: colors.accent }]}>{liked.includes(currentTrack.title) ? '♥' : '♡'}</Text></TouchableOpacity></View>
    <TouchableOpacity accessibilityRole="adjustable" accessibilityLabel="Seek in track" activeOpacity={1} onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width || 520)} onPress={(event) => playerStatus.duration && player.seekTo((event.nativeEvent.locationX / progressWidth) * playerStatus.duration)} style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /><View style={[s.progressDot, { left: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /></TouchableOpacity><View style={s.timeRow}><Text style={s.duration}>{formatTime(playerStatus.currentTime)}</Text><Text style={s.duration}>{formatTime(playerStatus.duration || currentTrack.duration)}</Text></View>
    <View style={s.playerControls}><TouchableOpacity accessibilityRole="button" accessibilityLabel={shuffle ? 'Disable shuffle' : 'Enable shuffle'} onPress={() => setShuffle(!shuffle)}><Text style={[s.control, shuffle && s.activeText]}>⤨</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous track" onPress={playPrevious}><Text style={s.control}>|◀</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={playerStatus.playing ? 'Pause' : 'Play'} onPress={togglePlay} style={[s.playButton, s.bigPlay]}><Text style={s.playGlyph}>{playerStatus.playing ? 'Ⅱ' : '▶'}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Next track" onPress={playNext}><Text style={s.control}>▶|</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={repeat ? 'Disable repeat' : 'Enable repeat'} onPress={() => setRepeat(!repeat)}><Text style={[s.control, repeat && s.activeText]}>⤻</Text></TouchableOpacity></View>
    <View style={s.playerExtras}><TouchableOpacity onPress={() => setMenu({ type: 'lyrics', track: currentTrack })}><Text style={s.duration}>▤　Lyrics</Text></TouchableOpacity><TouchableOpacity onPress={() => setMenu({ type: 'queue' })}><Text style={s.duration}>☷　Queue</Text></TouchableOpacity></View>
    {compact && <View style={s.offlineListening}><Text style={s.offlineListeningIcon}>♫</Text><View style={{ flex: 1 }}><Text style={s.offlineListeningTitle}>Offline playback</Text><Text style={s.offlineListeningSub}>This song is stored on your device</Text></View><Text style={s.offlineListeningCheck}>✓</Text></View>}
  </View>;
}

function ActionMenu({ router }) {
  const { menu, setMenu, currentTrack, queue, liked, playlists, playlistTracks, user, playTrack, playTrackFromList, playQueuedTrack, toggleLike, addToQueue, clearQueue, notify, createPlaylist, renamePlaylist, removePlaylist, addTrackToPlaylist, scanLocalMusic, signOut } = useMusic();
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (menu?.type === 'createPlaylist') setDraft('');
    else if (menu?.type === 'editPlaylist') setDraft(menu.playlist?.name || '');
  }, [menu]);
  if (!menu) return null;
  const track = menu.track || currentTrack;
  const playlist = menu.playlist || menu.item;
  let heading = track?.title || 'TuneIt';
  let actions = [];
  if (menu.type === 'track') actions = [
    ['▶', 'Play now', 'play'], ['＋', 'Add to queue', 'queue'],
    ['♫', 'Go to now playing', 'now'],
    [liked.includes(track.title) ? '♥' : '♡', liked.includes(track.title) ? 'Remove from Liked Songs' : 'Add to Liked Songs', 'like'], ['＋', 'Add to playlist', 'open-add-track'], ['↗', 'Share track', 'share'],
  ];
  else if (menu.type === 'selectPlaylist') {
    heading = `Add “${track.title}” to…`;
    actions = playlists.filter((item) => item.id !== 'liked-songs').map((item) => ['♫', item.name, `playlist-add:${item.id}`]);
    if (!actions.length) actions = [['＋', 'Create a playlist first', 'open-create-playlist']];
  }
  else if (menu.type === 'playlist') {
    heading = playlist?.name || 'Playlist options';
    actions = [['▶', 'Play playlist', 'playlist-play'], ['＋', 'Add playlist to queue', 'playlist-queue'], ['↗', 'Share playlist', 'share'], ['✎', 'Rename playlist', 'edit'], ['−', 'Remove from library', 'remove']];
  } else if (menu.type === 'collection') {
    heading = playlist?.name || menu.kind || 'Collection';
    actions = [['▶', 'Play collection', 'play'], ['＋', 'Add to queue', 'queue'], ['↗', 'Share collection', 'share']];
  } else if (menu.type === 'profile') {
    heading = user?.username || 'TuneIt account';
    actions = user ? [['◉', 'Account and sync', 'settings'], ['↪', 'Sign out', 'signout']] : [['◉', 'Sign in or create account', 'settings']];
  } else if (menu.type === 'notifications') {
    heading = 'Notifications';
    actions = [['✓', 'You’re all caught up', 'noop'], ['⚙', 'Notification settings', 'settings']];
  } else if (menu.type === 'queue') {
    heading = `Up next · ${queue.length} tracks`;
    actions = queue.slice(0, 7).map((item, index) => ['♫', `${index + 1}. ${item.title} — ${item.artist}`, `queue-${index}`]);
    if (queue.length) actions.push(['×', 'Clear queue', 'clear-queue']);
    if (!queue.length) actions.push(['✓', 'Your queue is empty', 'noop']);
  } else if (menu.type === 'lyrics') {
    heading = `${track.title} · Lyrics`;
    actions = [['♫', 'Lyrics are not available for local files yet.', 'noop']];
  } else if (menu.type === 'local') {
    heading = 'Local Music';
    actions = [['⟳', 'Scan device again', 'scan'], ['▤', 'Open local library', 'local']];
  } else if (menu.type === 'createPlaylist') {
    heading = 'New playlist';
  } else if (menu.type === 'editPlaylist') {
    heading = 'Rename playlist';
  }

  const choose = async (action) => {
    if (action === 'open-add-track') { setMenu({ type: 'selectPlaylist', track }); return; }
    if (action === 'open-create-playlist') { setMenu({ type: 'createPlaylist', pendingTrack: track }); return; }
    if (action.startsWith('playlist-add:')) { addTrackToPlaylist(action.slice('playlist-add:'.length), track); setMenu(null); return; }
    if (action === 'create') {
      const createdId = createPlaylist(draft, menu.pendingTrack);
      if (createdId) {
        setMenu(null);
      }
      return;
    }
    if (action === 'rename') {
      if (renamePlaylist(menu.playlist?.id, draft)) setMenu(null);
      return;
    }
    if (action === 'edit') {
      setMenu({ type: 'editPlaylist', playlist });
      return;
    }
    if (action === 'remove') {
      removePlaylist(playlist?.id);
      setMenu(null);
      return;
    }
    setMenu(null);
    if (action === 'play') { playTrack(track); router.push('/player/1'); }
    else if (action === 'now') router.push('/player/1');
    else if (action === 'queue') addToQueue(track);
    else if (action === 'like') toggleLike(track);
    else if (action === 'playlist-play') { const songs = playlistTracks[playlist?.id] || []; if (songs[0]) { playTrackFromList(songs[0], songs); router.push('/player/1'); } else notify('Add songs to this playlist first'); }
    else if (action === 'playlist-queue') addToQueue(playlistTracks[playlist?.id] || []);
    else if (action === 'share') {
      try { await Share.share({ message: `Listen to ${playlist?.name || track.title} on TuneIt.` }); }
      catch { notify('Sharing is unavailable on this device'); }
    } else if (action === 'local') router.push('/local-music');
    else if (action === 'scan') { await scanLocalMusic(); router.push('/local-music'); }
    else if (action === 'clear-queue') clearQueue();
    else if (action.startsWith('queue-')) {
      const index = Number(action.split('-')[1]);
      const selected = queue[index];
      if (selected) { playQueuedTrack(index); router.push('/player/1'); }
    } else if (action === 'edit') notify('Playlist editor opened');
    else if (action === 'remove') notify('Playlist removed from your library');
    else if (action === 'settings') router.push('/account');
    else if (action === 'plus') notify('TuneIt Plus is coming soon');
    else if (action === 'signout') {
      try { await signOut(); notify('Signed out'); }
      catch (error) { notify(error?.message || 'Could not sign out'); }
    }
  };

  return <Modal transparent animationType="fade" visible onRequestClose={() => setMenu(null)}>
    <View style={s.modalRoot}>
      <Pressable style={s.modalBackdrop} onPress={() => setMenu(null)} />
      <View style={s.actionSheet}>
        <View style={s.sheetHandle} />
        <Text numberOfLines={1} style={s.sheetTitle}>{heading}</Text>
        {menu.type === 'track' && <Text style={s.sheetSubtitle}>{track.artist}</Text>}
        {(menu.type === 'createPlaylist' || menu.type === 'editPlaylist') && <View style={s.createPlaylistForm}><TextInput autoFocus value={draft} onChangeText={setDraft} placeholder="Give your playlist a name" placeholderTextColor={colors.muted} style={s.playlistNameInput} /><Button onPress={() => choose(menu.type === 'createPlaylist' ? 'create' : 'rename')} style={s.savePlaylistButton}>Save playlist</Button></View>}
        <ScrollView style={s.sheetOptions} bounces={false}>
          {actions.map(([icon, label, action]) => <TouchableOpacity key={action} onPress={() => choose(action)} style={s.sheetAction}>
            <Text style={s.sheetIcon}>{icon}</Text><Text style={s.sheetActionText}>{label}</Text>
          </TouchableOpacity>)}
        </ScrollView>
        <TouchableOpacity onPress={() => setMenu(null)} style={s.sheetCancel}><Text style={s.sheetCancelText}>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>;
}

function compactSize() { return 110; }

export default function TuneItApp({ screen = 'home', playlistId }) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { searchQuery, setSearchQuery, setMenu, toast, playTrack } = useMusic();
  const compact = width < 760;
  const desktop = width >= 1180;
  const titles = { home: 'Home', search: 'Search', library: 'Your Library', downloads: 'Offline Music', playlists: 'Playlists', favorites: 'Liked Songs', local: 'Local Music', player: 'Now Playing' };
  const active = screen === 'playlist' ? 'playlists' : screen;
  let content;
  if (screen === 'library' || screen === 'playlists') content = <LibraryScreen router={router} />;
  else if (screen === 'favorites') content = <FavoritesScreen router={router} />;
  else if (screen === 'downloads') content = <DownloadsScreen router={router} />;
  else if (screen === 'local') content = <LocalMusicScreen />;
  else if (screen === 'player') content = <PlayerScreen compact={compact} />;
  else if (screen === 'playlist') content = <PlaylistScreen router={router} playlistId={playlistId} compact={compact} />;
  else if (screen === 'search') content = <SearchScreen />;
  else content = <HomeScreen router={router} compact={compact} />;
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {compact ? <>
        <View style={s.mobileHeader}>{screen === 'player' ? <TouchableOpacity accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.mobileBrand}><Text style={s.backIcon}>‹</Text><Text style={s.mobileNowTitle}>Now Playing</Text></TouchableOpacity> : <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/')} style={s.mobileBrand}><View style={s.brandIcon}><Text style={s.brandGlyph}>♫</Text></View><Text style={s.brandName}>TuneIt</Text></TouchableOpacity>}<TouchableOpacity accessibilityRole="button" accessibilityLabel="Account and sign in" onPress={() => router.push('/account')}><Text style={s.topIcon}>◉</Text></TouchableOpacity></View>
        <ScrollView style={s.mobileScroll} contentContainerStyle={s.mobileContent} showsVerticalScrollIndicator={false}>
          {screen === 'local' && <View style={s.mobilePageTitle}><Text style={s.mobileTitle}>Local Music</Text></View>}
          {content}
        </ScrollView>
        {screen === 'player' ? null : <><MiniPlayer /><View style={s.bottomNav}><NavItem compact icon="⌂" title="Home" route="/" active={screen === 'home'} /><NavItem compact icon="⌕" title="Search" route="/search" active={screen === 'search'} /><NavItem compact icon="▤" title="Library" route="/library" active={screen === 'library' || screen === 'playlist' || screen === 'favorites'} /><NavItem compact icon="♫" title="Offline" route="/downloads" active={screen === 'downloads'} /></View></>}
      </> : <View style={s.desktopShell}>
        <SideBar screen={active} />
        <View style={s.mainColumn}><TopBar /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.mainContent}>{screen !== 'home' && <Text style={s.desktopTitle}>{titles[active] || 'TuneIt'}</Text>}{content}</ScrollView></View>
        {desktop && <MiniNowPlaying router={router} />}
      </View>}
      <ActionMenu router={router} />
      {!!toast && <View pointerEvents="none" style={s.toast}><Text style={s.toastText}>{toast}</Text></View>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topSearchBox: { flex: 1, maxWidth: 520 }, mobileHomeTop: { marginBottom: 22 }, greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, greeting: { color: colors.muted, fontSize: 12, fontWeight: '500', marginBottom: 5 }, homeSearchTitle: { color: colors.text, fontSize: 27, lineHeight: 31, fontWeight: '800', textTransform: 'capitalize' }, homeAvatar: { width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE9FA', borderWidth: 2, borderColor: '#FFFFFF', elevation: 2 }, homeAvatarText: { color: colors.accent, fontSize: 17, fontWeight: '800' }, homeSearchBox: { height: 48, borderRadius: 15, borderColor: '#EAEBF0', backgroundColor: '#FFFFFF', paddingHorizontal: 14, elevation: 1 }, searchClear: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EEF7' }, searchClearText: { color: colors.muted, fontSize: 20, lineHeight: 23 }, homeCategoryRow: { gap: 9, paddingTop: 14, paddingRight: 4 }, homeCategory: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: '#E8E9EF', backgroundColor: '#FFFFFF' }, homeCategoryActive: { backgroundColor: colors.accent, borderColor: colors.accent }, homeCategoryText: { color: '#555967', fontSize: 11, fontWeight: '600' }, homeCategoryTextActive: { color: '#FFFFFF' }, homeSectionHeader: { marginBottom: 13 }, recommendationRow: { gap: 13, paddingBottom: 4 }, recommendationCard: { width: 148 }, recommendationArt: { width: 148, height: 148, borderRadius: 17, overflow: 'hidden', position: 'relative', backgroundColor: colors.cardLight }, recommendationPlay: { position: 'absolute', right: 9, bottom: 9, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', elevation: 3 }, recommendationPlayGlyph: { color: colors.accent, fontSize: 12, marginLeft: 2 }, recommendationTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 9 }, recommendationArtist: { color: colors.muted, fontSize: 10, marginTop: 3 }, trendingHeader: { marginTop: 25 }, offlineNowPlaying: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#EEEAF8', borderRadius: 13, paddingHorizontal: 13, marginBottom: 20 }, offlineDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: colors.accent }, offlineNowText: { flex: 1, color: '#4B4560', fontSize: 11, fontWeight: '600' }, offlineNowArrow: { color: colors.accent, fontSize: 20 }, homeEmpty: { alignItems: 'flex-start', padding: 20, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line }, homeEmptyTitle: { color: colors.text, fontSize: 16, fontWeight: '750' }, homeEmptyText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6, marginBottom: 15 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowMore: { padding: 5 },
  trendTap: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  libraryMain: { flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 },
  moreButton: { paddingHorizontal: 6, paddingVertical: 9 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingVertical: 28 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(5, 5, 12, 0.72)' },
  actionSheet: { width: '100%', maxWidth: 480, maxHeight: '78%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, borderWidth: 1, borderColor: colors.line },
  sheetHandle: { width: 40, height: 4, borderRadius: 3, backgroundColor: '#D8DAE2', alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sheetSubtitle: { color: colors.muted, fontSize: 11, marginBottom: 12 },
  sheetOptions: { flexGrow: 0, marginTop: 7 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 49, borderBottomWidth: 1, borderBottomColor: colors.line },
  sheetIcon: { color: colors.accent, fontSize: 17, width: 24, textAlign: 'center' },
  sheetActionText: { color: colors.text, fontSize: 12, flex: 1 },
  sheetCancel: { marginTop: 13, backgroundColor: '#F0F1F6', borderRadius: 14, alignItems: 'center', paddingVertical: 13 },
  sheetCancelText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  moodHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  moodHint: { color: colors.muted, fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  moodCard: { flex: 1, minHeight: 58, borderRadius: 13, paddingHorizontal: 9, paddingVertical: 9, justifyContent: 'space-between', borderWidth: 1, borderColor: 'transparent' },
  moodCardSelected: { borderColor: '#C6A9FF', shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  moodIcon: { color: '#E7D9FF', fontSize: 15 },
  moodName: { color: colors.text, fontSize: 10, fontWeight: '700' },
  createPlaylistForm: { gap: 12, marginTop: 16, marginBottom: 8 },
  playlistNameInput: { height: 46, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, color: colors.text, fontSize: 13 },
  savePlaylistButton: { alignSelf: 'stretch', alignItems: 'center', borderRadius: 12 },
  toast: { position: 'absolute', bottom: 78, alignSelf: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, zIndex: 20, elevation: 8 },
  toastText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  coverImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  heroImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  heroTint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(27, 16, 48, 0.54)' },
  playerTint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(27, 16, 48, 0.12)' },
  backIcon: { color: colors.text, fontSize: 30, lineHeight: 34 },
  mobileNowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  safe: { flex: 1, backgroundColor: colors.background },
  desktopShell: { flex: 1, flexDirection: 'row', padding: 16, paddingRight: 14, gap: 16, maxWidth: 1800, width: '100%', alignSelf: 'center' },
  sidebar: { width: 220, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, paddingTop: 20, marginVertical: 2, borderWidth: 1, borderColor: colors.line },
  mainColumn: { flex: 1, minWidth: 0 }, mainContent: { paddingHorizontal: 4, paddingBottom: 30 },
  rightPanel: { width: 310, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginVertical: 2, borderWidth: 1, borderColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 }, brandIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, brandGlyph: { color: 'white', fontSize: 21, fontWeight: '800' }, brandName: { color: colors.text, fontSize: 17, fontWeight: '800' }, brandSub: { color: colors.muted, fontSize: 9, marginTop: 1 },
  menu: { gap: 4 }, navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 11, borderRadius: 11, gap: 12 }, navItemActive: { backgroundColor: '#F0ECFA' }, navIcon: { color: colors.muted, fontSize: 17, width: 20, textAlign: 'center' }, navLabel: { color: '#555967', fontSize: 12 }, activeText: { color: colors.accent, fontWeight: '700' },
  sideSectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12, paddingHorizontal: 4 }, sideHeading: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }, addIcon: { color: '#BFA4FF', fontSize: 21 }, sidePlaylist: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }, sidePlaylistMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 }, sidePlaylistName: { color: colors.text, fontSize: 11, fontWeight: '600' }, sidePlaylistMeta: { color: colors.muted, fontSize: 9, marginTop: 3 }, localCard: { marginTop: 'auto', backgroundColor: colors.card, borderRadius: 14, padding: 11, minHeight: 80, flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }, localIcon: { color: colors.accentLight, fontSize: 17 },
  cover: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }, coverGlow: { position: 'absolute', width: '100%', height: '70%', top: 0, backgroundColor: 'rgba(255,255,255,0.10)', borderBottomLeftRadius: 60, borderBottomRightRadius: 60 }, coverIcon: { color: 'rgba(255,255,255,0.92)', fontWeight: '800', textShadowColor: 'rgba(10,10,20,0.4)', textShadowRadius: 10 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, marginBottom: 8 }, searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 12, height: 42, gap: 8 }, searchIcon: { fontSize: 22, color: colors.muted }, searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 12, paddingVertical: 0 }, profile: { flexDirection: 'row', alignItems: 'center', gap: 8 }, avatar: { overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: 'white', backgroundColor: colors.accent, width: 29, height: 29, borderRadius: 15, fontWeight: '700' }, profileName: { color: colors.text, fontSize: 11, fontWeight: '600' }, profileChevron: { color: colors.muted, fontSize: 16 }, topIcon: { color: colors.accent, fontSize: 21 },
  hero: { minHeight: 200, backgroundColor: '#EAE4F6', borderRadius: 19, padding: 24, position: 'relative', overflow: 'hidden', justifyContent: 'center', marginBottom: 23 }, heroGlow: { position: 'absolute', right: -25, top: -80, width: 300, height: 300, borderRadius: 160, backgroundColor: '#D8C9F2', opacity: 0.75 }, heroCopy: { zIndex: 2, width: '65%' }, heroCopyCompact: { width: '100%' }, heroEyebrow: { color: colors.accent, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 9 }, heroTitle: { color: colors.text, fontSize: 29, fontWeight: '800', lineHeight: 31 }, heroSub: { color: '#565A68', fontSize: 11, lineHeight: 17, maxWidth: 300, marginTop: 7, marginBottom: 14 }, button: { borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 17, paddingVertical: 10, alignSelf: 'flex-start' }, buttonText: { color: 'white', fontSize: 11, fontWeight: '700' }, heroPerson: { position: 'absolute', right: 20, bottom: -5, width: 120, height: 155, alignItems: 'center', justifyContent: 'flex-start' }, heroHead: { color: '#10101B', fontSize: 65, lineHeight: 76 }, heroBody: { color: '#10101B', fontSize: 150, lineHeight: 100, transform: [{ rotate: '90deg' }] }, heroDots: { flexDirection: 'row', position: 'absolute', bottom: 13, alignSelf: 'center', gap: 5 }, dot: { width: 5, height: 5, borderRadius: 4, backgroundColor: '#817297' }, dotActive: { width: 16, height: 5, borderRadius: 4, backgroundColor: '#DCCBFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, label: { color: colors.text, fontSize: 16, fontWeight: '750' }, seeAll: { color: colors.accent, fontSize: 10, fontWeight: '700' }, recentList: { gap: 12, paddingBottom: 3 }, recentCard: { width: 154 }, recentTitle: { color: colors.text, fontWeight: '650', fontSize: 11, marginTop: 8 }, trackSub: { color: colors.muted, fontSize: 9, marginTop: 3 }, trendingList: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, trendingItem: { minWidth: 142, flexGrow: 1, flexBasis: '18%', flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.card, padding: 8, borderRadius: 12 }, trackCopy: { flex: 1, minWidth: 0 }, trackTitle: { color: colors.text, fontSize: 11, fontWeight: '650' }, trendPlay: { color: colors.accent, fontSize: 12, paddingHorizontal: 4 },
  nowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, nowEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }, more: { color: colors.muted, fontSize: 15 }, nowArt: { height: 190, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: '#E9E5F2' }, artSun: { position: 'absolute', top: 25, width: 54, height: 54, borderRadius: 30, backgroundColor: '#EE8B9C', opacity: 0.85 }, artPerson: { position: 'absolute', fontSize: 90, color: '#12121A', bottom: -12 }, nowTitle: { color: colors.text, fontSize: 16, fontWeight: '750', textAlign: 'center' }, nowArtist: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4 }, progressTrack: { height: 4, borderRadius: 5, backgroundColor: '#E2E3E9', marginTop: 18, position: 'relative', overflow: 'visible' }, progressFill: { height: 4, borderRadius: 5, backgroundColor: colors.accent }, progressDot: { position: 'absolute', left: '43%', top: -4, width: 12, height: 12, borderRadius: 7, backgroundColor: 'white', elevation: 2 }, timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, duration: { color: colors.muted, fontSize: 9 }, playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 }, control: { color: '#4B4D59', fontSize: 17, fontWeight: '700' }, playButton: { width: 44, height: 44, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 }, playGlyph: { color: 'white', fontSize: 17, fontWeight: '800' }, volume: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }, volumeTrack: { flex: 1, marginTop: 0 }, queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.line, marginTop: 17, paddingTop: 13, marginBottom: 4 }, queueTitle: { color: colors.text, fontSize: 12, fontWeight: '700' }, equalizer: { color: colors.accent, fontSize: 12 },
  trackRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 7 }, trackMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, trackIndex: { color: colors.muted, fontSize: 9, width: 18 },
  pageHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 }, pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 }, pageSub: { color: colors.muted, fontSize: 11, lineHeight: 17 }, chips: { flexDirection: 'row', gap: 8, marginVertical: 14, flexWrap: 'wrap' }, chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, chipActive: { backgroundColor: '#F0ECFA', borderColor: '#D9CFF1' }, chipText: { color: '#555967', fontSize: 10 }, libraryRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9, borderBottomWidth: 1, borderColor: colors.line },
  scanScreen: { alignItems: 'center', paddingTop: 50, paddingBottom: 30 }, scanOrb: { width: 135, height: 135, borderRadius: 70, borderWidth: 1, borderColor: '#E3DDF1', backgroundColor: '#F0ECF8', alignItems: 'center', justifyContent: 'center', marginBottom: 27 }, scanMusic: { color: colors.accent, fontSize: 47 }, orbit: { position: 'absolute', width: 105, height: 105, borderWidth: 2, borderColor: colors.accent, borderLeftColor: 'transparent', borderRadius: 55, transform: [{ rotate: '-35deg' }] }, scanChecks: { width: '100%', maxWidth: 380, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 15, marginTop: 28 }, checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderColor: colors.line, gap: 10 }, check: { color: colors.accent, fontSize: 16 }, scanCheckLabel: { color: colors.text, fontSize: 11, flex: 1 }, scanCheckValue: { color: colors.muted, fontSize: 11 }, scanProgress: { width: '100%', maxWidth: 380, height: 8, backgroundColor: '#E5E6EC', borderRadius: 8, marginTop: 25, overflow: 'hidden' }, scanPercent: { color: colors.muted, fontSize: 10, alignSelf: 'flex-end', marginTop: 6 }, listCaption: { color: colors.muted, fontSize: 9, letterSpacing: 1.1, fontWeight: '700', marginTop: 15, marginBottom: 8 }, downloadButton: { width: 33, height: 33, borderRadius: 17, backgroundColor: '#F0ECFA', alignItems: 'center', justifyContent: 'center' }, downloadGlyph: { color: colors.accent, fontSize: 17 }, downloadCount: { color: colors.accent, backgroundColor: '#F0ECFA', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11 },
  playlistHero: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 10, marginBottom: 4 }, playlistInfo: { flex: 1, paddingBottom: 6 }, playlistActions: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 14 }, secondaryButton: { backgroundColor: '#F0F1F6', paddingHorizontal: 14 }, shufflePlaylistButton: { backgroundColor: '#F0ECFA' }, mobilePlaylistArtwork: { width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: '#D8D2E4', marginTop: 8 }, mobilePlaylistFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' }, mobilePlaylistGlyph: { color: 'rgba(255,255,255,0.9)', fontSize: 100, fontWeight: '800' }, mobilePlaylistShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(18,18,26,0.32)' }, mobilePlaylistCopy: { position: 'absolute', left: 20, right: 20, bottom: 20 }, mobilePlaylistEyebrow: { color: '#F1ECFF', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 6 }, mobilePlaylistTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 32, fontWeight: '800' }, mobilePlaylistSub: { color: '#F5F3F8', fontSize: 11, marginTop: 5 },
  fullPlayer: { alignItems: 'center', padding: 10, maxWidth: 520, alignSelf: 'center', width: '100%' }, fullPlayerCompact: { paddingTop: 1, paddingHorizontal: 2 }, playerSource: { alignItems: 'center', marginBottom: 15 }, playerSourceEyebrow: { color: colors.muted, fontSize: 8, letterSpacing: 1.1, fontWeight: '700' }, playerSourceName: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 3, maxWidth: 280 }, playerArtwork: { width: '100%', aspectRatio: 1, maxHeight: 440, borderRadius: 22, backgroundColor: '#E9E5F2', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' }, playerArtworkCompact: { maxHeight: 360, borderRadius: 20 }, playerArtworkFallback: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E5F2' }, playerOfflineStamp: { position: 'absolute', bottom: 15, color: '#777185', fontSize: 8, fontWeight: '800', letterSpacing: 1.5 }, playerSun: { position: 'absolute', width: '34%', aspectRatio: 1, top: '13%', borderRadius: 200, backgroundColor: '#F27B91', opacity: 0.88 }, playerPalm: { position: 'absolute', right: '13%', top: '2%', color: '#171322', fontSize: 120 }, playerSilhouette: { position: 'absolute', color: '#AAA2B8', fontSize: 145, bottom: 20 }, playerShoulders: { position: 'absolute', color: '#12121A', fontSize: 245, bottom: -102, transform: [{ rotate: '90deg' }] }, playerMeta: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, playerTrackInfo: { flex: 1, minWidth: 0, paddingRight: 15 }, playerTrackName: { textAlign: 'left', fontSize: 19, fontWeight: '800' }, playerTrackArtist: { textAlign: 'left', fontSize: 11 }, heart: { color: '#777987', fontSize: 26 }, bigPlay: { width: 60, height: 60, borderRadius: 31 }, playerExtras: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 10 }, offlineListening: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 12, marginTop: 20 }, offlineListeningIcon: { color: colors.accent, fontSize: 18 }, offlineListeningTitle: { color: colors.text, fontSize: 11, fontWeight: '700' }, offlineListeningSub: { color: colors.muted, fontSize: 9, marginTop: 3 }, offlineListeningCheck: { color: '#2A9B6F', fontSize: 16, fontWeight: '800' },
  mobileHeader: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 }, mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, mobileScroll: { flex: 1 }, mobileContent: { paddingHorizontal: 17, paddingTop: 8, paddingBottom: 30 }, mobilePageTitle: { marginBottom: 16 }, mobileTitle: { color: colors.text, fontSize: 21, fontWeight: '750' }, bottomNav: { height: 65, borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingBottom: 4 }, bottomItem: { alignItems: 'center', justifyContent: 'center', minWidth: 58, paddingVertical: 3 }, bottomIcon: { color: colors.muted, fontSize: 19 }, bottomLabel: { color: colors.muted, fontSize: 9, marginTop: 3 }, bottomItemActive: { backgroundColor: 'transparent' },
  desktopTitle: { color: colors.text, fontSize: 23, fontWeight: '800', marginHorizontal: 4, marginBottom: 15 },
});

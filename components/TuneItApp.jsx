import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, Image, Modal, Pressable, Share, Platform,
  useWindowDimensions, StatusBar, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

function Cover({ color = colors.accent, icon = '♫', size = 54, round = 12, imageUri }) {
  return (
    <View style={[s.cover, { width: size, height: size, borderRadius: round, backgroundColor: color }]}>
      {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={s.coverImage} /> : <>
        <View style={s.coverGlow} />
        <View style={s.coverArtworkOrb} />
        <View style={s.coverArtworkDisc}><View style={s.coverArtworkRing}><View style={s.coverArtworkCenter} /></View></View>
        <Text style={[s.coverIcon, { fontSize: size * 0.24 }]}>{icon}</Text>
      </>}
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
        <Cover size={46} color={item.color} icon={item.art} imageUri={item.artwork || item.image} />
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
  const { setSearchQuery } = useMusic();
  return (
    <TouchableOpacity accessibilityRole={compact ? 'tab' : 'button'} accessibilityState={{ selected: Boolean(active) }} accessibilityLabel={title} activeOpacity={0.78} onPress={() => { if (route === '/') setSearchQuery(''); compact ? router.replace(route) : router.push(route); }} style={[compact ? s.bottomItem : s.navItem, active && (compact ? s.bottomItemActive : s.navItemActive)]}>
      {compact ? <View style={s.bottomIconBox}><NavGlyph name={icon} active={active} compact={compact} /></View> : <Text style={[s.navIcon, active && s.activeText]}>{icon}</Text>}
      <Text style={[compact ? s.bottomLabel : s.navLabel, active && (compact ? s.bottomLabelActive : s.activeText)]}>{title}</Text>
    </TouchableOpacity>
  );
}

function NavGlyph({ name, active, compact = false }) {
  const color = active ? colors.accent : colors.muted;
  const line = { backgroundColor: color };
  const outline = { borderColor: color };
  if (name === 'home') return <View style={s.glyphCanvas}>
    <View style={[s.homeRoofLeft, line]} /><View style={[s.homeRoofRight, line]} />
    <View style={[s.homeBody, outline]} /><View style={[s.homeDoor, outline]} />
  </View>;
  if (name === 'search') return <View style={s.glyphCanvas}>
    <View style={[s.searchLens, outline]} /><View style={[s.searchHandle, line]} />
  </View>;
  if (name === 'library') return <View style={s.glyphCanvas}>
    <View style={[s.libraryFrame, outline]}>
      <View style={[s.libraryLine, line]} /><View style={[s.libraryLine, line]} /><View style={[s.libraryLine, line]} />
    </View>
  </View>;
  if (name === 'favorites' || name === 'playlists' || name === 'settings') {
    const glyph = name === 'favorites' ? '♡' : name === 'playlists' ? '▤' : '⚙';
    return <Text style={{ color, fontSize: 19, lineHeight: 22, fontWeight: active ? '700' : '500' }}>{glyph}</Text>;
  }
  return <View style={s.glyphCanvas}>
    <View style={[s.downloadStem, line]} /><View style={[s.downloadArrowLeft, line]} /><View style={[s.downloadArrowRight, line]} />
    <View style={[s.downloadTray, outline]} />
  </View>;
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
  const seekAtX = (event) => {
    if (!playerStatus.duration || !seekWidth) return;
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / seekWidth));
    player.seekTo(ratio * playerStatus.duration);
  };
  return (
      <View style={s.rightPanel}>
      <View style={s.nowTop}><Text style={s.nowEyebrow}>NOW PLAYING</Text><TouchableOpacity onPress={() => setMenu({ type: 'track', track: currentTrack })}><Text style={s.more}>•••</Text></TouchableOpacity></View>
      <TouchableOpacity onPress={() => router.push('/player/1')} activeOpacity={0.85}>
        <View style={s.nowArt}><Cover size={190} round={20} color={currentTrack.color} icon={currentTrack.art} imageUri={currentTrack.artwork} /></View>
        <Text style={s.nowTitle}>{currentTrack.title}</Text><Text style={s.nowArtist}>{currentTrack.artist}</Text>
      </TouchableOpacity>
      <View accessibilityRole="adjustable" accessibilityLabel="Track progress" accessibilityValue={{ min: 0, max: playerStatus.duration || 0, now: playerStatus.currentTime || 0 }} onLayout={(event) => setSeekWidth(event.nativeEvent.layout.width || 274)} onStartShouldSetResponder={() => Boolean(playerStatus.duration)} onMoveShouldSetResponder={() => Boolean(playerStatus.duration)} onResponderGrant={seekAtX} onResponderMove={seekAtX} style={s.progressTouch}><View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /><View style={[s.progressDot, { left: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /></View></View>
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
  const [searchFocused, setSearchFocused] = useState(false);
  return (
    <View style={s.topBar}>
      <View style={[s.searchBox, s.topSearchBox, searchFocused && s.searchBoxFocused]}><Text style={s.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} onSubmitEditing={() => router.push('/search')} returnKeyType="search" placeholder="Search songs, artists, albums, playlists..." placeholderTextColor={colors.muted} style={s.searchInput} /></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={user ? `Account for ${user.username}` : 'Sign in'} onPress={() => setMenu({ type: 'profile' })} style={s.profile}><Text style={s.avatar}>{user?.username?.[0]?.toUpperCase() || '♫'}</Text><Text style={s.profileName}>{user?.username || 'Sign in'}</Text><Text style={s.profileChevron}>⌄</Text></TouchableOpacity>
    </View>
  );
}

function QuickAccess({ router, items, compact }) {
  const cards = items.map((item) => (
    <TouchableOpacity key={item.title} accessibilityRole="button" onPress={() => router.push(item.route)} activeOpacity={0.82} style={[s.quickAccessCard, !compact && s.quickAccessCardWide]}>
      <View style={s.quickAccessIcon}><Text style={s.quickAccessGlyph}>{item.icon}</Text></View>
      <View style={s.quickAccessCopy}>
        <Text numberOfLines={1} style={s.quickAccessTitle}>{item.title}</Text>
        <Text style={s.quickAccessMeta}>{item.count}</Text>
      </View>
      <Text style={s.quickAccessArrow}>›</Text>
    </TouchableOpacity>
  ));

  return compact
    ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickAccessRow}>{cards}</ScrollView>
    : <View style={[s.quickAccessRow, s.quickAccessRowWide]}>{cards}</View>;
}

function DailyMixCard({ tracks, onPlay, compact }) {
  if (!tracks.length) return null;
  return (
    <View style={[s.dailyMix, compact && s.dailyMixCompact]}>
      <View style={s.dailyMixArt}>
        <View style={s.dailyMixDisc}><View style={s.dailyMixDiscCenter} /></View>
        <View style={s.dailyMixSpark}><Text style={s.dailyMixSparkText}>✦</Text></View>
      </View>
      <View style={s.dailyMixCopy}>
        <Text style={s.dailyMixEyebrow}>MADE FROM YOUR LISTENING</Text>
        <Text style={s.dailyMixTitle}>Your Daily Mix</Text>
        <Text style={s.dailyMixSub} numberOfLines={2}>A fresh blend of favorites, recent plays and the rest of your library.</Text>
        <View style={s.dailyMixMetaRow}>
          <Text style={s.dailyMixCount}>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} · on this device</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Play your Daily Mix" onPress={onPlay} style={s.dailyMixPlay}>
            <Text style={s.dailyMixPlayGlyph}>▶</Text><Text style={s.dailyMixPlayText}>Play mix</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function HomeScreen({ router, compact }) {
  const { width: screenWidth } = useWindowDimensions();
  const { localTracks, recentTracks, playCounts, currentTrack, liked, playlists, user, searchQuery, setSearchQuery, playTrackFromList, setMenu, setShuffle } = useMusic();
  const [category, setCategory] = useState('Suggested');
  const [sortDescending, setSortDescending] = useState(false);
  const searchTerm = searchQuery.trim().toLocaleLowerCase();
  const recentItems = [];
  const recentIds = new Set();
  for (const track of recentTracks) {
    const id = track.id ?? track.uri ?? `${track.title}-${track.artist}`;
    if (!recentIds.has(id)) { recentIds.add(id); recentItems.push(track); }
  }
  const visibleTracks = localTracks.filter((track) => `${track.title} ${track.artist} ${track.album || ''}`.toLocaleLowerCase().includes(searchTerm));
  const recommendations = [...recentItems, ...localTracks.filter((track) => !recentIds.has(track.id ?? track.uri ?? `${track.title}-${track.artist}`))].slice(0, 8);
  const dailyMix = [...localTracks.filter((track) => liked.includes(track.title) || recentIds.has(track.id ?? track.uri ?? `${track.title}-${track.artist}`)), ...localTracks.filter((track) => !liked.includes(track.title) && !recentIds.has(track.id ?? track.uri ?? `${track.title}-${track.artist}`))].slice(0, 12);
  const artists = [...new Set(localTracks.map((track) => track.artist).filter((artist) => artist && artist !== 'Local audio'))];
  const albums = [...new Set(localTracks.map((track) => track.album).filter(Boolean))];
  const featuredTracks = [...localTracks].sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0) || Number(liked.includes(b.title)) - Number(liked.includes(a.title)) || Number(recentIds.has(b.id)) - Number(recentIds.has(a.id))).slice(0, 8);
  const sortedTracks = [...localTracks].sort((a, b) => a.title.localeCompare(b.title) * (sortDescending ? -1 : 1));
  const albumCoverSize = Math.min(140, Math.max(96, (screenWidth - 70) / 2));
  const quickAccessItems = [
    { title: 'Your library', count: `${localTracks.length} ${localTracks.length === 1 ? 'song' : 'songs'}`, icon: '♫', route: '/library' },
    { title: 'Liked songs', count: `${liked.length} ${liked.length === 1 ? 'track' : 'tracks'}`, icon: '♡', route: '/favorites' },
    { title: 'Playlists', count: `${playlists.filter((playlist) => playlist.id !== 'liked-songs').length} playlists`, icon: '▤', route: '/playlists' },
  ];
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';
  const openArtist = (artist) => { setSearchQuery(artist); router.push('/search'); };
  const playMix = () => { if (!dailyMix.length) return; setShuffle(true); playTrackFromList(dailyMix[0], dailyMix); router.push('/player/1'); };
  return <>
    {compact && <View style={s.mobileHomeTop}>
      {!searchTerm && <View style={s.greetingRow}><View><Text style={s.greeting}>{greeting}</Text><Text style={s.homeSearchTitle}>Listen your way</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Account and settings" onPress={() => router.push('/account')} style={s.homeAvatar}><Text style={s.homeAvatarText}>{user?.username?.[0]?.toUpperCase() || 'T'}</Text></TouchableOpacity></View>}
      <Text style={s.libraryStatLine}>{localTracks.length} songs  ·  available offline</Text>
      {!searchTerm && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.homeCategoryRow}>{['Suggested', 'Songs', 'Artists', 'Albums'].map((item) => <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[s.homeCategory, category === item && s.homeCategoryActive]}><Text style={[s.homeCategoryText, category === item && s.homeCategoryTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>}
    </View>}
    {searchTerm ? <>
      <View style={s.sectionHeader}><Label>Search results</Label><Text style={s.pageSub}>{visibleTracks.length} {visibleTracks.length === 1 ? 'song' : 'songs'}</Text></View>
      {visibleTracks.map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, visibleTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
      {!visibleTracks.length && <Text style={s.emptyText}>No songs match “{searchQuery}”. Try another title or artist.</Text>}
    </> : compact ? <>
      {!!currentTrack && <TouchableOpacity onPress={() => router.push('/player/1')} style={s.offlineNowPlaying}><View style={s.offlineDot} /><Text style={s.offlineNowText} numberOfLines={1}>Now playing · {currentTrack.title}</Text><Text style={s.offlineNowArrow}>›</Text></TouchableOpacity>}
      {category === 'Suggested' && <>
        <DailyMixCard tracks={dailyMix} compact onPlay={playMix} />
        <View style={[s.sectionHeader, s.homeSectionHeader]}><Label>Recently played</Label><TouchableOpacity onPress={() => router.push('/library')}><Text style={s.seeAll}>See all  ›</Text></TouchableOpacity></View>
        {recommendations.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recommendationRow}>{recommendations.map((item) => <TouchableOpacity key={item.id ?? item.uri ?? item.title} activeOpacity={0.85} onPress={() => playTrackFromList(item, recommendations)} style={s.recommendationCard}><View style={s.recommendationArt}><Cover size={148} round={17} color={item.color} icon={item.art} imageUri={item.artwork || item.image} /><View style={s.recommendationPlay}><Text style={s.recommendationPlayGlyph}>▶</Text></View></View><Text numberOfLines={1} style={s.recommendationTitle}>{item.title}</Text><Text numberOfLines={1} style={s.recommendationArtist}>{item.artist}</Text></TouchableOpacity>)}</ScrollView> : <View style={s.homeEmpty}><Text style={s.homeEmptyTitle}>Your music starts here</Text><Text style={s.homeEmptyText}>Add audio files from this device to build your offline library.</Text><Button onPress={() => router.push('/local-music')}>Add music</Button></View>}
        {!!artists.length && <><View style={[s.sectionHeader, s.trendingHeader]}><Label>Artists</Label></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.artistRow}>{artists.slice(0, 10).map((artist) => { const item = localTracks.find((track) => track.artist === artist); return <TouchableOpacity key={artist} onPress={() => openArtist(artist)} style={s.artistCard}><Cover size={68} round={34} color={item?.color} icon={item?.art} imageUri={item?.artwork || item?.image} /><Text numberOfLines={1} style={s.artistName}>{artist}</Text></TouchableOpacity>; })}</ScrollView></>}
        {!!featuredTracks.length && <><View style={[s.sectionHeader, s.trendingHeader]}><Label>Most played</Label><TouchableOpacity onPress={() => setCategory('Songs')}><Text style={s.seeAll}>All songs  ›</Text></TouchableOpacity></View>{featuredTracks.slice(0, 6).map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, featuredTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}</>}
      </>}
      {category === 'Songs' && <><View style={s.sectionHeader}><View><Label>All songs</Label><Text style={s.pageSub}>{localTracks.length} tracks</Text></View><TouchableOpacity accessibilityRole="button" onPress={() => setSortDescending((value) => !value)} style={s.sortButton}><Text style={s.sortButtonText}>{sortDescending ? 'Descending' : 'Ascending'}  ↕</Text></TouchableOpacity></View>{sortedTracks.map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, sortedTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}{!localTracks.length && <Text style={s.emptyText}>Add music from your device to start listening.</Text>}</>}
      {category === 'Artists' && <><View style={s.sectionHeader}><Label>Artists</Label><Text style={s.pageSub}>{artists.length} artists</Text></View>{artists.map((artist) => { const item = localTracks.find((track) => track.artist === artist); const count = localTracks.filter((track) => track.artist === artist).length; return <TouchableOpacity key={artist} onPress={() => openArtist(artist)} style={s.artistListRow}><Cover size={50} round={25} color={item?.color} icon={item?.art} imageUri={item?.artwork || item?.image} /><View style={s.trackCopy}><Text numberOfLines={1} style={s.trackTitle}>{artist}</Text><Text style={s.trackSub}>{count} {count === 1 ? 'song' : 'songs'}</Text></View><Text style={s.rowArrow}>›</Text></TouchableOpacity>; })}{!artists.length && <Text style={s.emptyText}>Artist names from your music will appear here.</Text>}</>}
      {category === 'Albums' && <><View style={s.sectionHeader}><Label>Albums</Label><Text style={s.pageSub}>{albums.length} albums</Text></View><View style={s.albumGrid}>{albums.map((album) => { const item = localTracks.find((track) => track.album === album); return <TouchableOpacity key={album} onPress={() => { setSearchQuery(album); router.push('/search'); }} style={s.albumTile}><Cover size={albumCoverSize} round={15} color={item?.color} icon={item?.art} imageUri={item?.artwork || item?.image} /><Text numberOfLines={1} style={s.recommendationTitle}>{album}</Text><Text numberOfLines={1} style={s.recommendationArtist}>{item?.artist || 'Local album'}</Text></TouchableOpacity>; })}</View>{!albums.length && <Text style={s.emptyText}>Album artwork and details from your music will appear here.</Text>}</>}
    </> : <>
      <View style={s.hero}><View style={s.heroGlow} /><View style={s.heroCopy}><Text style={s.heroEyebrow}>TUNEIT • YOUR OFFLINE MUSIC</Text><Text style={s.heroTitle}>Your music.{ '\n' }Your way.</Text><Text style={s.heroSub}>A private music space for the songs already on your device.</Text><Button onPress={() => router.push('/local-music')}>Open local music</Button></View></View>
      <View style={[s.sectionHeader, s.quickAccessHeading]}><Label>Jump back in</Label></View><QuickAccess router={router} items={quickAccessItems} compact={false} />
      <DailyMixCard tracks={dailyMix} onPlay={playMix} />
      <View style={s.sectionHeader}><Label>Recently played</Label><TouchableOpacity onPress={() => router.push('/library')}><Text style={s.seeAll}>See all  ›</Text></TouchableOpacity></View>
      {recentItems.slice(0, 6).map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} compact onPress={() => playTrackFromList(item, recentItems)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
      {localTracks.map((item, index) => <TrackRow key={item.id ?? item.uri ?? `${item.title}-${index}`} item={item} index={index} onPress={() => playTrackFromList(item, localTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
      {!localTracks.length && <Text style={s.emptyText}>Your library is empty. Scan this device or add audio files to get started.</Text>}
    </>}
  </>;
}
function LibraryScreen({ router }) {
  const [tab, setTab] = useState('Playlists');
  const { setMenu, playlists, playlistTracks, localTracks, playTrackFromList } = useMusic();
  const artists = [...new Set(localTracks.map((track) => track.artist).filter(Boolean))];
  const albums = [...new Set(localTracks.map((track) => track.album).filter(Boolean))];
  return <>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Your Library</Text><Text style={s.pageSub}>{localTracks.length} songs · stored on this device</Text></View><TouchableOpacity onPress={() => setMenu({ type: 'createPlaylist' })}><Text style={s.addIcon}>＋</Text></TouchableOpacity></View>
    <View style={s.chips}>{['Playlists', 'Songs', 'Artists', 'Albums'].map((v) => <TouchableOpacity key={v} onPress={() => setTab(v)} style={[s.chip, tab === v && s.chipActive]}><Text style={[s.chipText, tab === v && s.chipTextActive]}>{v}</Text></TouchableOpacity>)}</View>
    {tab === 'Songs' && localTracks.map((item, i, list) => <TrackRow key={item.id} item={item} index={i} onPress={() => playTrackFromList(item, list)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {tab === 'Playlists' && playlists.filter((item) => item.id !== 'liked-songs').map((item) => <View key={item.id} style={s.libraryRow}><TouchableOpacity style={s.libraryMain} onPress={() => router.push(`/playlists/${item.id}`)}><Cover size={55} color={item.color} icon={item.icon} /><View style={s.trackCopy}><Text style={s.trackTitle}>{item.name}</Text><Text style={s.trackSub}>{(playlistTracks[item.id] || []).length} songs</Text></View></TouchableOpacity><TouchableOpacity style={s.moreButton} onPress={() => setMenu({ type: 'playlist', playlist: item })}><Text style={s.more}>•••</Text></TouchableOpacity></View>)}
    {tab === 'Artists' && artists.map((artist) => <View key={artist} style={s.libraryRow}><Cover size={55} color={colors.card} icon="♫" /><View style={s.trackCopy}><Text style={s.trackTitle}>{artist}</Text><Text style={s.trackSub}>{localTracks.filter((item) => item.artist === artist).length} songs</Text></View></View>)}
    {tab === 'Albums' && albums.map((album) => <View key={album} style={s.libraryRow}><Cover size={55} color={colors.card} icon="♫" /><View style={s.trackCopy}><Text style={s.trackTitle}>{album}</Text><Text style={s.trackSub}>{localTracks.filter((item) => item.album === album).length} songs</Text></View></View>)}
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
  const [searchFocused, setSearchFocused] = useState(false);
  const results = localTracks.filter((item) => `${item.title} ${item.artist} ${item.album || ''}`.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
  return <>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Search your music</Text><Text style={s.pageSub}>Search audio files on this device.</Text></View></View>
    <View style={[s.searchBox, searchFocused && s.searchBoxFocused]}><Text style={s.searchIcon}>⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Songs, artists, albums..." placeholderTextColor={colors.muted} style={s.searchInput} /></View>
    {searchQuery ? <Label style={s.listCaption}>{results.length} RESULTS</Label> : null}
    {results.map((item, i) => <TrackRow key={item.id} item={item} index={i} onPress={() => playTrackFromList(item, results)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {!results.length && <Text style={s.emptyText}>{localTracks.length ? 'No matching songs.' : 'Scan your device first to search local music.'}</Text>}
  </>;
}

function LocalMusicScreen() {
  const { localTracks, libraryStatus, libraryImporting, libraryError, scanLocalMusic, importLocalMusic, playTrackFromList, setMenu } = useMusic();
  const isWeb = Platform.OS === 'web';
  useEffect(() => { if (!isWeb) scanLocalMusic({ requestPermission: false }); }, [isWeb, scanLocalMusic]);
  const statusLabel = libraryStatus === 'scanning' ? 'Scanning audio on this device…' : libraryImporting ? 'Adding selected audio…' : `${localTracks.length} songs ${isWeb ? 'added' : 'on this device'}`;
  return <View>
    <View style={s.pageHeading}><View><Text style={s.pageTitle}>Local Music</Text><Text style={s.pageSub}>{statusLabel}</Text></View><Text style={s.downloadCount}>♫ {localTracks.length}</Text></View>
    <View style={s.playlistActions}>
      {!isWeb && <Button disabled={libraryStatus === 'scanning' || libraryImporting} onPress={scanLocalMusic} style={s.secondaryButton}>{libraryStatus === 'scanning' ? 'Scanning…' : '↻  Scan device'}</Button>}
      <Button disabled={libraryStatus === 'scanning' || libraryImporting} onPress={importLocalMusic}>{libraryImporting ? 'Adding…' : isWeb ? '＋  Choose audio files' : '＋  Add audio files'}</Button>
    </View>
    {!!libraryError && <Text style={[s.pageSub, { marginBottom: 12 }]}>{libraryError}</Text>}
    {localTracks.map((item, index) => <TrackRow key={item.id} item={item} index={index} onPress={() => playTrackFromList(item, localTracks)} onMenu={(track) => setMenu({ type: 'track', track })} />)}
    {!localTracks.length && libraryStatus !== 'scanning' && <View style={s.scanScreen}>
      <View style={s.scanOrb}><Text style={s.scanMusic}>♫</Text><View style={s.orbit} /></View>
      <Text style={[s.pageSub, { textAlign: 'center', maxWidth: 300 }]}>{isWeb ? 'Browsers only let TuneIt access music files you choose. Select audio files above to add them. Automatic library scanning is available in the installed Android or iOS app.' : 'Scan this device or choose audio files to build your offline library. Your music stays on this device.'}</Text>
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
      {songs[0]?.artwork ? <Image source={{ uri: songs[0].artwork }} resizeMode="cover" style={s.coverImage} /> : <View style={[s.mobilePlaylistFallback, { backgroundColor: selectedPlaylist.color || colors.card }]}><Text style={s.mobilePlaylistGlyph}>{selectedPlaylist.icon || '♫'}</Text></View>}
      <View style={s.mobilePlaylistShade} />
      <View style={s.mobilePlaylistCopy}><Text style={s.mobilePlaylistEyebrow}>OFFLINE PLAYLIST</Text><Text style={s.mobilePlaylistTitle}>{selectedPlaylist.name}</Text><Text style={s.mobilePlaylistSub}>{songs.length} songs · available on this device</Text></View>
    </View> : <View style={s.playlistHero}><Cover size={compactSize()} color={selectedPlaylist?.color || colors.accent} icon={selectedPlaylist?.icon || '♫'} /><View style={s.playlistInfo}><Text style={s.listCaption}>OFFLINE PLAYLIST</Text><Text style={s.pageTitle}>{selectedPlaylist?.name || 'Playlist'}</Text><Text style={s.pageSub}>{songs.length} songs · your device</Text></View></View>}
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
  const seekAtX = (event) => {
    if (!playerStatus.duration || !progressWidth) return;
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth));
    player.seekTo(ratio * playerStatus.duration);
  };
  if (!currentTrack) return <View style={[s.fullPlayer, compact && s.fullPlayerCompact]}><View style={s.scanOrb}><Text style={s.scanMusic}>♫</Text></View><Text style={s.pageTitle}>Choose a song</Text><Text style={[s.pageSub, { textAlign: 'center' }]}>Scan this device or add an audio file to start listening.</Text></View>;
  return <View style={[s.fullPlayer, compact && s.fullPlayerCompact]}>
    {!compact && <View style={s.playerSource}><Text style={s.playerSourceEyebrow}>{playerStatus.playing ? 'NOW PLAYING' : 'PAUSED'}</Text><Text style={s.playerSourceName} numberOfLines={1}>{currentTrack.album || 'Your music library'}</Text></View>}
    <View style={[s.playerArtwork, compact && s.playerArtworkCompact]}>{currentTrack.artwork ? <Image source={{ uri: currentTrack.artwork }} resizeMode="cover" style={s.coverImage} /> : <View style={s.playerArtworkFallback}><Text style={s.playerSilhouette}>♫</Text><Text style={s.playerOfflineStamp}>ON THIS DEVICE</Text></View>}</View>
    <View style={s.playerMeta}><View style={s.playerTrackInfo}><Text numberOfLines={1} style={[s.nowTitle, s.playerTrackName]}>{currentTrack.title}</Text><Text numberOfLines={1} style={[s.nowArtist, s.playerTrackArtist]}>{currentTrack.artist}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={liked.includes(currentTrack.title) ? 'Unlike song' : 'Like song'} onPress={() => toggleLike(currentTrack)} style={s.playerLikeButton}><Text style={[s.heart, liked.includes(currentTrack.title) && { color: colors.accent }]}>{liked.includes(currentTrack.title) ? '♥' : '♡'}</Text></TouchableOpacity></View>
    <View accessibilityRole="adjustable" accessibilityLabel="Track progress" onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width || 520)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={seekAtX} onResponderMove={seekAtX} style={s.progressTouch}><View style={[s.progressTrack, s.progressTrackSeek]}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /><View style={[s.progressDot, { left: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} /></View></View><View style={s.timeRow}><Text style={s.duration}>{formatTime(playerStatus.currentTime)}</Text><Text style={s.duration}>{formatTime(playerStatus.duration || currentTrack.duration)}</Text></View>
    <View style={s.playerControls}><TouchableOpacity accessibilityRole="button" accessibilityLabel={shuffle ? 'Disable shuffle' : 'Enable shuffle'} accessibilityState={{ selected: shuffle }} onPress={() => setShuffle(!shuffle)} style={[s.playerModeButton, shuffle && s.playerModeButtonActive]}><Text style={[s.control, shuffle && s.activeText]}>⤨</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous track" onPress={playPrevious} style={s.playerModeButton}><Text style={s.control}>|◀</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={playerStatus.playing ? 'Pause' : 'Play'} onPress={togglePlay} style={[s.playButton, s.bigPlay]}><Text style={s.playGlyph}>{playerStatus.playing ? 'Ⅱ' : '▶'}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Next track" onPress={playNext} style={s.playerModeButton}><Text style={s.control}>▶|</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={repeat ? 'Disable repeat' : 'Enable repeat'} accessibilityState={{ selected: repeat }} onPress={() => setRepeat(!repeat)} style={[s.playerModeButton, repeat && s.playerModeButtonActive]}><Text style={[s.control, repeat && s.activeText]}>⤻</Text></TouchableOpacity></View>
    {!compact && <View style={s.playerExtras}><TouchableOpacity accessibilityRole="button" onPress={() => setMenu({ type: 'lyrics', track: currentTrack })} style={s.playerExtraButton}><Text style={s.playerExtraIcon}>▤</Text><Text style={s.playerExtraText}>Lyrics</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setMenu({ type: 'queue' })} style={s.playerExtraButton}><Text style={s.playerExtraIcon}>☷</Text><Text style={s.playerExtraText}>Up next</Text></TouchableOpacity></View>}
    {compact && <View style={s.offlineListening}><Text style={s.offlineListeningIcon}>◖</Text><View style={{ flex: 1 }}><Text style={s.offlineListeningTitle}>This device</Text><Text style={s.offlineListeningSub}>Playback continues in the background</Text></View><Text style={s.offlineListeningCheck}>›</Text></View>}
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchQuery, setSearchQuery, setMenu, toast, playTrack, currentTrack } = useMusic();
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
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {compact ? <>
        <View style={[s.mobileHeader, screen === 'player' && s.playerHeader]}>{screen === 'player' ? <><TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.playerHeaderButton}><Text style={s.playerHeaderChevron}>⌄</Text></TouchableOpacity><View style={s.playerHeaderCenter}><Text style={s.playerHeaderEyebrow}>PLAYING FROM</Text><Text numberOfLines={1} style={s.playerHeaderSource}>{currentTrack?.album || 'Your music library'}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Track options" onPress={() => currentTrack && setMenu({ type: 'track', track: currentTrack })} style={s.playerHeaderButton}><Text style={s.playerHeaderMore}>•••</Text></TouchableOpacity></> : <><TouchableOpacity accessibilityRole="button" onPress={() => router.push('/')} style={s.mobileBrand}><View style={s.brandIcon}><Text style={s.brandGlyph}>♫</Text></View><Text style={s.brandName}>TuneIt</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Search music" onPress={() => router.push('/search')}><Text style={s.mobileSearchGlyph}>⌕</Text></TouchableOpacity></>}</View>
        <ScrollView style={s.mobileScroll} contentContainerStyle={s.mobileContent} showsVerticalScrollIndicator={false}>
          {screen === 'local' && <View style={s.mobilePageTitle}><Text style={s.mobileTitle}>Local Music</Text></View>}
          {content}
        </ScrollView>
        {screen === 'player' ? null : <View style={[s.mobileDock, { paddingBottom: Math.max(insets.bottom, 7) }]}>
          <MiniPlayer />
          <View accessibilityRole="tablist" style={s.bottomNav}>
            <NavItem compact icon="home" title="Home" route="/" active={screen === 'home'} />
            <NavItem compact icon="favorites" title="Liked" route="/favorites" active={screen === 'favorites'} />
            <NavItem compact icon="playlists" title="Playlists" route="/playlists" active={screen === 'playlists' || screen === 'playlist'} />
            <NavItem compact icon="settings" title="Settings" route="/account" active={screen === 'account'} />
          </View>
        </View>}
      </> : <View style={s.desktopShell}>
        <SideBar screen={active} />
        <View style={s.mainColumn}><TopBar /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.mainContent}>{screen !== 'home' && <Text style={s.desktopTitle}>{titles[active] || 'TuneIt'}</Text>}{content}</ScrollView></View>
        {desktop && <MiniNowPlaying router={router} />}
      </View>}
      <ActionMenu router={router} />
      {!!toast && <View style={[s.toast, { pointerEvents: 'none' }]}><Text style={s.toastText}>{toast}</Text></View>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  dailyMix: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 18, padding: 17, marginTop: 6, marginBottom: 22, borderRadius: 20, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  dailyMixCompact: { alignItems: 'flex-start', gap: 13, padding: 13, marginTop: 0, marginBottom: 23, borderRadius: 17 },
  dailyMixArt: { width: 104, height: 104, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, position: 'relative' },
  dailyMixDisc: { width: 76, height: 76, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, transform: [{ rotate: '-18deg' }] },
  dailyMixDiscCenter: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentLight, borderWidth: 5, borderColor: colors.panel },
  dailyMixSpark: { position: 'absolute', right: 8, top: 4 }, dailyMixSparkText: { color: colors.panel, fontSize: 25, fontWeight: '800' },
  dailyMixCopy: { flex: 1, minWidth: 0 }, dailyMixEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  dailyMixTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 4 }, dailyMixSub: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4, maxWidth: 420 },
  dailyMixMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  dailyMixCount: { color: colors.muted, fontSize: 9, fontWeight: '600' }, dailyMixPlay: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 18, backgroundColor: colors.accent },
  dailyMixPlayGlyph: { color: colors.onAccent, fontSize: 10 }, dailyMixPlayText: { color: colors.onAccent, fontSize: 10, fontWeight: '700' },
  coverArtworkOrb: { position: 'absolute', width: '82%', aspectRatio: 1, borderRadius: 100, top: '-24%', right: '-20%', backgroundColor: 'rgba(255,255,255,0.20)' },
  coverArtworkDisc: { position: 'absolute', width: '64%', aspectRatio: 1, borderRadius: 100, backgroundColor: 'rgba(12,29,50,0.78)', alignItems: 'center', justifyContent: 'center', left: '13%', bottom: '-8%' },
  coverArtworkRing: { width: '68%', height: '68%', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center' },
  coverArtworkCenter: { width: '26%', height: '26%', borderRadius: 100, backgroundColor: colors.accentLight, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  topSearchBox: { flex: 1, maxWidth: 520 }, mobileSearchGlyph: { color: colors.accent, fontSize: 28, width: 42, height: 42, textAlign: 'center', textAlignVertical: 'center' }, libraryStatLine: { color: colors.muted, fontSize: 10, marginTop: 1, marginBottom: 11 }, mobileHomeTop: { marginBottom: 22 }, greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, greeting: { color: colors.muted, fontSize: 12, fontWeight: '500', marginBottom: 5 }, homeSearchTitle: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800' }, homeAvatar: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, homeAvatarText: { color: colors.accent, fontSize: 17, fontWeight: '800' }, homeSearchBox: { height: 48, borderRadius: 15, borderColor: colors.line, backgroundColor: colors.panel, paddingHorizontal: 14 }, searchClear: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel }, searchClearText: { color: colors.muted, fontSize: 20, lineHeight: 23 }, homeCategoryRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: 8, paddingRight: 4, borderBottomWidth: 1, borderBottomColor: colors.line }, homeCategory: { flex: 1, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 2, borderColor: 'transparent', backgroundColor: 'transparent' }, homeCategoryActive: { backgroundColor: 'transparent', borderColor: 'transparent', borderBottomColor: colors.accent }, homeCategoryText: { color: colors.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' }, homeCategoryTextActive: { color: colors.accent, fontWeight: '800' }, homeSectionHeader: { marginBottom: 13 }, artistRow: { gap: 15, paddingBottom: 4 }, artistCard: { width: 74, alignItems: 'center', gap: 7 }, artistName: { color: colors.text, fontSize: 9, fontWeight: '600', textAlign: 'center', width: 74 }, artistListRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, borderBottomWidth: 1, borderBottomColor: colors.line }, rowArrow: { color: colors.accent, fontSize: 22 }, albumGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }, albumTile: { width: '48%', maxWidth: 180, marginBottom: 4 }, recommendationRow: { gap: 13, paddingBottom: 4 }, recommendationCard: { width: 148 }, recommendationArt: { width: 148, height: 148, borderRadius: 17, overflow: 'hidden', position: 'relative', backgroundColor: colors.cardLight }, recommendationPlay: { position: 'absolute', right: 9, bottom: 9, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, elevation: 3 }, recommendationPlayGlyph: { color: colors.accent, fontSize: 12, marginLeft: 2 }, recommendationTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 9 }, recommendationArtist: { color: colors.muted, fontSize: 10, marginTop: 3 }, trendingHeader: { marginTop: 25 }, offlineNowPlaying: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.panel, borderRadius: 13, paddingHorizontal: 13, marginBottom: 20 }, offlineDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: colors.accent }, offlineNowText: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '600' }, offlineNowArrow: { color: colors.accent, fontSize: 20 }, homeEmpty: { alignItems: 'flex-start', padding: 20, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, homeEmptyTitle: { color: colors.text, fontSize: 16, fontWeight: '750' }, homeEmptyText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6, marginBottom: 15 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowMore: { padding: 5 },
  trendTap: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  libraryMain: { flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 },
  moreButton: { paddingHorizontal: 6, paddingVertical: 9 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingVertical: 28 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(12, 29, 50, 0.72)' },
  actionSheet: { width: '100%', maxWidth: 480, maxHeight: '78%', backgroundColor: colors.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, borderWidth: 1, borderColor: colors.line },
  sheetHandle: { width: 40, height: 4, borderRadius: 3, backgroundColor: colors.panel, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sheetSubtitle: { color: colors.muted, fontSize: 11, marginBottom: 12 },
  sheetOptions: { flexGrow: 0, marginTop: 7 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 49, borderBottomWidth: 1, borderBottomColor: colors.line },
  sheetIcon: { color: colors.accent, fontSize: 17, width: 24, textAlign: 'center' },
  sheetActionText: { color: colors.text, fontSize: 12, flex: 1 },
  sheetCancel: { marginTop: 13, backgroundColor: colors.panel, borderRadius: 14, alignItems: 'center', paddingVertical: 13 },
  sheetCancelText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  moodHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  moodHint: { color: colors.muted, fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  moodCard: { flex: 1, minHeight: 58, borderRadius: 13, paddingHorizontal: 9, paddingVertical: 9, justifyContent: 'space-between', borderWidth: 1, borderColor: 'transparent' },
  moodCardSelected: { borderColor: colors.accent, ...Platform.select({ web: { boxShadow: '0px 4px 12px rgba(12, 29, 50, 0.12)' }, default: { shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 } }) },
  moodIcon: { color: colors.accent, fontSize: 15 },
  moodName: { color: colors.text, fontSize: 10, fontWeight: '700' },
  createPlaylistForm: { gap: 12, marginTop: 16, marginBottom: 8 },
  playlistNameInput: { height: 46, backgroundColor: colors.panel, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, color: colors.text, fontSize: 13 },
  savePlaylistButton: { alignSelf: 'stretch', alignItems: 'center', borderRadius: 12 },
  toast: { position: 'absolute', bottom: 78, alignSelf: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, zIndex: 20, elevation: 8 },
  toastText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  coverImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  heroImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  heroTint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(12, 29, 50, 0.54)' },
  playerTint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(12, 29, 50, 0.12)' },
  backIcon: { color: colors.text, fontSize: 30, lineHeight: 34 },
  mobileNowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  safe: { flex: 1, backgroundColor: colors.background },
  desktopShell: { flex: 1, flexDirection: 'row', padding: 16, paddingRight: 14, gap: 16, maxWidth: 1800, width: '100%', alignSelf: 'center' },
  sidebar: { width: 220, backgroundColor: colors.panel, borderRadius: 22, padding: 16, paddingTop: 20, marginVertical: 2, borderWidth: 1, borderColor: colors.line },
  mainColumn: { flex: 1, minWidth: 0 }, mainContent: { paddingHorizontal: 4, paddingBottom: 30 },
  rightPanel: { width: 310, backgroundColor: colors.panel, borderRadius: 22, padding: 18, marginVertical: 2, borderWidth: 1, borderColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 }, brandIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, brandGlyph: { color: colors.onAccent, fontSize: 21, fontWeight: '800' }, brandName: { color: colors.text, fontSize: 17, fontWeight: '800' }, brandSub: { color: colors.muted, fontSize: 9, marginTop: 1 },
  menu: { gap: 4 }, navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 11, borderRadius: 11, gap: 12 }, navItemActive: { backgroundColor: colors.card }, navIcon: { color: colors.muted, fontSize: 17, width: 20, textAlign: 'center' }, navLabel: { color: colors.text, fontSize: 12 }, activeText: { color: colors.accent, fontWeight: '700' },
  sideSectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12, paddingHorizontal: 4 }, sideHeading: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }, addIcon: { color: colors.accent, fontSize: 21 }, sidePlaylist: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }, sidePlaylistMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 }, sidePlaylistName: { color: colors.text, fontSize: 11, fontWeight: '600' }, sidePlaylistMeta: { color: colors.muted, fontSize: 9, marginTop: 3 }, localCard: { marginTop: 'auto', backgroundColor: colors.card, borderRadius: 14, padding: 11, minHeight: 80, flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }, localIcon: { color: colors.accentLight, fontSize: 17 },
  cover: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }, coverGlow: { position: 'absolute', width: '100%', height: '70%', top: 0, backgroundColor: 'rgba(255,255,255,0.10)', borderBottomLeftRadius: 60, borderBottomRightRadius: 60 }, coverIcon: { color: 'rgba(255,255,255,0.92)', fontWeight: '800', ...Platform.select({ web: { textShadow: '0px 0px 10px rgba(10, 10, 20, 0.4)' }, default: { textShadowColor: 'rgba(10,10,20,0.4)', textShadowRadius: 10 } }) },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, marginBottom: 8 }, searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 12, height: 42, gap: 8 }, searchBoxFocused: { borderColor: colors.accentLight }, searchIcon: { fontSize: 22, color: colors.muted }, searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 12, paddingVertical: 0, borderWidth: 0, backgroundColor: 'transparent', ...Platform.select({ web: { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' }, default: {} }) }, profile: { flexDirection: 'row', alignItems: 'center', gap: 8 }, avatar: { overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: colors.onAccent, backgroundColor: colors.accent, width: 29, height: 29, borderRadius: 15, fontWeight: '700' }, profileName: { color: colors.text, fontSize: 11, fontWeight: '600' }, profileChevron: { color: colors.muted, fontSize: 16 }, topIcon: { color: colors.accent, fontSize: 21 },
  hero: { minHeight: 200, backgroundColor: colors.panel, borderRadius: 19, padding: 24, position: 'relative', overflow: 'hidden', justifyContent: 'center', marginBottom: 23 }, heroGlow: { position: 'absolute', right: -25, top: -80, width: 300, height: 300, borderRadius: 160, backgroundColor: colors.panel, opacity: 0.75 }, heroCopy: { zIndex: 2, width: '65%' }, heroCopyCompact: { width: '100%' }, heroEyebrow: { color: colors.accent, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 9 }, heroTitle: { color: colors.text, fontSize: 29, fontWeight: '800', lineHeight: 31 }, heroSub: { color: colors.text, fontSize: 11, lineHeight: 17, maxWidth: 300, marginTop: 7, marginBottom: 14 }, button: { borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 17, paddingVertical: 10, alignSelf: 'flex-start' }, buttonText: { color: colors.onAccent, fontSize: 11, fontWeight: '700' }, heroPerson: { position: 'absolute', right: 20, bottom: -5, width: 120, height: 155, alignItems: 'center', justifyContent: 'flex-start' }, heroHead: { color: colors.text, fontSize: 65, lineHeight: 76 }, heroBody: { color: colors.text, fontSize: 150, lineHeight: 100, transform: [{ rotate: '90deg' }] }, heroDots: { flexDirection: 'row', position: 'absolute', bottom: 13, alignSelf: 'center', gap: 5 }, dot: { width: 5, height: 5, borderRadius: 4, backgroundColor: colors.card }, dotActive: { width: 16, height: 5, borderRadius: 4, backgroundColor: colors.accent },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, label: { color: colors.text, fontSize: 16, fontWeight: '750' }, seeAll: { color: colors.accent, fontSize: 10, fontWeight: '700' }, recentList: { gap: 12, paddingBottom: 3 }, recentCard: { width: 154 }, recentTitle: { color: colors.text, fontWeight: '650', fontSize: 11, marginTop: 8 }, trackSub: { color: colors.muted, fontSize: 9, marginTop: 3 }, trendingList: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, trendingItem: { minWidth: 142, flexGrow: 1, flexBasis: '18%', flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.card, padding: 8, borderRadius: 12 }, trackCopy: { flex: 1, minWidth: 0 }, trackTitle: { color: colors.text, fontSize: 11, fontWeight: '650' }, trendPlay: { color: colors.accent, fontSize: 12, paddingHorizontal: 4 },
  quickAccessHeading: { marginTop: 18, marginBottom: 10 }, quickAccessHint: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.7 }, quickAccessRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 }, quickAccessRowWide: { marginBottom: 18 }, quickAccessCard: { width: 158, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: colors.panel, borderRadius: 15, borderWidth: 1, borderColor: colors.line }, quickAccessCardWide: { flex: 1, width: 'auto', minWidth: 150, maxWidth: 240 }, quickAccessIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.card }, quickAccessGlyph: { color: colors.accent, fontSize: 18, fontWeight: '700' }, quickAccessCopy: { flex: 1, minWidth: 0 }, quickAccessTitle: { color: colors.text, fontSize: 10, fontWeight: '700' }, quickAccessMeta: { color: colors.muted, fontSize: 9, marginTop: 4 }, quickAccessArrow: { color: colors.accent, fontSize: 20, fontWeight: '500' },
  nowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, nowEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }, more: { color: colors.muted, fontSize: 15 }, nowArt: { height: 190, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: colors.panel }, artSun: { position: 'absolute', top: 25, width: 54, height: 54, borderRadius: 30, backgroundColor: colors.card, opacity: 0.85 }, artPerson: { position: 'absolute', fontSize: 90, color: colors.text, bottom: -12 }, nowTitle: { color: colors.text, fontSize: 16, fontWeight: '750', textAlign: 'center' }, nowArtist: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4 }, progressTrack: { height: 4, borderRadius: 5, backgroundColor: colors.line, marginTop: 18, position: 'relative', overflow: 'visible' }, progressFill: { height: 4, borderRadius: 5, backgroundColor: colors.accent }, progressDot: { position: 'absolute', left: '43%', top: -4, width: 12, height: 12, borderRadius: 7, backgroundColor: colors.accentLight, elevation: 2 }, timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, duration: { color: colors.muted, fontSize: 9 }, playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 }, control: { color: colors.text, fontSize: 17, fontWeight: '700' }, playButton: { width: 44, height: 44, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: `0px 4px 12px ${colors.accent}38` }, default: { shadowColor: colors.accent, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 } }) }, playGlyph: { color: colors.onAccent, fontSize: 17, fontWeight: '800' }, volume: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }, volumeTrack: { flex: 1, marginTop: 0 }, queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.line, marginTop: 17, paddingTop: 13, marginBottom: 4 }, queueTitle: { color: colors.text, fontSize: 12, fontWeight: '700' }, equalizer: { color: colors.accent, fontSize: 12 },
  trackRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 7 }, trackMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, trackIndex: { color: colors.muted, fontSize: 9, width: 18 },
  pageHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 }, pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 }, pageSub: { color: colors.muted, fontSize: 11, lineHeight: 17 }, sortButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, sortButtonText: { color: colors.accent, fontSize: 9, fontWeight: '700' }, chips: { flexDirection: 'row', gap: 8, marginVertical: 14, flexWrap: 'wrap' }, chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, chipActive: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { color: colors.text, fontSize: 10 }, chipTextActive: { color: colors.onAccent, fontWeight: '700' }, libraryRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9, borderBottomWidth: 1, borderColor: colors.line },
  scanScreen: { alignItems: 'center', paddingTop: 50, paddingBottom: 30 }, scanOrb: { width: 135, height: 135, borderRadius: 70, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', marginBottom: 27 }, scanMusic: { color: colors.accent, fontSize: 47 }, orbit: { position: 'absolute', width: 105, height: 105, borderWidth: 2, borderColor: colors.accent, borderLeftColor: 'transparent', borderRadius: 55, transform: [{ rotate: '-35deg' }] }, scanChecks: { width: '100%', maxWidth: 380, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 15, marginTop: 28 }, checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderColor: colors.line, gap: 10 }, check: { color: colors.accent, fontSize: 16 }, scanCheckLabel: { color: colors.text, fontSize: 11, flex: 1 }, scanCheckValue: { color: colors.muted, fontSize: 11 }, scanProgress: { width: '100%', maxWidth: 380, height: 8, backgroundColor: colors.panel, borderRadius: 8, marginTop: 25, overflow: 'hidden' }, scanPercent: { color: colors.muted, fontSize: 10, alignSelf: 'flex-end', marginTop: 6 }, listCaption: { color: colors.muted, fontSize: 9, letterSpacing: 1.1, fontWeight: '700', marginTop: 15, marginBottom: 8 }, downloadButton: { width: 33, height: 33, borderRadius: 17, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' }, downloadGlyph: { color: colors.accent, fontSize: 17 }, downloadCount: { color: colors.accent, backgroundColor: colors.panel, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11 },
  playlistHero: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 10, marginBottom: 4 }, playlistInfo: { flex: 1, paddingBottom: 6 }, playlistActions: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 14 }, secondaryButton: { backgroundColor: colors.panel, paddingHorizontal: 14 }, shufflePlaylistButton: { backgroundColor: colors.panel }, mobilePlaylistArtwork: { width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: colors.panel, marginTop: 8 }, mobilePlaylistFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' }, mobilePlaylistGlyph: { color: 'rgba(255,255,255,0.9)', fontSize: 100, fontWeight: '800' }, mobilePlaylistShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(12,29,50,0.32)' }, mobilePlaylistCopy: { position: 'absolute', left: 20, right: 20, bottom: 20 }, mobilePlaylistEyebrow: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 6 }, mobilePlaylistTitle: { color: colors.text, fontSize: 27, lineHeight: 32, fontWeight: '800' }, mobilePlaylistSub: { color: colors.text, fontSize: 11, marginTop: 5 },
  playerSource: { alignItems: 'center', marginBottom: 15, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  playerLikeButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.panel },
  progressTouch: { width: '100%', height: 26, justifyContent: 'center', paddingHorizontal: 2 }, progressTrackSeek: { marginTop: 0 },
  playerModeButton: { width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, playerModeButtonActive: { backgroundColor: colors.panel }, playerExtraButton: { minWidth: 120, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, playerExtraIcon: { color: colors.accent, fontSize: 16, fontWeight: '700' }, playerExtraText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  fullPlayer: { alignItems: 'center', padding: 10, maxWidth: 520, alignSelf: 'center', width: '100%' }, fullPlayerCompact: { paddingTop: 4, paddingHorizontal: 2 }, playerSourceEyebrow: { color: colors.muted, fontSize: 8, letterSpacing: 1.1, fontWeight: '700' }, playerSourceName: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 3, maxWidth: 280 }, playerArtwork: { width: '100%', aspectRatio: 1, maxHeight: 440, borderRadius: 22, backgroundColor: colors.panel, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative', ...Platform.select({ web: { boxShadow: '0px 8px 17px rgba(12, 29, 50, 0.12)' }, default: { shadowColor: colors.accent, shadowOpacity: 0.12, shadowRadius: 17, shadowOffset: { width: 0, height: 8 }, elevation: 4 } }) }, playerArtworkCompact: { maxHeight: 360, borderRadius: 20 }, playerArtworkFallback: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel }, playerOfflineStamp: { position: 'absolute', bottom: 15, color: colors.text, fontSize: 8, fontWeight: '800', letterSpacing: 1.5 }, playerSun: { position: 'absolute', width: '34%', aspectRatio: 1, top: '13%', borderRadius: 200, backgroundColor: colors.card, opacity: 0.88 }, playerPalm: { position: 'absolute', right: '13%', top: '2%', color: colors.text, fontSize: 120 }, playerSilhouette: { position: 'absolute', color: colors.text, fontSize: 145, bottom: 20 }, playerShoulders: { position: 'absolute', color: colors.text, fontSize: 245, bottom: -102, transform: [{ rotate: '90deg' }] }, playerMeta: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, playerTrackInfo: { flex: 1, minWidth: 0, paddingRight: 15 }, playerTrackName: { textAlign: 'left', fontSize: 20, fontWeight: '800' }, playerTrackArtist: { textAlign: 'left', fontSize: 12 }, heart: { color: colors.text, fontSize: 26 }, bigPlay: { width: 62, height: 62, borderRadius: 32 }, playerExtras: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, flexWrap: 'wrap', gap: 10 }, offlineListening: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 12, marginTop: 20 }, offlineListeningIcon: { color: colors.accent, fontSize: 18 }, offlineListeningTitle: { color: colors.text, fontSize: 11, fontWeight: '700' }, offlineListeningSub: { color: colors.muted, fontSize: 9, marginTop: 3 }, offlineListeningCheck: { color: colors.text, fontSize: 16, fontWeight: '800' },
  mobileHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 19 }, playerHeader: { height: 58, paddingHorizontal: 21 }, playerHeaderButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, playerHeaderChevron: { color: colors.text, fontSize: 21, lineHeight: 24, marginTop: -5 }, playerHeaderMore: { color: colors.text, fontSize: 13, letterSpacing: 1 }, playerHeaderCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 }, playerHeaderEyebrow: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1 }, playerHeaderSource: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 2, maxWidth: 220 }, mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, mobileScroll: { flex: 1 }, mobileContent: { paddingHorizontal: 19, paddingTop: 11, paddingBottom: 30 }, mobilePageTitle: { marginBottom: 16 }, mobileTitle: { color: colors.text, fontSize: 21, fontWeight: '750' },
  mobileDock: { backgroundColor: 'transparent', paddingTop: 0 },
  bottomNav: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 12, marginTop: 6, paddingHorizontal: 6, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 19, ...Platform.select({ web: { boxShadow: '0px 5px 18px rgba(12, 29, 50, 0.12)' }, default: { shadowColor: colors.text, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } }) },
  bottomItem: { flex: 1, minWidth: 0, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 17, paddingVertical: 4, marginHorizontal: 2 }, bottomItemActive: { backgroundColor: 'transparent' },
  bottomIconBox: { width: 40, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  bottomLabel: { color: colors.text, fontSize: 10, fontWeight: '600', letterSpacing: 0.1, marginTop: 2 },
  bottomLabelActive: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 0.1, marginTop: 2 },
  glyphCanvas: { width: 22, height: 22, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  homeRoofLeft: { position: 'absolute', width: 10, height: 2, left: 2, top: 6, borderRadius: 2, transform: [{ rotate: '-42deg' }] }, homeRoofRight: { position: 'absolute', width: 10, height: 2, right: 2, top: 6, borderRadius: 2, transform: [{ rotate: '42deg' }] }, homeBody: { position: 'absolute', width: 13, height: 10, left: 4.5, bottom: 1, borderWidth: 1.8, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }, homeDoor: { position: 'absolute', width: 4, height: 6, bottom: 1, left: 9, borderWidth: 1.5, borderBottomWidth: 0, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  searchLens: { position: 'absolute', width: 14, height: 14, left: 2, top: 2, borderWidth: 1.8, borderRadius: 8 }, searchHandle: { position: 'absolute', width: 8, height: 1.8, right: 0, bottom: 2, borderRadius: 2, transform: [{ rotate: '48deg' }] },
  libraryFrame: { width: 15, height: 18, borderWidth: 1.7, borderRadius: 3, alignItems: 'center', justifyContent: 'center', gap: 3 }, libraryLine: { width: 8, height: 1.5, borderRadius: 1 },
  downloadStem: { position: 'absolute', width: 1.8, height: 10, left: 10, top: 2, borderRadius: 1 }, downloadArrowLeft: { position: 'absolute', width: 6, height: 1.8, left: 5, top: 9, borderRadius: 1, transform: [{ rotate: '45deg' }] }, downloadArrowRight: { position: 'absolute', width: 6, height: 1.8, right: 5, top: 9, borderRadius: 1, transform: [{ rotate: '-45deg' }] }, downloadTray: { position: 'absolute', width: 15, height: 6, left: 3.5, bottom: 1, borderWidth: 1.6, borderTopWidth: 1.8, borderRadius: 2 },
  desktopTitle: { color: colors.text, fontSize: 23, fontWeight: '800', marginHorizontal: 4, marginBottom: 15 },
});

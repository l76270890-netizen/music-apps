import { useMusic } from '../context/MusicContext';

export default function useAudioPlayer() {
  const music = useMusic();
  return {
    player: music.player,
    status: music.playerStatus,
    track: music.currentTrack,
    play: () => music.togglePlay(),
    playTrack: (track, autoPlay = true) => music.playTrack(track, autoPlay),
    pause: () => music.player.pause(),
    next: music.playNext,
    previous: music.playPrevious,
    seek: (seconds) => music.player.seekTo(Math.max(0, Number(seconds) || 0)),
    setVolume: music.setVolume,
  };
}

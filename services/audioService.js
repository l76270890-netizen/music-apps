export function play(player) { player?.play?.(); }
export function pause(player) { player?.pause?.(); }
export function toggle(player, playing) { if (playing) pause(player); else play(player); }
export function seek(player, seconds) { if (Number.isFinite(seconds) && seconds >= 0) player?.seekTo?.(seconds); }
export function setVolume(player, volume) {
  const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  if (player) player.volume = safeVolume;
  return safeVolume;
}
export function load(player, source, shouldPlay = true) {
  if (!player || !source) return;
  player.replace(source);
  if (shouldPlay) play(player);
}
export default { play, pause, toggle, seek, setVolume, load };

import TuneItApp from '../../components/TuneItApp';
import { useLocalSearchParams } from 'expo-router';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams();
  return <TuneItApp screen="playlist" playlistId={id} />;
}

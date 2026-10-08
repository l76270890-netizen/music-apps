import { Platform } from 'react-native';
import Storage from 'expo-sqlite/kv-store';

function webStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export const appStorage = {
  getItem(key) {
    if (Platform.OS === 'web') return Promise.resolve(webStorage()?.getItem(key) ?? null);
    return Storage.getItem(key);
  },
  setItem(key, value) {
    if (Platform.OS === 'web') { webStorage()?.setItem(key, value); return Promise.resolve(); }
    return Storage.setItem(key, value);
  },
  removeItem(key) {
    if (Platform.OS === 'web') { webStorage()?.removeItem(key); return Promise.resolve(); }
    return Storage.removeItem(key);
  },
};

export default appStorage;

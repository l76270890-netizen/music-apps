import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, setApiToken } from './api';
import Storage from './storage';

const TOKEN_KEY = 'tuneit-access-token';

async function saveToken(token) {
  if (Platform.OS === 'web') await Storage.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
  setApiToken(token);
}

export async function restoreSession() {
  const token = Platform.OS === 'web'
    ? await Storage.getItem(TOKEN_KEY)
    : await SecureStore.getItemAsync(TOKEN_KEY);
  setApiToken(token);
  if (!token) return null;
  try { return await api.get('/auth/me'); }
  catch (error) {
    // Keep a valid token when the API is temporarily unreachable. Clear only rejected credentials.
    if (error?.status === 401 || error?.status === 403) { await signOut(); return null; }
    throw error;
  }
}

export async function signIn(email, password) {
  const result = await api.post('/auth/login', { email, password });
  await saveToken(result.access_token);
  return result.user;
}

export async function signUp(email, username, password) {
  const result = await api.post('/auth/register', { email, username, password });
  await saveToken(result.access_token);
  return result.user;
}

export async function signOut() {
  if (Platform.OS === 'web') await Storage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
  setApiToken(null);
}

export default { restoreSession, signIn, signUp, signOut };

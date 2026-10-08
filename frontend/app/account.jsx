import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMusic } from '../context/MusicContext';
import { apiBaseUrlConfigured } from '../services/api';
import { colors } from '../constants/colors';

export default function AccountScreen() {
  const router = useRouter();
  const { user, authStatus, authError, signIn, signUp, signOut, syncLibrary } = useMusic();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const emailInput = useRef(null);
  const passwordInput = useRef(null);
  const configured = apiBaseUrlConfigured();

  const submit = async () => {
    if (!email.trim() || !email.trim().includes('@')) { setMessage('Enter a valid email address.'); return; }
    if (mode === 'register' && !username.trim()) { setMessage('Enter a username.'); return; }
    if (!password) { setMessage('Enter your password.'); return; }
    if (mode === 'register' && password.length < 8) { setMessage('Your password must be at least 8 characters.'); return; }
    setBusy(true); setMessage('');
    try {
      if (mode === 'register') await signUp(email.trim(), username.trim(), password);
      else await signIn(email.trim(), password);
      setMessage('You are signed in.');
    } catch (error) { setMessage(error?.message || 'Could not sign in. Check the API address and your details.'); }
    finally { setBusy(false); }
  };

  const signOutAction = async () => {
    setBusy(true); setMessage('');
    try { await signOut(); setMessage('Signed out.'); }
    catch (error) { setMessage(error?.message || 'Could not sign out. Please try again.'); }
    finally { setBusy(false); }
  };

  const sync = async () => {
    setBusy(true); setMessage('');
    try { const result = await syncLibrary(); setMessage(`Synced ${result.songs} songs and ${result.playlists} playlists.`); }
    catch (error) { setMessage(error?.message || 'Sync failed. Check that the backend is running.'); }
    finally { setBusy(false); }
  };

  const fieldStyle = { height: 48, marginTop: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#FFFFFF', color: colors.text, borderWidth: 1, borderColor: colors.line };
  const buttonStyle = { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.accent, marginTop: 16, paddingHorizontal: 18 };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 22, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={{ color: colors.accent, fontSize: 14 }}>‹  Back</Text></TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 28 }}>TuneIt account</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 }}>Your audio files stay on your device. Sign in to sync song details, favorites, and playlists.</Text>
        {!configured && <View style={{ padding: 14, backgroundColor: '#F0ECFA', borderRadius: 12, marginTop: 20 }}><Text style={{ color: '#51466B', fontSize: 12, lineHeight: 18 }}>Sign in and sync are optional. Local music playback works offline. To sync favorites and playlists, set EXPO_PUBLIC_API_URL and restart Expo.</Text></View>}
        {authStatus === 'loading' ? <View accessibilityRole="progressbar" style={{ marginTop: 30, alignItems: 'center', gap: 12 }}><ActivityIndicator color={colors.accentLight} /><Text style={{ color: colors.muted }}>Checking your account…</Text></View> : user ? <View style={{ marginTop: 24, padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>{user.username}</Text><Text style={{ color: colors.muted, marginTop: 5 }}>{user.email}</Text>
          <TouchableOpacity disabled={busy || !configured} onPress={sync} style={[buttonStyle, (!configured || busy) && { opacity: 0.5 }]}>{busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Sync library and playlists</Text>}</TouchableOpacity>
          <TouchableOpacity disabled={busy} onPress={signOutAction} style={{ marginTop: 18, alignItems: 'center' }}><Text style={{ color: colors.accent }}>Sign out</Text></TouchableOpacity>
        </View> : <View style={{ marginTop: 20 }}>
          {mode === 'register' && <TextInput accessibilityLabel="Username" value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor={colors.muted} autoCapitalize="words" autoComplete="username-new" returnKeyType="next" onSubmitEditing={() => emailInput.current?.focus()} style={fieldStyle} />}
          <TextInput ref={emailInput} accessibilityLabel="Email" value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} style={fieldStyle} />
          <TextInput ref={passwordInput} accessibilityLabel="Password" value={password} onChangeText={setPassword} placeholder={mode === 'register' ? 'Password (8 characters minimum)' : 'Password'} placeholderTextColor={colors.muted} autoCapitalize="none" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} secureTextEntry returnKeyType="done" onSubmitEditing={submit} style={fieldStyle} />
          <TouchableOpacity disabled={busy || !configured} onPress={submit} style={[buttonStyle, (!configured || busy) && { opacity: 0.5 }]}>{busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>{mode === 'register' ? 'Create account' : 'Sign in'}</Text>}</TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode(mode === 'register' ? 'login' : 'register'); setMessage(''); }} style={{ marginTop: 18, alignItems: 'center' }}><Text style={{ color: colors.accent }}>{mode === 'register' ? 'Already have an account? Sign in' : 'New to TuneIt? Create an account'}</Text></TouchableOpacity>
        </View>}
        {!!authError && !user && authStatus === 'error' && <Text style={{ color: '#9A5C18', marginTop: 16, lineHeight: 20 }}>{authError.includes('expired') ? authError : 'Could not reconnect to your account. Check that the API is running, then try signing in again. Your saved token has been kept.'}</Text>}
        {!!message && <Text accessibilityRole="alert" style={{ color: message.toLocaleLowerCase().includes('signed') ? '#287A50' : '#B54747', marginTop: 16, lineHeight: 20 }}>{message}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

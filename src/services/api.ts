import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = (global as any).__API_BASE__ || 'http://localhost:3000';

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  // Prefer cookie-based sessions; for APIs that require bearer tokens, include accessToken from storage.
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(API_BASE + path, {
    ...opts,
    headers,
    // include credentials to allow cookie-based NextAuth sessions
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json().catch(() => null);
}

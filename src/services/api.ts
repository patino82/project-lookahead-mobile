import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

const API_BASE = ENV.API_BASE;

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

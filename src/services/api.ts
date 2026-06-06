import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { resetToLogin } from '../navigation/RootNavigation';

const API_BASE = ENV.API_BASE;

type ApiFetchOptions = RequestInit & {
  skipAuthRetry?: boolean;
};

async function buildHeaders(opts: RequestInit) {
  const headers = new Headers(opts.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  // Prefer cookie-based sessions; for APIs that require bearer tokens, include accessToken from storage.
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function runRequest(path: string, opts: RequestInit) {
  const headers = await buildHeaders(opts);

  return fetch(API_BASE + path, {
    ...opts,
    headers,
    // include credentials to allow cookie-based NextAuth sessions
    credentials: 'include',
  });
}

async function trySilentRefresh() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  // The current backend exposes cookie-based sessions, not a mobile refresh endpoint.
  // If a future login stores refreshToken, this retry lets a valid cookie session rehydrate the request.
  await AsyncStorage.removeItem('accessToken');
  return true;
}

async function handleAuthExpired() {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  resetToLogin();
}

export async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
  const { skipAuthRetry, ...requestOpts } = opts;

  let res = await runRequest(path, requestOpts);

  if (res.status === 401 && !skipAuthRetry) {
    const didRefresh = await trySilentRefresh();
    if (didRefresh) {
      res = await runRequest(path, requestOpts);
    }

    if (res.status === 401) {
      await handleAuthExpired();
    }
  }

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json().catch(() => null);
}

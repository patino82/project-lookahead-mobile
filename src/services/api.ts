import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

const API_BASE = ENV.API_BASE;
const TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body.error) return body.error;
    if (body.message) return body.message;
  } catch {
    /* ignore */
  }
  return `API error ${res.status}`;
}

interface TokenData {
  accessToken: string;
  expiresAt?: number; // unix ms
}

async function getValidToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem('auth');
  if (!raw) {
    // fallback: check legacy key
    const legacy = await AsyncStorage.getItem('accessToken');
    return legacy;
  }
  try {
    const parsed = JSON.parse(raw) as TokenData;
    if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
      // Token expired — clear it
      await AsyncStorage.removeItem('auth');
      return null;
    }
    return parsed.accessToken;
  } catch {
    // malformed — treat as plain token string
    return raw;
  }
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  const token = await getValidToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      ...opts,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    if (networkErr?.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your network and try again.', 408);
    }
    throw new ApiError('No connection. Check your network and try again.', 0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    // Token rejected — clear stored auth
    await AsyncStorage.multiRemove(['auth', 'accessToken']);
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    const message = await parseErrorBody(res);
    throw new ApiError(message, res.status);
  }

  return res.json().catch(() => null);
}

export async function apiFetchOrError<T = any>(
  path: string,
  opts: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiFetch(path, opts) as T;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unknown error' };
  }
}

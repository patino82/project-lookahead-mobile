import * as SecureStore from 'expo-secure-store';
import { ENV } from '../config/env';
import { resetToLogin } from '../navigation/RootNavigation';
import {
  getDailyLogs,
  getDashboard,
  getOpenItems,
  getProjects,
  getQueuedRequests,
  getTasks,
  initDB,
  queueRequest,
  removeQueuedRequest,
  saveDailyLogs,
  saveDashboard,
  saveOpenItems,
  saveProjects,
  saveTasks,
} from './offline-db';

const API_BASE = ENV.API_BASE;

// Keys stored in SecureStore (sensitive token data)
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

async function getSecureToken(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setSecureToken(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function removeSecureToken(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

type ApiFetchOptions = RequestInit & {
  skipAuthRetry?: boolean;
};

type ProjectPath = {
  projectId: string;
  resource: string;
};

async function buildHeaders(opts: RequestInit) {
  const headers = new Headers(opts.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  // Prefer cookie-based sessions; for APIs that require bearer tokens, include accessToken from secure storage.
  const token = await getSecureToken(ACCESS_TOKEN_KEY);
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

function isNetworkError(error: unknown) {
  return error instanceof TypeError || String((error as Error)?.message || '').toLowerCase().includes('network');
}

function withOfflineFlag<T>(data: T, isOffline: boolean): T & { isOffline: boolean } {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...(data as object), isOffline } as T & { isOffline: boolean };
  }

  if (Array.isArray(data)) {
    Object.defineProperty(data, 'isOffline', {
      value: isOffline,
      enumerable: false,
      configurable: true,
    });
  }

  return data as T & { isOffline: boolean };
}

function parseProjectPath(path: string): ProjectPath | null {
  const cleanPath = path.split('?')[0];
  const match = cleanPath.match(/^\/api\/projects\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return {
    projectId: match[1],
    resource: match[2],
  };
}

async function cacheSuccessfulRead(path: string, data: any) {
  await initDB();
  if (path === '/api/projects' && data?.projects) {
    await saveProjects(data.projects);
    return;
  }

  const projectPath = parseProjectPath(path);
  if (!projectPath) return;

  if (projectPath.resource === 'tasks') {
    await saveTasks(data?.tasks || data || [], projectPath.projectId);
  } else if (projectPath.resource === 'site-logs') {
    await saveDailyLogs(data?.logs || data || [], projectPath.projectId);
  } else if (projectPath.resource === 'open-items') {
    await saveOpenItems(data?.items || data || [], projectPath.projectId);
  } else if (projectPath.resource === 'dashboard' && data) {
    await saveDashboard(data, projectPath.projectId);
  }
}

async function offlineFallback(path: string) {
  if (path === '/api/projects') {
    return withOfflineFlag({ projects: await getProjects() }, true);
  }

  const projectPath = parseProjectPath(path);
  if (!projectPath) return null;

  if (projectPath.resource === 'tasks') {
    return withOfflineFlag({ tasks: await getTasks(projectPath.projectId) }, true);
  }
  if (projectPath.resource === 'site-logs') {
    return withOfflineFlag({ logs: await getDailyLogs(projectPath.projectId) }, true);
  }
  if (projectPath.resource === 'open-items') {
    return withOfflineFlag({ items: await getOpenItems(projectPath.projectId) }, true);
  }
  if (projectPath.resource === 'dashboard') {
    const dashboard = await getDashboard(projectPath.projectId);
    return dashboard ? withOfflineFlag(dashboard, true) : null;
  }

  return null;
}

async function replayQueuedRequests() {
  const queued = await getQueuedRequests();
  for (const item of queued) {
    try {
      const res = await runRequest(item.path, {
        method: item.method,
        body: item.body || undefined,
      });
      if (res.ok) {
        await removeQueuedRequest(item.id);
      }
    } catch {
      return;
    }
  }
}

async function trySilentRefresh() {
  const refreshToken = await getSecureToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  // The current backend exposes cookie-based sessions, not a mobile refresh endpoint.
  // If a future login stores refreshToken, this retry lets a valid cookie session rehydrate the request.
  await removeSecureToken(ACCESS_TOKEN_KEY);
  return true;
}

async function handleAuthExpired() {
  await Promise.all([
    removeSecureToken(ACCESS_TOKEN_KEY),
    removeSecureToken(REFRESH_TOKEN_KEY),
  ]);
  resetToLogin();
}

export async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
  const { skipAuthRetry, ...requestOpts } = opts;
  const method = (requestOpts.method || 'GET').toUpperCase();

  try {
    await initDB();
    if (method === 'GET') {
      await replayQueuedRequests();
    }

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

    if (!res.ok) {
      const error = new Error(`API error ${res.status}`);
      (error as Error & { status?: number }).status = res.status;
      throw error;
    }

    const data = await res.json().catch(() => null);
    if (method === 'GET') {
      await cacheSuccessfulRead(path, data);
    }
    return withOfflineFlag(data, false);
  } catch (error) {
    if (method === 'GET') {
      const cached = await offlineFallback(path);
      if (cached) return cached;
    } else if (isNetworkError(error)) {
      await queueRequest(path, method, typeof requestOpts.body === 'string' ? requestOpts.body : null);
    }

    throw error;
  }
}

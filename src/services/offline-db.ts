import * as SQLite from 'expo-sqlite';
import type { DailyLogEntry, LogEntry, OpenItem, Project, Task } from '../types';

type OfflineRow<T> = {
  id: string;
  projectId?: string;
  payload: string;
  updatedAt: string;
};

export type QueuedRequest = {
  id: string;
  path: string;
  method: string;
  body?: string | null;
  createdAt: string;
};

const DB_NAME = 'project-lookahead-offline.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const now = () => new Date().toISOString();

async function getDB() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDB() {
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId);
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(projectId);
    CREATE TABLE IF NOT EXISTS open_items (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_open_items_project ON open_items(projectId);
    CREATE TABLE IF NOT EXISTS dashboards (
      projectId TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS queued_requests (
      id TEXT PRIMARY KEY NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      body TEXT,
      createdAt TEXT NOT NULL
    );
  `);
}

async function upsertPayload(table: string, id: string, payload: unknown, projectId?: string) {
  await initDB();
  const db = await getDB();
  if (projectId) {
    await db.runAsync(
      `INSERT OR REPLACE INTO ${table} (id, projectId, payload, updatedAt) VALUES (?, ?, ?, ?)`,
      id,
      projectId,
      JSON.stringify(payload),
      now(),
    );
    return;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO ${table} (id, payload, updatedAt) VALUES (?, ?, ?)`,
    id,
    JSON.stringify(payload),
    now(),
  );
}

async function readPayloads<T>(table: string, projectId?: string): Promise<T[]> {
  await initDB();
  const db = await getDB();
  const rows = projectId
    ? await db.getAllAsync<OfflineRow<T>>(`SELECT payload FROM ${table} WHERE projectId = ? ORDER BY updatedAt DESC`, projectId)
    : await db.getAllAsync<OfflineRow<T>>(`SELECT payload FROM ${table} ORDER BY updatedAt DESC`);
  return rows.map(row => JSON.parse(row.payload) as T);
}

export async function saveProjects(projects: Project[]) {
  await Promise.all(projects.map(project => upsertPayload('projects', project.id, project)));
}

export async function getProjects() {
  return readPayloads<Project>('projects');
}

export async function saveTasks(tasks: Task[], projectId: string) {
  await Promise.all(tasks.map(task => upsertPayload('tasks', task.id, { ...task, projectId }, projectId)));
}

export async function getTasks(projectId: string) {
  return readPayloads<Task>('tasks', projectId);
}

export async function saveDailyLogs(logs: Array<LogEntry | DailyLogEntry>, projectId: string) {
  await Promise.all(logs.map(log => {
    const id = 'id' in log && log.id ? log.id : `${projectId}-${log.date}`;
    return upsertPayload('daily_logs', id, { ...log, projectId }, projectId);
  }));
}

export async function getDailyLogs(projectId: string) {
  return readPayloads<LogEntry>('daily_logs', projectId);
}

export async function saveOpenItems(items: OpenItem[], projectId: string) {
  await Promise.all(items.map(item => upsertPayload('open_items', item.id, { ...item, projectId }, projectId)));
}

export async function getOpenItems(projectId: string) {
  return readPayloads<OpenItem>('open_items', projectId);
}

export async function saveDashboard(summary: unknown, projectId: string) {
  await initDB();
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO dashboards (projectId, payload, updatedAt) VALUES (?, ?, ?)',
    projectId,
    JSON.stringify(summary),
    now(),
  );
}

export async function getDashboard<T = unknown>(projectId: string) {
  await initDB();
  const db = await getDB();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM dashboards WHERE projectId = ?',
    projectId,
  );
  return row ? JSON.parse(row.payload) as T : null;
}

export async function queueRequest(path: string, method: string, body?: string | null) {
  await initDB();
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await db.runAsync(
    'INSERT INTO queued_requests (id, path, method, body, createdAt) VALUES (?, ?, ?, ?, ?)',
    id,
    path,
    method,
    body || null,
    now(),
  );
}

export async function getQueuedRequests() {
  await initDB();
  const db = await getDB();
  return db.getAllAsync<QueuedRequest>('SELECT * FROM queued_requests ORDER BY createdAt ASC');
}

export async function removeQueuedRequest(id: string) {
  await initDB();
  const db = await getDB();
  await db.runAsync('DELETE FROM queued_requests WHERE id = ?', id);
}

export async function clearAll() {
  await initDB();
  const db = await getDB();
  await db.execAsync(`
    DELETE FROM projects;
    DELETE FROM tasks;
    DELETE FROM daily_logs;
    DELETE FROM open_items;
    DELETE FROM dashboards;
    DELETE FROM queued_requests;
  `);
}

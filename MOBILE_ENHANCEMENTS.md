# Mobile App — Offline Support + Push Notifications + Biometric Auth

Read this file and follow all instructions exactly. Run `npx tsc --noEmit` before committing. Commit locally when all work is done.

## Context
Project Lookahead mobile app — React Native + Expo 54, TypeScript strict mode.
Path: ~/Desktop/ai/project-lookahead-mobile (this repo)
Backend API: https://project-lookahead.vercel.app

The app has these screens: Login, ProjectList, Today, Schedule, DailyLog, OpenItems, Documents, Settings.
Current API client: src/services/api.ts with apiFetch() using Bearer token + cookie.

## 1. Offline Support (SQLite with expo-sqlite)

### Install dependencies
```bash
npx expo install expo-sqlite
```

### Create a local database service
Create `src/services/offline-db.ts`:
- Use expo-sqlite to create a local SQLite database
- Tables: projects, tasks, daily_logs, open_items (mirror the API data structure)
- Functions:
  - `initDB()` — create tables if not exist
  - `saveProjects(projects)` — upsert projects into local DB
  - `getProjects()` — read all projects from local DB
  - `saveTasks(tasks, projectId)` — upsert tasks
  - `getTasks(projectId)` — read tasks for a project
  - `saveDailyLogs(logs, projectId)` — upsert daily logs
  - `getDailyLogs(projectId)` — read daily logs for a project
  - `saveOpenItems(items, projectId)` — upsert open items
  - `getOpenItems(projectId)` — read open items for a project
  - `clearAll()` — wipe local data (for logout)

### Modify API client for offline fallback
Modify `src/services/api.ts`:
- After successful API calls, save data to local DB
- On API failure (network error), fall back to local DB data
- Add an `isOffline` flag to the response so UI can show "offline mode"
- When back online, sync local changes to the server

### Modify screens for offline awareness
- ProjectListScreen: load from local DB first, then refresh from API
- Show a subtle "offline" indicator when data is from local cache
- TodayScreen, ScheduleScreen, DailyLogScreen: same pattern

## 2. Push Notifications (Expo Notifications)

### Install dependencies
```bash
npx expo install expo-notifications expo-device
```

### Create notification service
Create `src/services/notifications.ts`:
- `registerForPushNotificationsAsync()` — request permissions, get push token
- `sendTokenToServer(token)` — send the push token to the backend
- `setupNotificationListeners()` — handle received notifications
- Schedule local notifications for:
  - Task due date reminders (1 day before)
  - Daily log reminder (8 AM local time)
  - Open item follow-up (configurable)

### Add to App.tsx
- Call `registerForPushNotificationsAsync()` on app startup (after login)
- Set up notification listeners

### Add notification permissions to app.json
Add the `expo-notifications` plugin configuration.

## 3. Biometric Auth (Expo Local Authentication)

### Install dependencies
```bash
npx expo install expo-local-authentication
```

### Create biometric auth service
Create `src/services/biometric-auth.ts`:
- `isBiometricAvailable()` — check if device supports biometrics
- `authenticateWithBiometric()` — prompt for Face ID / fingerprint
- `enableBiometricAuth()` — store a flag in AsyncStorage
- `disableBiometricAuth()` — remove the flag
- `isBiometricEnabled()` — check if user enabled it

### Modify LoginScreen
- After successful login, if biometric is available and enabled, prompt for biometric
- On app launch, if biometric is enabled and token exists, prompt for biometric instead of showing login
- Add a toggle in SettingsScreen to enable/disable biometric auth

### Modify SettingsScreen
- Add "Biometric Login" toggle (only show if device supports it)
- Show "Face ID" or "Touch ID" label based on device capability

## Constraints
- Do NOT change any API endpoints or backend URLs
- Do NOT change the existing auth flow (Google OAuth → exchange → JWT)
- Offline support should be transparent — UI should work the same, just with cached data
- Push notifications should be opt-in (don't force permissions)
- Biometric auth should be opt-in (don't force it)
- Run `npx tsc --noEmit` after all changes — must pass
- Install all dependencies BEFORE starting code changes

## Verification
1. `npx tsc --noEmit` — must pass
2. List all files modified/created
3. Note any issues or incomplete items

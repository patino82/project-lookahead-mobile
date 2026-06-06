# Project Lookahead Mobile — Assessment Report
> By: Hermes (OWL) | Date: 2026-06-06

## Stack
- Expo 54.0.33, React Native 0.81.5
- TypeScript (strict mode)
- Navigation: @react-navigation (Stack + Bottom Tabs)
- Auth: Google OAuth via expo-auth-session → backend exchange endpoint
- API: fetch-based client with Bearer token + cookie session
- UI: Custom components (Card, CustomButton, CustomInput), Lucide icons, LinearGradient
- Analytics: Amplitude

## Architecture
```
LoginScreen → MainTabs (Today, Schedule, DailyLog, OpenItems, Documents, Settings)
                        ↓
                   ProjectList (stacked on tabs)
                        ↓
                   API → https://project-lookahead-webapp.vercel.app
```

## What's DONE ✅
1. **Auth flow** — Google OAuth via manual URL construction (no PKCE), exchanges auth code with backend `/api/auth/exchange`, stores JWT in AsyncStorage
2. **API client** — `apiFetch()` with Bearer token + cookie credentials
3. **All 8 screens exist** — Login, ProjectList, Today, Schedule, DailyLog, OpenItems, Documents, Settings
4. **Navigation** — Stack (login → tabs) + Bottom Tabs (6 tabs)
5. **UI components** — Card, CustomButton, CustomInput, TaskCard
6. **Design system** — COLORS constants, SPACING, RADIUS, SHADOWS
7. **Error handling** — try/catch in API calls, error states in screens
8. **Pull-to-refresh** — on ProjectList
9. **Loading states** — ActivityIndicator on screens
10. **Logout** — AsyncStorage multiRemove + navigation reset

## What NEEDS WORK ⚠️

### Critical
1. **No offline support** — All screens fail silently when API is unreachable. Need SQLite/WatermelonDB for offline cache.
2. **API_BASE is hardcoded** — `https://project-lookahead-webapp.vercel.app` in `src/config/env.ts`. If the Vercel URL changes, the app breaks. Should be configurable via Expo Constants or a remote config.
3. **No token refresh** — JWT expiry will silently kill the session. Need refresh token logic or re-auth flow.
4. **TypeScript not installed** — `npx tsc --noEmit` fails because `typescript` is not in `package.json` devDependencies. Can't type-check the mobile app.

### Important
5. **LoginScreen has hardcoded colors** — Lines 159-198 use `'#fff'`, `'rgba(...)'` inline instead of COLORS constants. Inconsistent with the design system.
6. **Navigation uses `any` types** — `navigation: all` props should use proper types from `@react-navigation`.
7. **No error boundaries** — If a screen crashes, the app white-screens with no recovery.
8. **Amplitude API key** — Loaded from `Constants.expoConfig?.extra?.amplitudeApiKey`. If not configured, analytics silently fail.
9. **ProjectListScreen** — Uses `FlatList` without `keyExtractor` optimization and no pagination for large project lists.
10. **No deep linking** — Can't open specific projects/tasks from notifications or web links.

### Nice to Have
11. **No haptic feedback** — Construction field use would benefit from tactile confirmation on actions.
12. **No biometric auth** — Face ID / fingerprint for quick re-auth after token expiry.
13. **No push notifications** — Task assignments, daily log reminders.
14. **Image upload** — DailyLog mentions photo attachment but DocumentsScreen may not have camera/gallery integration.
15. **Accessibility** — No `accessibilityLabel` props on interactive elements. Field use with gloves needs large tap targets (partially addressed with 44px min).

## Screen-by-Screen Notes

### LoginScreen (199 lines)
- Clean OAuth flow, manual URL construction to avoid PKCE issues
- Hardcoded colors in styles (should use COLORS constants)
- No loading state on the login button (user can tap multiple times)

### ProjectListScreen (275 lines)
- Uses FlatList with pull-to-refresh
- Maps API response to Project type
- Has error state with retry
- Missing: search/filter, pagination, skeleton loading

### TodayScreen
- Dashboard-style screen
- Needs: critical path visualization, today's tasks, weather integration

### ScheduleScreen
- Likely the most complex screen
- Needs: Gantt/timeline view, drag-and-drop rescheduling

### DailyLogScreen
- Form-heavy screen
- Needs: photo attachment, date picker, offline draft save

### OpenItemsScreen
- Blocker/risk tracking
- Check button was fixed in June 2 Codex run

### DocumentsScreen
- File/document management
- Needs: file picker, preview, offline cache

### SettingsScreen
- Logout works (multiRemove)
- Needs: theme toggle, notification preferences, about/version info

## Recommended Priority Order
1. Install TypeScript devDependency (unblocks type-checking)
2. Fix hardcoded colors in LoginScreen
3. Add token refresh / re-auth flow
4. Add offline support (SQLite cache layer)
5. Make API_BASE configurable
6. Add error boundaries
7. Add search/filter to ProjectList
8. Add push notifications
9. Add biometric auth
10. Full UI polish pass (haptics, accessibility, skeleton loaders)

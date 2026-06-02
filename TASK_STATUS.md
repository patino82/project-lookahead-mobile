# Mobile App — Task Status

> Last updated: 2026-06-02
> Read this file before doing ANY work in this directory.

## Current State
- Expo/React Native app
- Screens: Login, ProjectList, Today, Schedule, DailyLog, OpenItems, Documents, Settings
- Navigation: Stack + Tabs (React Navigation)
- Auth: Google OAuth → JWT stored in AsyncStorage
- API client: src/services/api.ts (basic, needs hardening)

## Last Completed Work
- 2026-05-20: Initial project setup with Expo
- 2026-05-26: Added OpenItemsScreen with real API calls (partial)
- 2026-05-31: Phase 2 UI/UX revamp of LoginScreen and ProjectListScreen
- 2026-06-02: Fixed Open Items completion/logout/API error surfacing, added API-backed Documents screen, and exposed Documents/Settings in dark themed tabs.

## Phase 2 Changes (2026-05-31)

### LoginScreen revamp
- Full-bleed dark background (COLORS.background)
- Logo: 100x100 with brand-colored border + shadow glow
- Brand name enlarged to 30px fontWeight 900, tagline "FIELD COMMAND" kept
- Full-width white "Continue with Google" button with "G" icon circle
- Terms of Service text below button
- Removed verbose "Welcome Back" / "Secure authentication required" text
- User-friendly error messages
- Types, API services, navigation structure unchanged

### ProjectListScreen revamp
- Large "Projects" header (32px, fontWeight 900) + "X ACTIVE PROJECTS" subtitle
- Search bar filtering projects by name (TextInput with Search icon)
- Redesigned project cards:
  - Project name (bold 16px)
  - Colored status pill (green=active, blue=completed, amber=on-hold)
  - Location with MapPin icon
  - Last updated date with Calendar icon
  - Task count from _count.tasks
  - Subtle progress bar at bottom
- Empty state: LayoutGrid icon (64px) + "No Projects Found" + web dashboard CTA
- Loading state: centered ActivityIndicator
- Error state: colored banner with Retry button
- Pull to refresh preserved

### Files Modified
- src/screens/LoginScreen.tsx
- src/screens/ProjectListScreen.tsx

### Commits
- 9de8ddc: LoginScreen Phase 2 revamp
- 11f4e5e: ProjectListScreen Phase 2 revamp

### tsc Result
- PASS — `npx tsc --noEmit` returns 0 errors

## In Progress
- (none)

## Next Steps (Priority Order)
1. ~~Phase 2 Login + ProjectList revamp~~ — COMPLETE
2. ~~Phase 2 remaining screens: TodayScreen, ScheduleScreen, DailyLogScreen, OpenItemsScreen, DocumentsScreen, SettingsScreen~~ — COMPLETE
3. Offline support (SQLite or WatermelonDB with sync queue)
4. E2E testing on physical device
5. ~~Fix apiFetch error handling (don't silently swallow errors)~~ — COMPLETE

## UI/UX Redesign Details
See: ../PROJECT_STATUS.md "Key Issues (All Codebases)"
Design reference: ../Stitch/ folder (elite dark mode, glassmorphism, construction orange/teal)

## Backend API Contract
Base URL: http://localhost:3000 (set in src/config/env.ts)

Endpoints:
- GET /api/projects — list all projects
- POST /api/projects — create project
- GET /api/projects/[id]/dashboard — project summary
- GET /api/projects/[id]/tasks — project tasks
- GET /api/projects/[id]/site-logs — daily logs
- POST /api/projects/[id]/site-logs — create log
- GET /api/projects/[id]/open-items — open items
- POST /api/projects/[id]/open-items — create item
- POST /api/projects/[id]/status — update task status
- POST /api/auth/exchange — Google OAuth token exchange

Auth: After login, JWT is in AsyncStorage under 'accessToken'.
Send as: Authorization: Bearer ***

## Known Bugs
- No known Phase 2 screen bugs after 2026-06-02 pass.

## How to Update This File
Add a line under "Last Completed Work" after each session:
- YYYY-MM-DD: [what was done]

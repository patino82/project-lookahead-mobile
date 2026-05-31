# Mobile App — Task Status

> Last updated: 2026-05-31
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

## In Progress
- PARTIAL FOUNDATION RECOVERY REQUIRED — an interrupted delegated revamp left a dirty working tree with substantial uncommitted changes.
- Current observed scope: 16 modified tracked files and 5 untracked paths, including all 8 screens, navigation, constants, API service, types, `TaskCard.tsx`, and `src/data/quickbooks.ts`.
- Do not discard or layer new edits onto this checkout until the diff is reviewed and `npx tsc --noEmit` is run.
- Use Hermes as the command surface. Hermes should create an isolated Codex worktree to review, validate, and reconcile the Phase 1 changes.

## Next Steps (Priority Order)
1. Review the interrupted Phase 1 dirty tree and classify each changed file as accept, revise, or reject.
2. Run `npx tsc --noEmit` and fix foundation compile errors in an isolated worktree.
3. Reconcile the reviewed Phase 1 foundation into a scoped branch and commit before starting Phase 2.
4. Fix apiFetch error handling (don't silently swallow errors)
5. Replace mock data in ProjectListScreen, ScheduleScreen with real API calls
6. Wire up OpenItemsScreen check button to mark items complete via API
7. Implement SettingsScreen logout (clear AsyncStorage + navigate)
8. Add calendar date picker to DailyLogScreen (@react-native-community/datetimepicker)
9. Add visible error banners to all screens (no more silent failures)
10. FULL UI/UX REDESIGN:
   - Remove redundant sections (TodayScreen duplicates, DailyLogScreen bloat)
   - All date inputs → calendar popup pickers
   - Modern field-ready UI: dark theme, high contrast, thumb-friendly 44px+ targets
   - Clean up tab bar labels and navigation icons
   - Consolidate ProjectListScreen — too much info per card, simplify hierarchy
   - ScheduleScreen: replace list with proper visual timeline/calendar
   - Reference design: ../Stitch/ folder
11. Offline support (SQLite or WatermelonDB with sync queue)
12. E2E testing on physical device

## UI/UX Redesign Details
See: ../PROJECT_STATUS.md "Key Issues (All Codebases)"
Design reference: ../Stitch/ folder (elite dark mode, glassmorphism, construction orange/teal)
Current problems:
- Outdated look, not intuitive on job site
- Redundant sections across screens
- No calendar pickers (text-only date input)
- Tab bar labels are generic/vague
- ProjectListScreen cards overloaded with info
- DailyLogScreen has too many fields visible at once
- ScheduleScreen shows a flat list instead of a timeline

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
Send as: Authorization: Bearer <token>

## Known Bugs
- Check button in OpenItemsScreen does nothing (no onPress handler)
- Settings logout is empty onPress
- ProjectListScreen silently falls back to mock data
- ScheduleScreen entirely mock data
- apiFetch silently catches errors with console.error only

## How to Update This File
Add a line under "Last Completed Work" after each session:
- YYYY-MM-DD: [what was done]

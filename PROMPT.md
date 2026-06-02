# Project Lookahead Mobile — Phase 2 Screen Revamp + Bug Fixes

## Context
This is an Expo/React Native app for construction superintendents. The design system is already defined in `src/constants/index.ts` (Apex Construct dark mode: cyber dark background `#0b0e12`, brand orange `#e07b35`, construction orange/teal palette, glassmorphism).

## Completed Work
- LoginScreen Phase 2 revamp (dark full-bleed, Google sign-in button) — DONE
- ProjectListScreen Phase 2 revamp (large header, search, redesigned cards) — DONE

## Your Tasks

### Task 1: Fix Known Bugs (start here, quick wins)
1. **OpenItemsScreen "Check" button** — The check/complete button in OpenItemsScreen does nothing. Wire it up to call `POST /api/projects/[id]/open-items/[itemId]` to mark the item as resolved/completed. After updating, refresh the list.
2. **SettingsScreen logout** — Verify the logout button actually works (clear AsyncStorage, navigate to Login). If broken, fix it.
3. **apiFetch error handling** — `apiFetch` in `src/services/api.ts` throws errors but callers sometimes don't surface them to the user. Ensure all screen components show user-facing error messages (not just console.error).

### Task 2: Phase 2 UI Revamp — Remaining Screens
Apply the same design language used in LoginScreen and ProjectListScreen to these screens. Use the COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS constants from `src/constants/index.ts`.

Design principles:
- Dark background (`COLORS.background`)
- Large eyebrow text (10px, weight 900, letter-spacing 2, `COLORS.primary`)
- Large title (28-32px, weight 900, `COLORS.ink`)
- Cards with `COLORS.surface` or glass effect, `RADIUS.md` (20px borders)
- Status pills with colored backgrounds
- Primary buttons use `COLORS.primary`
- Subtle borders `COLORS.border`
- No extra padding beyond SPACING constants

Screens to revamp:
1. **TodayScreen** — Dashboard with stat cards and task list. Make stat cards glass-morphism style, bold numbers, proper spacing.
2. **ScheduleScreen** — Lookahead grid. Already has real API calls. Clean up the UI to match the dark theme, proper cell styling, phase headers.
3. **DailyLogScreen** — Log entry form + photo capture. Already has real API calls. Restyle the form inputs, photo grid, and empty states.
4. **OpenItemsScreen** — CRUD for open items. Already has real API calls. Restyle the item cards, priority indicator, and add/edit modal.
5. **KanbanBoardScreen** — Kanban board with columns. Restyle column headers and task cards.
6. **GanttScreen** — Gantt chart view. Restyle the chart cells and task rows.
7. **DocumentsScreen** — Currently a "Coming Soon" stub. Add actual document listing via API (`GET /api/projects/[id]/documents`) or expand the placeholder with useful info.
8. **SettingsScreen** — Already partially styled (has logout, version display). Polish to fully match Phase 2 design.

### Task 3: Navigation Polish
- App.tsx and AppNavigation.tsx: Ensure the navigation chrome (tab bar, header) uses the dark theme consistently
- Add proper screen titles with the eyebrow + title pattern

## API Contract
Base URL: set in `src/config/env.ts` (currently `http://localhost:3000`)
Auth: Bearer token from AsyncStorage 'accessToken'

Key endpoints:
- GET /api/projects — list projects
- GET /api/projects/[id]/dashboard — project stats + tasks
- GET /api/projects/[id]/tasks — project tasks
- GET /api/projects/[id]/site-logs — daily logs
- POST /api/projects/[id]/site-logs — create log
- GET /api/projects/[id]/open-items — open items
- POST /api/projects/[id]/open-items — create item
- PATCH /api/projects/[id]/open-items/[itemId] — update item status
- POST /api/projects/[id]/status — update task status
- GET /api/projects/[id]/lookahead — lookahead grid data

## Constraints
1. **Follow existing code patterns** — use the same imports, hooks patterns, and structure as the already-revamped screens
2. **No new dependencies** — only use packages already in package.json
3. **TypeScript strict mode** — run `npx tsc --noEmit` periodically and fix any errors
4. **Never modify `.env` files** or add secrets
5. **Commit locally when done** — one commit per logical group of changes
6. **Read TASK_STATUS.md first** for context, update it when done
7. **Expo docs**: Read https://docs.expo.dev/versions/v54.0.0/ before writing any native code

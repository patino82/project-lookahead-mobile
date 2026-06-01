Phase 3 — Complete Mobile App Feature Build

CONTEXT:
- Expo/React Native project, SDK 54, TypeScript
- Design: cyber-dark theme (#0b0e12 bg, #e07b35 brand orange)
- API base: https://project-report-web.vercel.app
- Backend APIs all confirmed working (DB connected, Neon Postgres)

CURRENT STATE:
- DailyLogScreen: ALREADY DONE (photo capture, structured form, offline queue, expo-image-picker)
- ScheduleScreen: EXISTS but broken — uses wrong API endpoint `/api/tasks/schedule/${projectId}`, renders flat list instead of a lookahead grid
- OpenItemsScreen: EXISTS but broken — uses wrong API endpoint `/api/open-items/${projectId}`, no create/edit
- TodayScreen: EXISTS but broken — uses wrong API endpoint `/api/dashboard/${projectId}`

WHAT TO BUILD:

## 1. SCHEDULE SCREEN — Lookahead Grid (THE KILLER FEATURE)
This is the crown jewel. A superintendent needs to see their weekly/daily timeline and quickly update task status. Build it right.

API: GET /api/projects/${projectId}/lookahead
Returns: { legend: { "0":"Behind schedule","X":"Work performed","/":"Scheduled","!":"Inspection milestone","":"" }, weekDates: ["2026-06-01",...], entries: [{ id, projectId, taskId, date, symbol, notes }] }

Also need the tasks list: GET /api/projects/${projectId}/tasks
Returns tasks with: id, taskId, taskName, phase, trade, ownerCompany, durationDays

And status updates: PATCH /api/projects/${projectId}/status (or POST /api/projects/${projectId}/tasks/${taskId}/status)

UI Design — Lookahead Grid:
- Horizontal scrollable week view (like a Gantt-lite)
- Columns = days (use weekDates from API)
- Rows = tasks grouped by phase
- Each cell shows the symbol ("/", "X", "0", "!" or empty)
- Tap a cell to cycle through symbols (empty → "/" → "X" → "0" → "!" → empty)
- Long-press a cell to add/edit notes
- Week navigation: "< Week > " header with left/right arrows
- Color code: "/" = amber (scheduled), "#0b0e12"=white ( done), "0" = rose (behind), "!" = blue (inspection)
- Pull to refresh
- Collapse/expand phases
- Horizontal scroll for many days, vertical scroll for many tasks
- Use FlatList with nested ScrollView for performance
- Match dark theme (COLORS from constants)

IMPORTANT: This must be FAST on a real phone. A superintendent in the field needs to tap-tap-tap and move on. No modals for simple status taps — just cycle the symbol and auto-save.

## 2. OPEN ITEMS SCREEN — Full CRUD
Fix API endpoints and add create/edit/delete.

APIs:
- GET /api/projects/${projectId}/open-items
- POST /api/projects/${projectId}/open-items
- PATCH /api/projects/${projectId}/open-items/${itemId}
- DELETE /api/projects/${projectId}/open-items/${itemId}

Add:
- FAB (floating action button) to create new open item
- Create form modal: description, priority (High/Medium/Low picker), due date (date picker)
- Edit on tap
- Swipe-to-delete or delete button
- Status toggle (open ↔ closed)
- Due date display with overdue indicator
- Match dark theme

## 3. TODAY SCREEN — Wire Up + Polish
Fix API endpoint from /api/dashboard/${projectId} to /api/projects/${projectId}/dashboard

Wire up:
- Navigate to Schedule tab on "See All" tap — currently tries navigation.navigate('Schedule') but the tab is named differently in AppNavigation.tsx (check the tab names)
- Navigate to Logs tab
- Navigate to Open Issues tab
- Quick Books section: make the horizontal cards tappable — what should they navigate to? Make them filter the Schedule or show related tasks.
- Stats cards tappable → navigate to relevant filtered view

## 4. DOCUMENTS SCREEN — Stub/Basic
Just make it show a clean empty state with "Coming Soon" message and a file icon. Don't build actual file functionality.

## 5. SETTINGS SCREEN — Polish
Just verify it renders without errors. If it's just a placeholder, make it show:
- User email (from AsyncStorage or auth)
- App version
- Sign out button (clear AsyncStorage, navigate to Login)

READ THESE FIRST:
- src/screens/ScheduleScreen.tsx (current broken version)
- src/screens/OpenItemsScreen.tsx (current broken version)  
- src/screens/TodayScreen.tsx (current current broken version)
- src/screens/DocumentsScreen.tsx
- src/screens/SettingsScreen.tsx
- src/navigation/AppNavigation.tsx (tab names and structure)
- src/screens/ProjectListScreen.tsx (design reference for cards/empty states)
- src/services/api.ts (verify POST/PATCH body format)
- src/constants/index.ts (colors, spacing)
- src/components/TaskCard.tsx (reusable component)

RULES:
- Do NOT modify: LoginScreen.tsx, ProjectListScreen.tsx, AppNavigation.tsx, constants/index.ts, api.ts
- Do NOT modify DailyLogScreen.tsx further (it's done)
- Do NOT push to remote
- Commit ALL changes as single commit: feat(mobile): Phase 3 — lookahead grid, open items CRUD, screen polish
- Run npx tsc --noEmit after all changes, fix any errors

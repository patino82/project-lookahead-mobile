Phase 4 — Kanban Board + Gantt Chart

CONTEXT:
- Expo/React Native project at current working directory
- Branch: feat/phase3-daily-log-photo
- Design: cyber-dark theme (#0b0e12 bg, #e07b35 brand orange)
- API base hardcoded in src/config/env.ts as API_BASE
- Do NOT modify: LoginScreen.tsx, ProjectListScreen.tsx, AppNavigation.tsx, constants/index.ts, api.ts, config/env.ts
- Do NOT push to remote
- Commit locally when done: "feat(mobile): Phase 4 — kanban board + gantt chart"
- Run npx tsc --noEmit at end, fix any errors

DATA MODEL:
Tasks from GET /api/projects/${projectId}/tasks return:
{ id, projectId, taskId, taskName, phase, trade, ownerCompany, durationDays, requiresInspection, callNow, createdAt, updatedAt, notionId, predecessors }

Task statuses from GET /api/projects/${projectId}/status return array of:
{ taskId, status, confirmedComplete, inspectionRequired, inspectionPassed, lastUpdated }

Valid status values: "not_started", "in_progress", "completed", "blocked"

Update status via PATCH /api/projects/${projectId}/status with body:
{ taskId, status, confirmedComplete, inspectionRequired, inspectionPassed }

TASK 1: KANBAN BOARD SCREEN
File: src/screens/KanbanScreen.tsx (create new)

API calls on mount:
1. GET /api/projects/${projectId}/tasks → all tasks
2. GET /api/projects/${projectId}/status → all task statuses

UI:
- 4 columns: NOT STARTED | IN PROGRESS | COMPLETED | BLOCKED
- Each column shows count badge
- Horizontal scroll if needed on small screens
- Each task card shows: taskName, phase badge, trade, durationDays
- Color-coded left border by phase (pick from COLORS)
- Tap a task → action sheet or inline buttons to move to another column
- Optimistic update — move card instantly, PATCH status in background
- Status mapping: "not_started" → Not Started, "in_progress" → In Progress, "completed" → Completed, "blocked" → Blocked
- confirmedComplete flag from API — show checkmark icon when true
- requiresInspection flag — show inspection icon
- Pull to refresh
- Empty state per column: "No tasks"
- Dark theme matching existing screens (use COLORS from constants)
- Loading state with ActivityIndicator
- Error state with retry

Performance: Use FlatList per column or a single ScrollView with columns. For < 100 tasks, ScrollView is fine.

TASK 2: GANTT CHART SCREEN
File: src/screens/GanttScreen.tsx (create new)

API calls on mount:
1. GET /api/projects/${projectId}/tasks → all tasks
2. GET /api/projects/${projectId}/status → all task statuses

UI:
- Horizontal timeline bar chart
- Y-axis: task names grouped by phase (collapsible phases)
- X-axis: date range covering all tasks (or current week ± 2 weeks)
- Each task rendered as a horizontal bar spanning its duration
- Bar color by status: not_started = textSecondary, in_progress = primary(orange), completed = green/success, blocked = red/rose
- Show phase headers as collapsible rows
- Horizontal scroll for timeline (many days)
- Vertical scroll for tasks
- Tap a task bar → show task detail modal (name, phase, duration, status, change status)
- Left panel with task names, right panel with bars
- Similar to the lookahead grid but bar-style instead of cell-symbol style
- Use a fixed left column (~160px) for task names, scrollable right column for bars
- Pull to refresh
- Dark theme matching existing screens
- Loading/error states

TASK 3: ADD TABS TO NAVIGATION
Modify src/navigation/AppNavigation.tsT (READ IT FIRST → check current tab structure)

The current tabs are: Today, Schedule, Logs, Open Issues, Projects
Add: Kanban, Gantt AFTER Schedule

Read AppNavigation.tsx first, then add:
- Kanban tab with icon (use a new icon from lucide-react-native, try LayoutGrid or Columns)
- Gantt tab with icon (use BarChart3 or GanttChart from lucide-react-native)

IMPORT RULE for icons: use lucide-react-native. Read how other screens import icons to match the pattern.

TASK 4: UPDATE TODAY SCREEN
Read current src/screens/TodayScreen.tsx

Add two quick-link cards in the "Field Actions" section:
- "Kanban" → navigate to 'Kanban'
- "Gantt" → navigate to 'Gantt'

Already has Field Actions with Logs and Open Issues cards. Just add two more.

EXECUTION ORDER:
1. Read all source files first
2. Create KanbanScreen.tsx
3. Create GanttScreen.tsx
4. Update AppNavigation.tsx (add tabs)
5. Update TodayScreen.tsx (add navigation links)
6. Run npx tsc --noEmit
7. Fix any errors
8. Commit

# Project Lookahead Mobile — Full UI/UX Revamp

## What This Project Is
Project Lookahead is a construction project management mobile app (React Native + Expo). It has 8 screens: Login, ProjectList, Today, Schedule, DailyLog, OpenItems, Documents, Settings.

## Where Files Live
All source is under: /Users/dave_patino/Desktop/ai/Project Lookahead/project-lookahead-mobile/src/

Key directories:
- `src/screens/` — 8 screen files
- `src/components/` — shared components (Card, CustomButton, CustomInput)
- `src/constants/index.ts` — COLORS, SPACING, RADIUS, SHADOWS
- `src/navigation/AppNavigation.tsx` — stack + tab navigation
- `src/types/index.ts` — TypeScript interfaces
- `src/services/api.ts` — API client
- `src/config/` — env, amplitude analytics

## Current State Assessment
The app already has:
- Dark theme with construction orange (#e07b35) brand color — KEEP this direction
- A constants file with COLORS, SPACING, RADIUS, SHADOWS
- Gradient buttons via expo-linear-gradient
- Stack + Bottom Tab navigation (Projects, Today, Logs, Open Items, Schedule tabs)
- Google OAuth login via expo-auth-session
- API integration with a Next.js backend at project-lookahead-webapp.vercel.app
- Lucide icons
- Amplitude analytics

What's WRONG (needs fixing):
1. **ScheduleScreen** — uses MOCK_SCHEDULE hardcoded data, doesn't use the API at all
2. **SettingsScreen** — logout is a no-op, no navigation, no auth token cleanup
3. **DocumentsScreen** — placeholder "Coming Soon" screen, no functionality
4. **OpenItemsScreen** — check button is unwired (TouchableOpacity with View, no onPress handler)
5. **DailyLogScreen** — log card has hardcoded `backgroundColor: '#fff'` on line 233, breaking dark theme. Also uses console.error instead of user-visible error states.
6. **LoginScreen** — hardcoded `backgroundColor: '#111827'` instead of using COLORS constants
7. **No pull-to-refresh** on some screens that should have it (Schedule, Documents, Settings)
8. **No empty states with visual polish** on some screens
9. **Bottom tab labels** are ALL CAPS 9px — hard to read
10. **Navigation** — tab order is Projects, Today, Logs, Open Items, Schedule. This should be: Today, Schedule, Logs, Open Items, Projects (Today first since it's the main screen)
11. **app.json** — userInterfaceStyle is "light" but the app is dark mode. backgroundColor in splash is green (#2E7D32) which doesn't match the brand orange.
12. **COLORS.orange** is referenced in TodayScreen but not defined in constants

## What To Build — PHASE 1: FOUNDATION

### 1. Constants & Design System (src/constants/index.ts)
- Add missing color tokens:
  - `orange: '#ff9800'` (for inspection warning references)
  - `amber: '#f59e0b'` (used in OpenItemsScreen but not defined — only `warning` exists)
  - `rose: '#f43f5e'` (used in OpenItemsScreen for high priority items)
  - `muted: COLORS.textSecondary` alias used in DailyLogScreen line 83
  - `glass: 'rgba(255,255,255,0.06)'` for glassmorphic surfaces
- Verify all color references in screens map to defined constants
- Add typography scale: `FONT_SIZE: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28, xxxl: 32 }`

### 2. Navigation Restructuring (src/navigation/AppNavigation.tsx)
- Reorder tabs to: **Today** (index 0), **Schedule**, **Logs**, **Open Issues** (rename from "Open Items"), **Projects**
- Change tab icons to be more distinctive:
  - Today: `home` / `home-outline`
  - Schedule: `calendar` / `calendar-outline`  
  - Logs: `document-text` / `document-text-outline`
  - Open Issues: `alert-circle` / `alert-circle-outline`
  - Projects: `folder` / `folder-outline`
- Update tab label style: fontSize 11, fontWeight '700', normal case (not uppercase)
- Add header titles to each tab screen (headerShown: true) with clean titles

### 3. App Config (app.json)
- Change `userInterfaceStyle` from `"light"` to `"dark"`
- Change splash backgroundColor from `"#2E7D32"` to `"#0b0e12"` (matches COLORS.background)
- Change android adaptiveIcon backgroundColor to `"#0b0e12"`
- Change ios bundleIdentifier to `"com.projectlookahead.mobile"`

### 4. Fix Hardcoded Values Across All Screens
- Replace all hardcoded `'#fff'`, `'#111827'`, `'rgba(...)'` values with COLORS constants
- Fix DailyLogScreen line 233: `backgroundColor: '#fff'` → use dark surface color
- Fix LoginScreen line 145: `backgroundColor: '#111827'` → use COLORS.background

### 5. Wire Up Interactions
- **OpenItemsScreen check button**: Wire the TouchableOpacity (line 85-87) to call the API:
  - `POST /api/projects/{projectId}/open-items/{item.id}/complete`
  - On success, remove item from local state (optimistic update)
  - Show brief visual feedback (check circle fills with green)
- **SettingsScreen logout**: Actually log out:
  - Clear `accessToken` from AsyncStorage
  - Navigate back to Login screen via `navigation.reset({ index: 0, routes: [{ name: 'Login' }] })`

## Constraints
- Do NOT change any API endpoints or service layer
- Do NOT change the login/auth flow
- Do NOT change types/interfaces
- Keep expo-linear-gradient (already installed)
- Keep lucide-react-native (already installed)
- Keep react-spring if needed (check if installed first — if not, add it via npm install)
- Do NOT add new npm packages without listing what you're adding
- After ALL phases complete, run `npx tsc --noEmit` to verify no TypeScript errors

## Output Requirements
- List every file you modified
- List any new files created
- Run TypeScript check and report result
- If something can't be completed, explain why and what's left

Start with just the foundation work above. Don't touch ScheduleScreen data fetching yet — that's a later phase.

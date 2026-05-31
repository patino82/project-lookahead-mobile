# Project Lookahead Mobile — UI/UX Revamp Phase 2: Login + ProjectList Screens

## Context
Phase 1 should have already:
- Fixed constants (added orange, amber, rose, glass, FONT_SIZE, muted)
- Reordered tabs: Today, Schedule, Logs, Open Issues, Projects
- Fixed hardcoded colors
- Wired logout and check button
- Updated app.json

If Phase 1 didn't complete, check what was actually done and continue from there.

## Screen Revamp Standards (apply to ALL screens)
- No hardcoded colors — use COLORS constants always
- No hardcoded spacing — use SPACING constants
- Every interactive element min 44px tap target
- Use Card component for content containers
- Use CustomButton for actions
- Loading states: ActivityIndicator with COLORS.primary
- Empty states: icon + heading + subtext, centered, with icon color COLORS.border
- Error states: colored banner with retry button

## PHASE 2: LoginScreen + ProjectListScreen

### LoginScreen (src/screens/LoginScreen.tsx)
REVUKE the entire design. Current is already decent but needs modernization:
1. Full-bleed dark background using COLORS.background
2. Logo area: Keep the Ionicons flash icon but make it larger (100x100) with a subtle glow effect (use the existing shadow)
3. Brand name: "PROJECT LOOKAHEAD" — keep, maybe larger
4. Tagline: "FIELD COMMAND" — keep
5. The Google sign-in button: Make it a full-width white button with Google "G" icon (use Ionicons logo-google) + "Continue with Google" text — NOT "Sign in with Google"
6. Below the button: subtle text "By continuing, you agree to our Terms of Service"
7. Remove the "Welcome Back" and "Secure authentication required" text — too verbose for a construction app. The user just needs to tap and go.
8. Keep the alert for errors but make the error messages user-friendly

### ProjectListScreen (src/screens/ProjectListScreen.tsx)
This is the projects listing. Major revamp:
1. **Header**: Large "Projects" title (32px, fontWeight 900) + subtitle showing count "X ACTIVE PROJECTS"
2. **Search bar**: Add a search/filter input at the top (CustomInput component) that filters projects by name
3. **Project cards**: Redesign each card to show:
   - Project name (bold, 16px)
   - Status badge (colored pill: green=active, blue=completed, amber=on-hold)
   - Location with MapPin icon
   - Last updated date
   - Task count from `_count.tasks` if available
   - A subtle progress bar at the bottom (use completion % if available, otherwise show a placeholder)
4. **Pull to refresh**: Already there, keep it
5. **Empty state**: Big icon + "No Projects Found" + "Create your first project in the web dashboard"
6. **Loading state**: Centered spinner
7. **Error state**: Banner with retry
8. **Card press**: Keep navigation to MainTabs with projectId

## Constraints
- Do NOT change types, API services, or navigation structure
- Do NOT add new npm packages
- Run `npx tsc --noEmit` after changes and report result

## Output
- List every file modified
- Report tsc result
- Note any issues or incomplete work

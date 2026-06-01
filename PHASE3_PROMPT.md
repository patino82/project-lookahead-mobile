Phase 3: Daily Log + Photo Documentation feature for a construction superintendent mobile app (Expo/React Native, SDK 54).

CONTEXT:
- This is an existing Expo project. Branch: feat/phase3-daily-log-photo (already checked out)
- The project uses: TypeScript, React Native 0.81.5, Expo SDK 54, @react-navigation, lucide-react-native icons
- Design system: cyber-dark theme (background #0b0e12, brand orange #e07b35, see src/constants/index.ts)
- Backend API: https://project-lookahead-webapp.vercel.app (Vercel, Next.js)
- Site log API already exists: GET/POST /api/projects/[projectId]/site-logs

WHAT TO BUILD:

1. Install expo-image-picker:
   npx expo install expo-image-picker

2. Rewrite src/screens/DailyLogScreen.tsx:
   - Fix API endpoints: use /api/projects/${projectId}/site-logs (currently uses wrong /api/logs path)
   - Add structured form fields for a superintendent daily log:
     * Date (auto-today, editable)
     * Weather (text input)
     * Work Performed (multiline text)
     * Manpower (text input)
     * Equipment on site (text input)
     * Issues/Delays (multiline text, optional)
   - Photos section: use expo-image-picker for camera/gallery. Show thumbnail grid. Store as base64.
   - Submit: POST to /api/projects/${projectId}/site-logs with all fields as JSON including photos array
   - Offline queue: if API fails, save to AsyncStorage key 'pending_logs'. Show sync badge. Retry on next load.
   - Pull-to-refresh on log list
   - Dark theme matching existing screens (COLORS constants)

3. Update src/types/index.ts:
   - Update LogEntry interface to match SiteLog API: { id, projectId, date, content, author, notionId?, createdAt? }
   - Add DailyLogEntry interface for the form

4. Verify api.ts works for the site-logs POST

READ THESE FILES FIRST for context:
- REVAMP_SPEC.md, TASK_STATUS.md, REVAMP_PHASE2.md
- src/screens/DailyLogScreen.tsx (current implementation)
- src/services/api.ts, src/types/index.ts, src/constants/index.ts
- src/screens/ProjectListScreen.tsx (design reference)
- https://docs.expo.dev/versions/v54.0.0/sdk/image-picker/

RULES:
- Do NOT modify LoginScreen.tsx, ProjectListScreen.tsx, AppNavigation.tsx, constants/index.ts
- Do NOT push to remote
- Commit locally with message: feat(DailyLog): Phase 3 — structured log form + photo capture + offline queue
- Run: npx tsc --noEmit to check for TypeScript errors and fix any

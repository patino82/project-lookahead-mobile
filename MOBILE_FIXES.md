# Mobile App Fixes — Codex Task

Read this file and follow all instructions exactly. Run `npx tsc --noEmit` before committing (after installing TypeScript). Commit locally when all work is done.

## Context
Project Lookahead mobile app — React Native + Expo 54, TypeScript strict mode.
Path: ~/Desktop/ai/project-lookahead-mobile (this repo)

## Known Google OAuth Issue
The mobile app has GOOGLE_CLIENT_ID hardcoded in src/config/env.ts. The backend exchange route at /api/auth/exchange needs GOOGLE_CLIENT_SECRET to verify tokens. If the backend .env.local has these values set, OAuth should work. If not, the exchange returns 500.

**What to check and fix:**
1. Read the exchange route at /api/auth/exchange/route.ts
2. Check if GOOGLE_CLIENT_SECRET is used and if there are any issues with the token verification flow
3. The mobile app sends id_token (not code) to the exchange endpoint from LoginScreen.tsx
4. Make sure the exchange endpoint properly handles id_token verification

**Do NOT change GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET values.** Just ensure the code correctly uses whatever is in env.

## Mobile App Fixes (Do All)

### 1. Install TypeScript
```bash
npm install -D typescript @types/react @types/react-native
```

### 2. Fix Hardcoded Colors in LoginScreen
File: src/screens/LoginScreen.tsx
- Replace ALL hardcoded color values with COLORS constants:
  - `'#fff'` → `COLORS.text` or `COLORS.background` (check what's appropriate)
  - `'rgba(255, 255, 255, 0.4)'` → use a COLORS constant or add one
  - `'rgba(255, 255, 255, 0.5)'` → COLORS.textSecondary
  - `'rgba(255, 255, 255, 0.2)'` → COLORS.textMuted
  - `'#111827'` in AppNavigation.tsx → COLORS.background

### 3. Add Token Refresh Flow
When API returns 401, the app should:
- Try to re-authenticate silently (if refresh token available)
- If that fails, redirect to LoginScreen
- Add this logic to the apiFetch function in src/services/api.ts

### 4. Add Error Boundaries
Add a simple error boundary component that catches rendering errors and shows a "Something went wrong" screen with a retry button.

### 5. Add Search to ProjectListScreen
Add a search input at the top that filters projects by name.

### 6. Fix Navigation Type Safety
Change `navigation: any` to proper navigation types using `@react-navigation` types.

## Constraints
- Do NOT add new npm packages except TypeScript and its types
- Do NOT change API endpoints or URLs
- Do NOT change the authentication flow structure
- Keep UI changes minimal — focus on functional fixes

## Verification
1. After installing TypeScript: `npx tsc --noEmit` — must pass
2. List all files modified

## Output
- List every file modified
- Report tsc --noEmit result
- Note any issues found with the OAuth flow

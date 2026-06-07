# Contributing

## Local Setup

```bash
npm install
npm start
```

Use Node.js 20.19.x or newer for Expo SDK 54.

## Required Checks

Run these before committing:

```bash
npx tsc --noEmit
npx expo start --no-dev --minify
```

For auth changes, also run:

```bash
GOOGLE_ID_TOKEN="<token>" npm run smoke:auth
```

or verify the authorization-code path:

```bash
GOOGLE_AUTH_CODE="<code>" GOOGLE_REDIRECT_URI="http://localhost:8081/" npm run smoke:auth
```

## Implementation Rules

- Do not change backend API endpoint paths or production backend URLs without a coordinated backend update.
- Prefer existing components, constants, and services before adding abstractions.
- Do not add npm packages unless the app cannot meet the requirement with the current stack.
- Keep hardcoded colors in `src/constants`.
- Add loading, empty, error, and accessibility states for new user-facing screens.

## Git

Keep commits scoped. Include validation output in PR notes or handoff summaries.

# Project Lookahead Mobile

A construction field-operations mobile app built with Expo SDK 54, React Native, and TypeScript.

## Features

- **Authentication**: Secure login screen for users.
- **Project Management**: List of active construction projects with quick status views.
- **Today Dashboard**: Project-specific daily overview of tasks and milestones.
- **Scheduling**: View project schedules and task timelines.
- **Daily Logs**: Digital logbooks for tracking site activity and authors.
- **Open Items**: Track and prioritize unresolved project issues.
- **Documents**: Placeholder for integrated document management (Blueprints, RFIs).
- **Settings**: User preferences and application settings.

## Tech Stack

- **Framework**: Expo (Managed Workflow)
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Styling**: StyleSheet (React Native)

## Setup

### Prerequisites

- Node.js 20.19.x or newer for Expo SDK 54.
- Expo Go or a configured iOS/Android simulator.
- Access to the Project Lookahead web backend.

### Environment

The current mobile config reads backend values from [src/config/env.ts](./src/config/env.ts):

- `API_BASE`: production backend URL. Do not change endpoint paths in mobile code.
- `GOOGLE_CLIENT_ID`: Google OAuth web client ID used by the backend exchange route.
- Optional analytics key at build/start time: `AMPLITUDE_API_KEY`.

The OAuth redirect URI is generated in `LoginScreen.tsx` with Expo AuthSession. The backend `/api/auth/exchange` accepts either:

- `{ "id_token": "<google id token>" }`
- `{ "code": "<google authorization code>", "redirect_uri": "<exact mobile redirect uri>" }`

### Install

```bash
npm install
```

### Run Locally

```bash
npm start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

For a production-like Metro start:

```bash
npx expo start --no-dev --minify
```

### Validate

```bash
npx tsc --noEmit
npm run smoke:auth
```

`npm run smoke:auth` requires a real Google credential:

```bash
GOOGLE_ID_TOKEN="<token>" npm run smoke:auth
```

or:

```bash
GOOGLE_AUTH_CODE="<code>" GOOGLE_REDIRECT_URI="http://localhost:8081/" npm run smoke:auth
```

### Deploy

Use EAS Build for native releases after the backend OAuth allowlist includes the app redirect URI:

```bash
npx expo prebuild
npx eas build --platform ios
npx eas build --platform android
```

Keep `app.json` scheme and bundle/package identifiers aligned with backend OAuth settings.

## Project Structure

- `src/components`: Reusable UI components (Card, Button, Input).
- `src/screens`: Main application screen views.
- `src/navigation`: Navigation configuration and routing.
- `src/types`: TypeScript interfaces for project data.
- `src/constants`: App-wide constants and theme colors.
- `src/services`: Data fetching and API logic.

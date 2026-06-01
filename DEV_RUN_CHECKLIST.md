Development run checklist for mobile auth

1) Start Expo
   - expo start

2) Backend NextAuth URL
   - Set NEXTAUTH_URL in your backend to your local dev URL, e.g. http://localhost:3000
   - Ensure backend is running and exposes /api/auth endpoints

3) Configure Google OAuth
   - In Google Cloud Console set OAuth redirect URI to the Expo redirect URI printed by expo-auth-session
   - For development with Expo dev client or Expo Go using proxy, add the redirect URI from AuthSession.makeRedirectUri({useProxy: true})
   - Do NOT commit client IDs or secrets to the repo. Provide client ID via app config or EXPO_VARIABLES.

4) Expo app config
   - Add googleClientId and apiBaseUrl to expo config extras, or set via Constants.manifest.extra

5) Testing flow
   - Open the app, tap "Continue with Google"
   - After Google sign-in, the app will POST id_token to /api/auth/exchange on the backend
   - Backend should verify and create a NextAuth session (cookie) or return an accessToken


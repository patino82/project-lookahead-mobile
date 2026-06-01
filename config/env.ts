/**
 * Runtime environment configuration.
 * Reads from Expo Constants for EAS config support.
 * For development, values come from expo-constants.
 */
import * as Constants from 'expo-constants';

export const AppConfig = {
  appName: 'Project Lookahead',
  appVersion: '1.0.0',
  platform: 'mobile',
  buildTarget: 'iOS/Android',
} as const;

/** Returns the API base URL. In dev this uses env override; in prod it reads from expo config. */
export function getApiBaseUrl(): string {
  // Expo config override: npx eas config:set-credentials or use eas.json environment vars
  const expoConfig = Constants.default as any;
  const envUrl = expoConfig?.expoConfig?.extra?.API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  // Default to dev placeholder — NOT a real URL
  return 'https://api.projectlookahead.dev/v1';
}

/** Returns true when running in development mode. */
export function isDev(): boolean {
  return (Constants as any).executionEnvironment !== 'production';
}

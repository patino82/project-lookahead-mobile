import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = {
  API_BASE: extra.API_BASE ?? process.env.API_BASE ?? 'https://project-report-web.vercel.app',
  GOOGLE_CLIENT_ID: extra.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '',
};

import * as amplitude from '@amplitude/analytics-react-native';
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.amplitudeApiKey as string | undefined;

if (apiKey) {
  amplitude.init(apiKey);
} else if (__DEV__) {
  console.warn('Amplitude API key not set. Set AMPLITUDE_API_KEY in .env to enable analytics.');
}

export { amplitude };

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_AUTH_KEY = 'biometricAuthEnabled';

export async function isBiometricAvailable() {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometric() {
  const available = await isBiometricAvailable();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Project Lookahead',
    cancelLabel: 'Use login',
    disableDeviceFallback: false,
  });

  return result.success;
}

export async function enableBiometricAuth() {
  await AsyncStorage.setItem(BIOMETRIC_AUTH_KEY, 'true');
}

export async function disableBiometricAuth() {
  await AsyncStorage.removeItem(BIOMETRIC_AUTH_KEY);
}

export async function isBiometricEnabled() {
  return (await AsyncStorage.getItem(BIOMETRIC_AUTH_KEY)) === 'true';
}

export async function getBiometricLabel() {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  return 'Biometric Login';
}

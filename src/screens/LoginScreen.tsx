import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomButton } from '../components/CustomButton';
import { COLORS, SPACING } from '../constants';

interface LoginScreenProps {
  navigation: any;
}

// Discovery document for Google
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const BACKEND_BASE = Constants.manifest?.extra?.apiBaseUrl || 'http://localhost:3000';

  // Do NOT commit client IDs. Provide via app config (expo extras) or env at runtime.
  const CLIENT_ID = Constants.manifest?.extra?.googleClientId || '<GOOGLE_CLIENT_ID_PLACEHOLDER>';

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: { nonce: 'nonce' },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params as any;
      if (id_token) {
        exchangeTokenWithBackend(id_token);
      } else {
        Alert.alert('Authentication error', 'No id_token returned from provider');
      }
    } else if (response?.type === 'error') {
      Alert.alert('Authentication error', 'Unable to authenticate with provider');
    }
  }, [response]);

  async function exchangeTokenWithBackend(idToken: string) {
    try {
      // Exchange the provider token with backend to establish a NextAuth session.
      // Backend is expected to verify the idToken and set a session cookie or return an access token.
      const res = await fetch(`${BACKEND_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
        // include credentials so cookies set by the backend are stored
        credentials: 'include',
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('Backend exchange failed:', res.status, text);
        Alert.alert('Login failed', 'Unable to establish session with backend');
        return;
      }

      // Backend may return a JSON with an accessToken, or rely on cookies. Save token if provided.
      try {
        const data = await res.json();
        if (data?.accessToken) {
          await AsyncStorage.setItem('accessToken', data.accessToken);
        }
      } catch (_) {
        // ignore JSON parse errors; cookie-based session is fine
      }

      // Navigate into the app
      navigation.replace('MainTabs');
    } catch (err) {
      console.error('exchangeTokenWithBackend error', err);
      Alert.alert('Login failed', 'Network error while contacting backend');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Project Lookahead</Text>
        <Text style={styles.subtitle}>Sign in with Google to continue</Text>

        <View style={styles.form}>
          {!request ? (
            <ActivityIndicator />
          ) : (
            <CustomButton
              title="Continue with Google"
              onPress={() => promptAsync({ useProxy: true })}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  innerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  form: {
    width: '100%',
  },
});

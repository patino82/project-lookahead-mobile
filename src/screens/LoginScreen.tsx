import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zap } from 'lucide-react-native';
import { CustomButton } from '../components/CustomButton';
import { COLORS, SPACING, RADIUS } from '../constants';
import { amplitude } from '../config/amplitude';
import { ENV } from '../config/env';

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  navigation: any;
}

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const BACKEND_BASE = ENV.API_BASE;
  const CLIENT_ID = ENV.GOOGLE_CLIENT_ID;
  const [exchanging, setExchanging] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    path: '/',
    preferLocalhost: true,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      usePKCE: false,
    },
    discovery
  );

  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      if (code) {
        handleCodeExchange(code);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Login Error', response.error?.message || 'Failed to authenticate');
    }
  }, [response]);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        navigation.replace('MainTabs');
      }
    } catch {
      // stay on login
    }
  };

  const handleLogin = async () => {
    try {
      await promptAsync();
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Failed to start authentication.');
    }
  };

  const handleCodeExchange = async (code: string) => {
    setExchanging(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await res.json();
      if (data.ok && data.token) {
        await AsyncStorage.setItem('accessToken', data.token);
        amplitude.track('User Logged In', { source: 'google_oauth', is_new_user: false });
        navigation.replace('MainTabs');
      } else {
        throw new Error(data.error || 'Exchange failed');
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', `Server Response: ${err.message || 'Unknown'}`);
    } finally {
      setExchanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Zap size={48} color="#fff" />
          </View>
          <Text style={styles.brandName}>PROJECT LOOKAHEAD</Text>
          <Text style={styles.tagline}>FIELD COMMAND</Text>
        </View>

        <View style={styles.formContainer}>
          {exchanging ? (
            <View style={styles.exchangingWrap}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.exchangingText}>Establishing secure session...</Text>
            </View>
          ) : (
            <CustomButton
              title="Continue with Google"
              onPress={handleLogin}
              style={styles.loginButton}
            />
          )}

          <Text style={styles.footerNote}>Protected by Project Lookahead</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 4,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  exchangingWrap: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  exchangingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
  },
  footerNote: {
    marginTop: 40,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

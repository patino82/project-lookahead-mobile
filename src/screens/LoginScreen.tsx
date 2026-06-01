import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zap, Mail } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants';
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
      Alert.alert(
        'Login Failed',
        'We couldn\'t sign you in. Please try again.'
      );
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
    } catch {
      Alert.alert(
        'Login Failed',
        'We couldn\'t start the sign-in process. Please try again.'
      );
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
    } catch {
      Alert.alert(
        'Connection Error',
        'Unable to complete sign in. Please check your connection and try again.'
      );
    } finally {
      setExchanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoGlow}>
            <View style={styles.logo}>
              <Zap size={56} color={COLORS.brand} />
            </View>
          </View>
          <Text style={styles.brandName}>PROJECT LOOKAHEAD</Text>
          <Text style={styles.tagline}>FIELD COMMAND</Text>
        </View>

        {/* Sign-In Area */}
        <View style={styles.formContainer}>
          {exchanging ? (
            <View style={styles.exchangingWrap}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.exchangingText}>Signing in...</Text>
            </View>
          ) : (
            <View style={styles.googleButtonWrapper}>
              <View
                style={styles.googleButton}
                onTouchEnd={handleLogin}
              >
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            </View>
          )}

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service
          </Text>
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
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoGlow: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSolid,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  exchangingWrap: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
    minHeight: 44,
    justifyContent: 'center',
  },
  exchangingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  googleButtonWrapper: {
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4285F4',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  termsText: {
    marginTop: SPACING.xl,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});

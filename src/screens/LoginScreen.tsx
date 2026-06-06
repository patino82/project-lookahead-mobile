import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomButton } from '../components/CustomButton';
import { COLORS, SPACING } from '../constants';
import { amplitude } from '../config/amplitude';
import { ENV } from '../config/env';
import { Zap } from 'lucide-react-native';
import type { LoginScreenProps } from '../navigation/types';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const BACKEND_BASE = ENV.API_BASE;
  const CLIENT_ID = ENV.GOOGLE_CLIENT_ID;

  const redirectUri = AuthSession.makeRedirectUri({
    path: '/',
    preferLocalhost: true,
  });

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      navigation.replace('MainTabs');
    }
  };

  const handleLogin = async () => {
    // Manually construct the URL to ensure NO PKCE parameters are sent
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid profile email')}&` +
      `state=${state}&` +
      `prompt=select_account`;

    console.log('Opening Auth URL:', authUrl);

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        if (code) {
          console.log('Code captured, exchanging...');
          handleCodeExchange(code);
        }
      }
    } catch (err) {
      console.error('Auth error', err);
      Alert.alert('Login Error', 'Failed to start secure session.');
    }
  };

  const handleCodeExchange = async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          redirect_uri: redirectUri 
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
      console.error('Exchange error', err);
      Alert.alert('Authentication error', `Server Response: ${err.message || 'Unknown'}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Zap size={40} color={COLORS.textInverse} fill={COLORS.textInverse} />
          </View>
          <Text style={styles.brandName}>PROJECT LOOKAHEAD</Text>
          <Text style={styles.tagline}>KINETIC FIELD COMMAND</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome back, Agent</Text>
          <Text style={styles.instruction}>Secure authentication required for field operations.</Text>
          
          <CustomButton 
            title="Continue with Google"
            onPress={handleLogin}
            style={styles.loginButton}
          />
          
          <Text style={styles.footerNote}>Protected by Bespoke Services Intelligence</Text>
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
    width: 80,
    height: 80,
    borderRadius: 24,
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
    color: COLORS.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textFaint,
    letterSpacing: 4,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  loginButton: {
    width: '100%',
    backgroundColor: COLORS.text,
  },
  footerNote: {
    marginTop: 40,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});

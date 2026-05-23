import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, SafeAreaView, Platform, Image } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomButton } from '../components/CustomButton';
import { COLORS, SPACING, RADIUS } from '../constants';
import { amplitude } from '../config/amplitude';
import { ENV } from '../config/env';
import { Ionicons } from '@expo/vector-icons';

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

  const redirectUri = AuthSession.makeRedirectUri({
    path: '/',
    preferLocalhost: true,
  });

  console.log('Redirect URI:', redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: 'id_token',
      usePKCE: false,
    },
    discovery
  );

  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      console.log('Token received, exchanging...');
      handleTokenExchange(id_token);
    } else if (response?.type === 'error' || response?.type === 'cancel') {
      console.log('Login event:', response.type, response);
    }
  }, [response]);

  const checkExistingSession = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      navigation.replace('MainTabs');
    }
  };

  const handleTokenExchange = async (idToken: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
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
            <Ionicons name="flash" size={40} color="#fff" />
          </View>
          <Text style={styles.brandName}>PROJECT LOOKAHEAD</Text>
          <Text style={styles.tagline}>KINETIC FIELD COMMAND</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome back, Agent</Text>
          <Text style={styles.instruction}>Secure authentication required for field operations.</Text>
          
          <CustomButton 
            title="Continue with Google"
            onPress={() => promptAsync()}
            disabled={!request}
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
    backgroundColor: '#111827', // Deep Navy
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
    color: '#fff',
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
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#fff',
  },
  footerNote: {
    marginTop: 40,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});

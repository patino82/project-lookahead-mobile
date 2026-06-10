import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { LogOut, User, Bell, ShieldCheck, ChevronRight, Zap } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import {
  authenticateWithBiometric,
  disableBiometricAuth,
  enableBiometricAuth,
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
} from '../services/biometric-auth';
import { clearAll } from '../services/offline-db';
import {
  areNotificationsEnabled,
  registerForPushNotificationsAsync,
  setNotificationsEnabled,
} from '../services/notifications';

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  iconBg?: string;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, showArrow = true, iconBg, rightElement }) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    <View style={[styles.settingIcon, { backgroundColor: iconBg || COLORS.glass }]}>
      {icon}
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle} numberOfLines={1}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle} numberOfLines={2}>{subtitle}</Text>}
    </View>
    {rightElement || (showArrow && <ChevronRight size={18} color={COLORS.textSecondary} />)}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('Signed-in account');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometric Login');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const [storedUser, storedEmail] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userEmail'),
        ]);
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setEmail(parsedUser?.email || storedEmail || 'Signed-in account');
      } catch {
        setEmail('Signed-in account');
      }
    };
    loadEmail();
    const loadSecuritySettings = async () => {
      const [available, enabled, label, pushEnabled] = await Promise.all([
        isBiometricAvailable(),
        isBiometricEnabled(),
        getBiometricLabel(),
        areNotificationsEnabled(),
      ]);
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricLabel(label);
      setNotificationsEnabledState(pushEnabled);
    };
    loadSecuritySettings().catch(() => {});
  }, []);

  const toggleNotifications = async () => {
    const nextEnabled = !notificationsEnabled;
    await setNotificationsEnabled(nextEnabled);
    setNotificationsEnabledState(nextEnabled);
    if (nextEnabled) {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        await setNotificationsEnabled(false);
        setNotificationsEnabledState(false);
        Alert.alert('Notifications unavailable', 'Push notifications were not enabled on this device.');
      }
    }
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      await disableBiometricAuth();
      setBiometricEnabled(false);
      return;
    }

    const unlocked = await authenticateWithBiometric();
    if (!unlocked) return;
    await enableBiometricAuth();
    setBiometricEnabled(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('accessToken');
              await AsyncStorage.multiRemove(['user', 'userEmail', 'pending_logs']);
              await clearAll();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (err: any) {
              Alert.alert('Sign out failed', err?.message || 'Unable to clear your local session. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>CONFIG</Text>
          <Text style={styles.title} numberOfLines={2}>Settings</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <Zap size={32} color={COLORS.textInverse} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>Project Lookahead</Text>
              <Text style={styles.profileRole} numberOfLines={2}>{email}</Text>
            </View>
          </View>

          {/* General Section */}
          <Text style={styles.sectionLabel}>GENERAL</Text>

          <SettingItem
            icon={<User size={18} color={COLORS.ink} />}
            title="Account"
            subtitle={email}
            onPress={() => {}}
            iconBg={COLORS.brandSubtle}
          />
          <SettingItem
            icon={<Bell size={18} color={COLORS.ink} />}
            title="Notifications"
            subtitle={notificationsEnabled ? 'Push notifications enabled' : 'Push notifications off'}
            onPress={toggleNotifications}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.brandSubtle }}
                thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textSecondary}
                accessibilityLabel="Toggle notifications"
              />
            }
            iconBg={COLORS.warningSubtle}
          />
          {biometricAvailable && (
            <SettingItem
              icon={<ShieldCheck size={18} color={COLORS.ink} />}
              title={biometricLabel}
              subtitle={biometricEnabled ? 'Enabled for app unlock' : 'Use device biometrics to unlock'}
              onPress={toggleBiometric}
              showArrow={false}
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: COLORS.border, true: COLORS.brandSubtle }}
                  thumbColor={biometricEnabled ? COLORS.primary : COLORS.textSecondary}
                  accessibilityLabel={`Toggle ${biometricLabel}`}
                />
              }
              iconBg={COLORS.glass}
            />
          )}

          {/* About Section */}
          <Text style={styles.sectionLabel}>ABOUT</Text>

          <SettingItem
            icon={<Zap size={18} color={COLORS.ink} />}
            title="Version"
            subtitle={appVersion}
            onPress={() => {}}
            showArrow={false}
            iconBg={COLORS.brandSubtle}
          />

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Project Lookahead v{appVersion}{'\n'}Built for field operations.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: COLORS.ink,
    lineHeight: 32,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 17,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorSubtle,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    marginTop: SPACING.lg,
    minHeight: 48,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.error,
  },
  footerText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 18,
  },
});

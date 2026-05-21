import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { CustomButton } from '../components/CustomButton';

export const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Push Notifications</Text>
        <Switch 
          value={notifications} 
          onValueChange={setNotifications}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Biometric Login</Text>
        <Switch 
          value={false} 
          onValueChange={() => {}}
        />
      </View>

      <View style={styles.divider} />

      <CustomButton 
        title="Logout" 
        variant="outline" 
        onPress={() => {}} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
});

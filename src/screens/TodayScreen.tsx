import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';

interface TodayScreenProps {
  route: any;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Today's Dashboard</Text>
      {projectId ? (
        <View>
          <Card title="Active project tasks">
            <Text>- Coordination meeting @ 10am</Text>
            <Text>- Site inspection phase 2</Text>
            <Text>- Review RFI #102</Text>
          </Card>
          <Card title="Key Milestones">
            <Text>Foundation Pour (Due tomorrow)</Text>
          </Card>
          <Card title="Alerts">
            <Text style={{ color: COLORS.error }}>Critical: Crane Permit Expiring</Text>
          </Card>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Please select a project from the list to see today's overview.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

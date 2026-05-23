import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { apiFetch } from '../services/api';
import { DashboardSummary } from '../types';

interface TodayScreenProps {
  route: any;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!projectId) return;
    try {
      setError(null);
      const summary = await apiFetch(`/api/projects/${projectId}/dashboard`);
      if (summary) {
        setData(summary);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
      setError('Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      fetchDashboard();
    }
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!projectId) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.header}>Today's Dashboard</Text>
        <Text style={styles.emptyText}>Please select a project from the list to see today's overview.</Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <Text style={styles.header}>{data?.projectName || "Today's Dashboard"}</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {data && (
        <View>
          <Card title="Active project tasks">
            {data.callNowDetails.length > 0 ? (
              data.callNowDetails.map((task: any) => (
                <Text key={task.taskId}>• {task.taskName} ({task.ownerCompany})</Text>
              ))
            ) : (
              <Text>No immediate tasks requiring calls.</Text>
            )}
          </Card>

          <Card title="Project Health">
            <Text>Overall Completion: {data.effectiveComplete}%</Text>
            <Text>Open Inspections: {data.openInspectionCount}</Text>
            <Text>Critical Path: {data.criticalPathDays} days remaining</Text>
          </Card>

          <Card title="Assistant Actions">
            {data.assistantActions.length > 0 ? (
              data.assistantActions.map((action: string, i: number) => (
                <Text key={i} style={{ marginBottom: 4 }}>- {action}</Text>
              ))
            ) : (
              <Text>Project is up to date!</Text>
            )}
          </Card>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    margin: SPACING.md,
  },
});

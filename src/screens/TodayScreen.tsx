import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';
import { Card } from '../components/Card';
import { apiFetch } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

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
      setError('System connection interrupted.');
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
      <SafeAreaView style={styles.emptyState}>
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>OPERATIONAL OVERVIEW</Text>
          <Text style={styles.header}>KINETIC FIELD</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="construct-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>NO ACTIVE SELECTION</Text>
          <Text style={styles.emptySub}>Initialize a project from the Portfolios tab to enable field intelligence.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />
        }
      >
        <View style={styles.heroSection}>
          <View style={styles.headerContainer}>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>{data?.thisWeekStart?.toUpperCase() || 'LIVE STATUS'}</Text>
            </View>
            <Text style={styles.header}>{data?.projectName?.toUpperCase() || "DASHBOARD"}</Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data?.effectiveComplete || 0}%</Text>
              <Text style={styles.metricLabel}>COMPLETE</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: data?.openInspectionCount > 0 ? COLORS.error : COLORS.success }]}>
                {data?.openInspectionCount || 0}
              </Text>
              <Text style={styles.metricLabel}>INSPECTIONS</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data?.criticalPathDays || 0}</Text>
              <Text style={styles.metricLabel}>DAYS REM.</Text>
            </View>
          </View>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.content}>
          <Card title="IMMEDIATE FIELD ACTIONS" variant="solid">
            {data?.callNowDetails.length > 0 ? (
              data.callNowDetails.map((task: any) => (
                <TouchableOpacity key={task.taskId} style={styles.taskItem}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskName}>{task.taskName}</Text>
                    <Text style={styles.taskOwner}>{task.ownerCompany.toUpperCase()}</Text>
                  </View>
                  <Ionicons name="call" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.quietText}>Operational silence. All primary sequences current.</Text>
            )}
          </Card>

          <Card title="COMMAND INTELLIGENCE">
            {data?.assistantActions.length > 0 ? (
              data.assistantActions.map((action: string, i: number) => (
                <View key={i} style={styles.actionItem}>
                  <Ionicons name="flash" size={16} color={COLORS.warning} style={{ marginRight: 10, marginTop: 2 }} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.quietText}>No critical field intelligence reported.</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    backgroundColor: '#111827', // Deep Navy Hero
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#60a5fa',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.brand,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  header: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 10,
    marginTop: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    letterSpacing: 1,
  },
  content: {
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 50,
    marginTop: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  taskOwner: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
    fontWeight: '600',
  },
  quietText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    margin: SPACING.md,
    fontWeight: '800',
    fontSize: 12,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';
import { Card } from '../components/Card';
import { apiFetch } from '../services/api';
import { Zap, AlertCircle, Calendar, Info, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
      setError('System offline. Sync failed.');
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
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyHeader}>
           <Text style={styles.welcome}>FIELD COMMAND</Text>
           <Text style={styles.mainTitle}>Mission Dashboard</Text>
        </View>
        <View style={styles.centered}>
          <Zap size={64} color={COLORS.border} strokeWidth={1} />
          <Text style={styles.emptyText}>NO ACTIVE SEQUENCE</Text>
          <Text style={styles.emptySub}>Initialize a project mission from the Portfolios tab to view field intelligence.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <LinearGradient
          colors={COLORS.heroGradient}
          style={styles.heroSection}
        >
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{data?.thisWeekStart?.toUpperCase() || 'LIVE'}</Text>
          </View>
          <Text style={styles.heroTitle}>{data?.projectName?.toUpperCase() || "DASHBOARD"}</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data?.effectiveComplete || 0}%</Text>
              <Text style={styles.metricLabel}>SYNCED</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, data?.openInspectionCount > 0 && { color: COLORS.orange }]}>
                {data?.openInspectionCount || 0}
              </Text>
              <Text style={styles.metricLabel}>ALERTS</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data?.criticalPathDays || 0}</Text>
              <Text style={styles.metricLabel}>REMAINING</Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>High Priority Comms</Text>
            <AlertCircle size={16} color={COLORS.orange} />
          </View>

          {data?.callNowDetails.length > 0 ? (
            data.callNowDetails.map((task: any) => (
              <TouchableOpacity key={task.taskId} activeOpacity={0.7}>
                <Card variant="elevated" style={styles.actionCard}>
                  <View style={styles.actionCardInner}>
                    <View style={styles.actionIconBox}>
                      <Zap size={18} color={COLORS.orange} fill={COLORS.orange} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionName}>{task.taskName}</Text>
                      <Text style={styles.actionSub}>{task.ownerCompany}</Text>
                    </View>
                    <ChevronRight size={16} color={COLORS.border} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card variant="outline" style={styles.quietCard}>
              <Text style={styles.quietText}>Operational silence. All sequences current.</Text>
            </Card>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Intelligence Stream</Text>
            <Info size={16} color={COLORS.primary} />
          </View>

          <Card variant="elevated" style={styles.intelCard}>
            {data?.assistantActions.length > 0 ? (
              data.assistantActions.map((action: string, i: number) => (
                <View key={i} style={styles.intelItem}>
                  <View style={styles.intelBullet} />
                  <Text style={styles.intelText}>{action}</Text>
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
  emptyHeader: {
    padding: SPACING.lg,
    paddingTop: 20,
  },
  welcome: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 4,
  },
  heroSection: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: 24,
    ...SHADOWS.medium,
  },
  dateChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionCard: {
    padding: 12,
    marginBottom: 8,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  actionSub: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  intelCard: {
    padding: 20,
  },
  intelItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  intelBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: 12,
  },
  intelText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.ink,
    fontWeight: '500',
  },
  quietCard: {
    padding: 32,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  quietText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: 50,
    marginTop: 10,
    lineHeight: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    margin: SPACING.md,
    fontWeight: '700',
  },
});

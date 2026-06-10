import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';
import { Card } from '../components/Card';
import { apiFetch } from '../services/api';
import { getDashboard } from '../services/offline-db';
import { Zap, AlertCircle, Calendar, Info, ChevronRight, Activity } from 'lucide-react-native';
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
  const [isOffline, setIsOffline] = useState(false);

  const fetchDashboard = async () => {
    if (!projectId) return;
    try {
      setError(null);
      const summary = await apiFetch(`/api/projects/${projectId}/dashboard`);
      if (summary) {
        setData(summary);
        setIsOffline(Boolean(summary.isOffline));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
      setError('Operational sync failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      const load = async () => {
        const cached = await getDashboard(projectId);
        if (cached) {
          setData(cached);
          setIsOffline(true);
          setLoading(false);
        }
        await fetchDashboard();
      };
      load();
    }
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!projectId) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={COLORS.heroOverlay}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.emptyHeader}>
             <Text style={styles.welcome}>COMMAND STACK</Text>
             <Text style={styles.mainTitle} numberOfLines={2}>Field Dashboard</Text>
          </View>
          <View style={styles.centered}>
            <Zap size={64} color={COLORS.border} strokeWidth={1} />
            <Text style={styles.emptyText}>NO ACTIVE SEQUENCE</Text>
            <Text style={styles.emptySub}>Initialize a project mission from the Portfolios tab to view field intelligence.</Text>
          </View>
        </SafeAreaView>
      </View>
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
    <View style={styles.container}>
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
          <Text style={styles.heroTitle} numberOfLines={3}>{data?.projectName?.toUpperCase() || "DASHBOARD"}</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data?.effectiveComplete || 0}%</Text>
              <Text style={styles.metricLabel}>HEALTH</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, data?.openInspectionCount > 0 && { color: COLORS.orange }]}>
                {data?.openInspectionCount || 0}
              </Text>
              <Text style={styles.metricLabel}>RISKS</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{data?.criticalPathDays || 0}</Text>
              <Text style={styles.metricLabel}>DAYS</Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.content}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>OFFLINE MODE - CACHED DASHBOARD</Text>
            </View>
          )}
          {error && (
            <TouchableOpacity
              style={styles.errorBanner}
              onPress={fetchDashboard}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={styles.errorText}>{error} Tap to retry.</Text>
            </TouchableOpacity>
          )}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>High Priority Actions</Text>
            <Zap size={14} color={COLORS.primary} />
          </View>

          {data?.callNowDetails.length > 0 ? (
            data.callNowDetails.map((task: any) => (
              <TouchableOpacity
                key={task.taskId}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`High priority action ${task.taskName}`}
              >
                <Card variant="elevated" style={styles.actionCard}>
                  <View style={styles.actionCardInner}>
                    <View style={styles.actionIconBox}>
                      <Activity size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionName} numberOfLines={2}>{task.taskName.toUpperCase()}</Text>
                      <Text style={styles.actionSub} numberOfLines={1}>{task.ownerCompany}</Text>
                    </View>
                    <ChevronRight size={16} color={COLORS.border} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card variant="outline" style={styles.quietCard}>
              <Text style={styles.quietText}>Sequence optimal. No immediate actions.</Text>
            </Card>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Command Intelligence</Text>
            <Info size={14} color={COLORS.primary} />
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
              <Text style={styles.quietText}>No field intelligence reports.</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
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
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 4,
    lineHeight: 32,
  },
  heroSection: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...SHADOWS.deep,
  },
  dateChip: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  dateChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textInverse,
    lineHeight: 30,
    marginBottom: 28,
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
    color: COLORS.textInverse,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginTop: 6,
    letterSpacing: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.warningSubtle,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  offlineText: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
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
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    lineHeight: 17,
  },
  actionCard: {
    padding: 14,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 0.2,
    lineHeight: 19,
  },
  actionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 15,
  },
  intelCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  intelItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  intelBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 9,
    marginRight: 14,
  },
  intelText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.ink,
    fontWeight: '600',
  },
  quietCard: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  quietText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
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
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 50,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  errorBanner: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.errorSubtle,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
  },
});

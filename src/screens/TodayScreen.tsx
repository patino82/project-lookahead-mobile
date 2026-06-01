import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomButton } from '../components/CustomButton';
import { TaskCard } from '../components/TaskCard';
import { quickBooks } from '../data/quickbooks';
import { apiFetch } from '../services/api';
import { Task } from '../types';

import { AlertCircle, BarChart3, ClipboardList, Bell, CheckCircle, CheckCheck, FileText, LayoutGrid, Zap } from 'lucide-react-native';

interface TodayScreenProps {
  route: any;
  navigation: any;
}

interface DashboardData {
  stats: {
    active: number;
    completed: number;
    overdue: number;
    inspections: number;
  };
  tasks: Task[];
  schedule: any[];
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const result = await apiFetch(`/api/projects/${projectId || 'default'}/dashboard`);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const getStatIcon = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'flash-outline': return <Zap size={size} color={color} />;
      case 'checkmark-circle-outline': return <CheckCircle size={size} color={color} />;
      case 'alert-circle-outline': return <AlertCircle size={size} color={color} />;
      case 'clipboard-outline': return <ClipboardList size={size} color={color} />;
      default: return <Zap size={size} color={color} />;
    }
  };

  const statsConfig = data ? [
    { key: 'active', label: 'Active', value: data.stats.active, icon: 'flash-outline' as const, color: COLORS.primary },
    { key: 'completed', label: 'Done', value: data.stats.completed, icon: 'checkmark-circle-outline' as const, color: COLORS.success },
    { key: 'overdue', label: 'Overdue', value: data.stats.overdue, icon: 'alert-circle-outline' as const, color: COLORS.rose },
    { key: 'inspections', label: 'Inspections', value: data.stats.inspections, icon: 'clipboard-outline' as const, color: COLORS.amber },
  ] : [];

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskCard task={item} projectId={projectId} />
  );

  const openSchedule = (params?: Record<string, string>) => navigation.navigate('Schedule', params);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton title="Retry" onPress={fetchDashboard} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(224, 123, 53, 0.04)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>DASHBOARD</Text>
            <Text style={styles.title}>Today</Text>
            <Text style={styles.dateLabel}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => {}}>
            <Bell size={22} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={data?.tasks || []}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListHeaderComponent={
            <View>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                {statsConfig.map((stat) => (
                  <TouchableOpacity
                    key={stat.key}
                    style={styles.statCard}
                    activeOpacity={0.75}
                    onPress={() => stat.key === 'overdue'
                      ? navigation.navigate('Open Issues')
                      : openSchedule({ filter: stat.key })}
                  >
                    <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                      {getStatIcon(stat.icon, 18, stat.color)}
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Books */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Books</Text>
              </View>
              <FlatList
                horizontal
                data={quickBooks}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.quickBookCard} onPress={() => openSchedule({ phase: item.title })}>
                    <Text style={styles.quickBookTitle}>{item.title}</Text>
                    <Text style={styles.quickBookCount}>{item.taskCount} tasks</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickBooksList}
              />

              {/* Today's Tasks */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Tasks</Text>
                <TouchableOpacity onPress={() => openSchedule()}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListFooterComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Field Actions</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Logs')}>
                  <FileText size={18} color={COLORS.primary} />
                  <Text style={styles.actionTitle}>Daily Logs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Open Issues')}>
                  <AlertCircle size={18} color={COLORS.rose} />
                  <Text style={styles.actionTitle}>Open Issues</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Kanban')}>
                  <LayoutGrid size={18} color={COLORS.primary} />
                  <Text style={styles.actionTitle}>Kanban</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Gantt')}>
                  <BarChart3 size={18} color={COLORS.success} />
                  <Text style={styles.actionTitle}>Gantt</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCheck size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>All Caught Up!</Text>
              <Text style={styles.emptySub}>No tasks scheduled for today.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSolid,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quickBooksList: {
    paddingBottom: SPACING.lg,
  },
  quickBookCard: {
    width: 140,
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBookTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  quickBookCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: SPACING.md,
  },
  emptySub: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 52,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSolid,
  },
  actionTitle: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '800',
  },
});

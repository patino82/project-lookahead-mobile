import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../services/api';
import { Task } from '../types';

import { Calendar, MapPin, Clock, CheckCircle } from 'lucide-react-native';
interface ScheduleScreenProps {
  route: any;
}

interface ScheduleGroup {
  date: string;
  displayDate: string;
  tasks: Task[];
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};
  const [groups, setGroups] = useState<ScheduleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setError(null);
      const result = await apiFetch(`/api/tasks/schedule/${projectId || 'default'}`);
      if (result?.groups) {
        setGroups(result.groups);
      } else {
        setGroups([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return COLORS.rose;
      case 'medium': return COLORS.amber;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity style={styles.taskItem} activeOpacity={0.8}>
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.taskMeta}>
          {item.location && (
            <View style={styles.metaItem}>
              <MapPin size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          )}
          {item.estimatedTime && (
            <View style={styles.metaItem}>
              <Clock size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.estimatedTime}h</Text>
            </View>
          )}
        </View>
      </View>
      {item.completed && (
        <CheckCircle size={22} color={COLORS.success} />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: ScheduleGroup }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateText}>{section.displayDate}</Text>
      <Text style={styles.dateCount}>{section.tasks.length} tasks</Text>
    </View>
  );

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
        <TouchableOpacity style={styles.retryBtn} onPress={fetchSchedule}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>TIMELINE</Text>
            <Text style={styles.title}>Schedule</Text>
          </View>
        </View>

        <FlatList
          data={groups}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.section}>
              {renderSectionHeader({ section: item })}
              {item.tasks.map((task) => (
                <View key={task.id}>
                  {renderTaskItem({ item: task })}
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No Scheduled Tasks</Text>
              <Text style={styles.emptySub}>Tasks will appear here when scheduled.</Text>
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
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSolid,
  },
  retryBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
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
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  dateCount: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priorityIndicator: {
    width: 3,
    height: 44,
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
});

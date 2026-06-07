import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle, ClipboardCheck, LayoutGrid } from 'lucide-react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants';
import { apiFetch } from '../services/api';

type TaskStatusValue = 'not_started' | 'in_progress' | 'completed' | 'blocked';

interface ProjectTask {
  id: string;
  taskId: string;
  taskName: string;
  phase?: string | null;
  trade?: string | null;
  durationDays?: number | null;
  requiresInspection?: boolean;
}

interface TaskStatus {
  taskId: string;
  status: TaskStatusValue;
  confirmedComplete?: boolean;
  inspectionRequired?: boolean;
  inspectionPassed?: boolean;
}

// Map DB status values to app status values
const normalizeStatus = (raw: string): TaskStatusValue => {
  const s = (raw || '').toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'confirmed') return 'completed';
  if (s === 'in progress' || s === 'in_progress' || s === 'active') return 'in_progress';
  if (s === 'blocked' || s === 'on hold' || s === 'on_hold' || s === 'behind') return 'blocked';
  return 'not_started';
};

const COLUMNS: Array<{ value: TaskStatusValue; label: string; color: string }> = [
  { value: 'not_started', label: 'NOT STARTED', color: COLORS.textSecondary },
  { value: 'in_progress', label: 'IN PROGRESS', color: COLORS.primary },
  { value: 'completed', label: 'COMPLETED', color: COLORS.success },
  { value: 'blocked', label: 'BLOCKED', color: COLORS.rose },
];

const PHASE_COLORS = [COLORS.primary, COLORS.success, COLORS.amber, COLORS.rose, COLORS.info, COLORS.accentPurple];

const unwrap = (value: any, key: string) => value?.[key] || value || [];

export const KanbanScreen: React.FC<{ route: any }> = ({ route }) => {
  const { projectId = 'default' } = route.params || {};
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      setError(null);
      const prefix = `/api/projects/${projectId}`;
      const [taskResult, statusResult] = await Promise.all([
        apiFetch(`${prefix}/tasks`),
        apiFetch(`${prefix}/status`),
      ]);
      const nextTasks = unwrap(taskResult, 'tasks').map((task: any) => ({
        ...task,
        id: task.id || task.taskId,
        taskId: task.taskId || task.id,
        taskName: task.taskName || task.title || 'Untitled task',
      }));
      const nextStatuses = unwrap(statusResult, 'statuses').reduce((result: Record<string, TaskStatus>, status: TaskStatus) => {
        result[status.taskId] = { ...status, status: normalizeStatus(status.status) };
        return result;
      }, {});
      setTasks(nextTasks);
      setStatuses(nextStatuses);
    } catch (err: any) {
      setError(err.message || 'Failed to load the Kanban board.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const statusFor = useCallback((taskId: string): TaskStatus => (
    statuses[taskId] || { taskId, status: 'not_started' }
  ), [statuses]);

  const phaseColors = useMemo(() => {
    const phases = [...new Set(tasks.map(task => task.phase || 'Unassigned'))].sort();
    return phases.reduce<Record<string, string>>((result, phase, index) => {
      result[phase] = PHASE_COLORS[index % PHASE_COLORS.length];
      return result;
    }, {});
  }, [tasks]);

  const moveTask = async (task: ProjectTask, status: TaskStatusValue) => {
    const previous = statusFor(task.taskId);
    const updated: TaskStatus = {
      ...previous,
      taskId: task.taskId,
      status,
      confirmedComplete: status === 'completed',
      inspectionRequired: previous.inspectionRequired ?? task.requiresInspection ?? false,
      inspectionPassed: previous.inspectionPassed ?? false,
    };
    setStatuses(current => ({ ...current, [task.taskId]: updated }));
    setSelectedTaskId(null);
    try {
      await apiFetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });
    } catch (err: any) {
      setStatuses(current => ({ ...current, [task.taskId]: previous }));
      Alert.alert('Update failed', err?.message || 'The task status could not be saved.');
    }
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>WORKFLOW</Text>
            <Text style={styles.title}>Kanban Board</Text>
          </View>
          <LayoutGrid size={24} color={COLORS.primary} />
        </View>
        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={fetchBoard}
            accessibilityRole="button"
            accessibilityLabel="Retry loading Kanban board"
          >
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBoard(); }} tintColor={COLORS.primary} />}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
            {COLUMNS.map(column => {
              const columnTasks = tasks.filter(task => statusFor(task.taskId).status === column.value);
              return (
                <View key={column.value} style={styles.column}>
                  <View style={styles.columnHeader}>
                    <Text style={[styles.columnTitle, { color: column.color }]}>{column.label}</Text>
                    <View style={styles.countBadge}><Text style={styles.countText}>{columnTasks.length}</Text></View>
                  </View>
                  {columnTasks.length === 0 && <Text style={styles.emptyText}>No tasks</Text>}
                  {columnTasks.map(task => {
                    const taskStatus = statusFor(task.taskId);
                    const selected = selectedTaskId === task.taskId;
                    return (
                      <TouchableOpacity
                        key={task.taskId}
                        style={[styles.card, { borderLeftColor: phaseColors[task.phase || 'Unassigned'] }]}
                        activeOpacity={0.78}
                        onPress={() => setSelectedTaskId(selected ? null : task.taskId)}
                        accessibilityRole="button"
                        accessibilityLabel={`${selected ? 'Hide' : 'Show'} actions for ${task.taskName}`}
                      >
                        <View style={styles.cardTop}>
                          <Text style={styles.taskName}>{task.taskName}</Text>
                          <View style={styles.iconRow}>
                            {taskStatus.confirmedComplete && <CheckCircle size={16} color={COLORS.success} />}
                            {task.requiresInspection && <ClipboardCheck size={16} color={COLORS.amber} />}
                          </View>
                        </View>
                        <Text style={styles.phaseBadge}>{(task.phase || 'Unassigned').toUpperCase()}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaText}>{task.trade || 'FIELD TASK'}</Text>
                          <Text style={styles.metaText}>{task.durationDays || 0} DAYS</Text>
                        </View>
                        {selected && (
                          <View style={styles.actions}>
                            {COLUMNS.filter(option => option.value !== taskStatus.status).map(option => (
                              <TouchableOpacity
                                key={option.value}
                                style={styles.actionButton}
                                onPress={() => moveTask(task, option.value)}
                                accessibilityRole="button"
                                accessibilityLabel={`Move ${task.taskName} to ${option.label}`}
                              >
                                <Text style={[styles.actionText, { color: option.color }]}>{option.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { color: COLORS.ink, fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  errorBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.errorSubtle },
  errorText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
  board: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg, gap: SPACING.md },
  column: { width: 284, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.soft, borderWidth: 1, borderColor: COLORS.border },
  columnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.xs, marginBottom: SPACING.sm },
  columnTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  countBadge: { minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: COLORS.surfaceSolid },
  countText: { color: COLORS.ink, fontSize: 11, fontWeight: '900' },
  emptyText: { padding: SPACING.sm, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  card: { marginBottom: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderLeftWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.surfaceSolid },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  taskName: { flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  iconRow: { flexDirection: 'row', gap: 5 },
  phaseBadge: { alignSelf: 'flex-start', marginTop: SPACING.sm, color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  metaText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800' },
  actions: { gap: 6, marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionButton: { paddingVertical: 8 },
  actionText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
});

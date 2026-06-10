import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart3, ChevronDown, X } from 'lucide-react-native';
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
  predecessors?: string[] | null;
}

interface TaskStatus {
  taskId: string;
  status: TaskStatusValue;
  confirmedComplete?: boolean;
  inspectionRequired?: boolean;
  inspectionPassed?: boolean;
}

type ChartRow =
  | { kind: 'phase'; id: string; phase: string; count: number }
  | { kind: 'task'; id: string; task: ProjectTask };

const CELL_WIDTH = 34;
const LEFT_WIDTH = 164;
const ROW_HEIGHT = 52;
const PHASE_HEIGHT = 34;
const DAY_MS = 86_400_000;
const STATUSES: Array<{ value: TaskStatusValue; label: string }> = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

// Map DB status values to app status values
const normalizeStatus = (raw: string): TaskStatusValue => {
  const s = (raw || '').toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'confirmed') return 'completed';
  if (s === 'in progress' || s === 'in_progress' || s === 'active') return 'in_progress';
  if (s === 'blocked' || s === 'on hold' || s === 'on_hold' || s === 'behind') return 'blocked';
  return 'not_started';
};

const unwrap = (value: any, key: string) => value?.[key] || value || [];
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / DAY_MS);

export const GanttScreen: React.FC<{ route: any }> = ({ route }) => {
  const { projectId = 'default' } = route.params || {};
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async () => {
    try {
      setError(null);
      const prefix = `/api/projects/${projectId}`;
      const [taskResult, statusResult] = await Promise.all([
        apiFetch(`${prefix}/tasks`),
        apiFetch(`${prefix}/status`),
      ]);
      setTasks(unwrap(taskResult, 'tasks').map((task: any) => ({
        ...task,
        id: task.id || task.taskId,
        taskId: task.taskId || task.id,
        taskName: task.taskName || task.title || 'Untitled task',
      })));
      setStatuses(unwrap(statusResult, 'statuses').reduce((result: Record<string, TaskStatus>, status: TaskStatus) => {
        result[status.taskId] = { ...status, status: normalizeStatus(status.status) };
        return result;
      }, {}));
    } catch (err: any) {
      setError(err.message || 'Failed to load the Gantt chart.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  const statusFor = useCallback((taskId: string): TaskStatus => (
    statuses[taskId] || { taskId, status: 'not_started' }
  ), [statuses]);

  const startOffsets = useMemo(() => {
    const byId = tasks.reduce<Record<string, ProjectTask>>((result, task) => {
      result[task.taskId] = task;
      return result;
    }, {});
    const memo: Record<string, number> = {};
    const active = new Set<string>();
    const offsetFor = (task: ProjectTask): number => {
      if (memo[task.taskId] !== undefined) return memo[task.taskId];
      if (active.has(task.taskId)) return 0;
      active.add(task.taskId);
      const offset = (task.predecessors || []).reduce((latest, predecessorId) => {
        const predecessor = byId[predecessorId];
        if (!predecessor) return latest;
        return Math.max(latest, offsetFor(predecessor) + Math.max(1, predecessor.durationDays || 1));
      }, 0);
      active.delete(task.taskId);
      memo[task.taskId] = offset;
      return offset;
    };
    tasks.forEach(offsetFor);
    return memo;
  }, [tasks]);

  const timeline = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const monday = addDays(today, -((today.getDay() + 6) % 7));
    const start = addDays(monday, -14);
    const maxEndOffset = tasks.reduce((latest, task) => (
      Math.max(latest, (startOffsets[task.taskId] || 0) + Math.max(1, task.durationDays || 1))
    ), 0);
    const end = addDays(today, Math.max(20, maxEndOffset + 2));
    return Array.from({ length: daysBetween(start, end) + 1 }, (_, index) => addDays(start, index));
  }, [startOffsets, tasks]);

  const todayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return daysBetween(timeline[0], today);
  }, [timeline]);

  const rows = useMemo<ChartRow[]>(() => {
    const grouped = tasks.reduce<Record<string, ProjectTask[]>>((result, task) => {
      const phase = task.phase || 'Unassigned';
      if (!result[phase]) result[phase] = [];
      result[phase].push(task);
      return result;
    }, {});
    return Object.keys(grouped).sort().flatMap(phase => [
      { kind: 'phase' as const, id: `phase-${phase}`, phase, count: grouped[phase].length },
      ...(collapsedPhases[phase] ? [] : grouped[phase].map(task => ({ kind: 'task' as const, id: task.taskId, task }))),
    ]);
  }, [collapsedPhases, tasks]);

  const statusColor = (status: TaskStatusValue) => {
    if (status === 'in_progress') return COLORS.primary;
    if (status === 'completed') return COLORS.success;
    if (status === 'blocked') return COLORS.rose;
    return COLORS.textSecondary;
  };

  const updateStatus = async (task: ProjectTask, status: TaskStatusValue) => {
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
    try {
      await apiFetch(`/api/projects/${projectId}/status`, { method: 'PATCH', body: JSON.stringify(updated) });
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
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DEPENDENCIES</Text>
            <Text style={styles.title} numberOfLines={2}>Gantt Chart</Text>
          </View>
          <BarChart3 size={24} color={COLORS.primary} />
        </View>
        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={fetchChart}
            accessibilityRole="button"
            accessibilityLabel="Retry loading Gantt chart"
          >
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChart(); }} tintColor={COLORS.primary} />}>
          <View style={styles.chart}>
            <View style={styles.leftPanel}>
              <View style={styles.leftHeader}><Text style={styles.headerText}>TASK / PHASE</Text></View>
              {rows.length === 0 && <Text style={styles.empty}>No tasks</Text>}
              {rows.map(row => row.kind === 'phase' ? (
                <TouchableOpacity
                  key={row.id}
                  style={styles.leftPhaseRow}
                  onPress={() => setCollapsedPhases(current => ({ ...current, [row.phase]: !current[row.phase] }))}
                  accessibilityRole="button"
                  accessibilityLabel={`${collapsedPhases[row.phase] ? 'Expand' : 'Collapse'} phase ${row.phase}`}
                >
                  <ChevronDown size={15} color={COLORS.primary} style={collapsedPhases[row.phase] ? styles.collapsedChevron : undefined} />
                  <Text style={styles.phaseText}>{row.phase.toUpperCase()}</Text>
                  <Text style={styles.phaseCount}>{row.count}</Text>
                </TouchableOpacity>
              ) : (
                <View key={row.id} style={styles.taskLabel}>
                  <Text style={styles.taskName} numberOfLines={2}>{row.task.taskName}</Text>
                  <Text style={styles.taskMeta} numberOfLines={1}>{row.task.trade || 'FIELD TASK'}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.dateRow}>
                {timeline.map(date => (
                  <View key={date.toISOString()} style={styles.dateCell}>
                    <Text style={styles.dayName}>{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</Text>
                    <Text style={styles.dayNumber}>{date.getDate()}</Text>
                  </View>
                ))}
                </View>
                {rows.map(row => {
                if (row.kind === 'phase') {
                  return (
                    <View key={row.id} style={[styles.timelinePhaseRow, { width: timeline.length * CELL_WIDTH }]} />
                  );
                }
                const duration = Math.max(1, row.task.durationDays || 1);
                const left = (todayIndex + (startOffsets[row.task.taskId] || 0)) * CELL_WIDTH + 3;
                return (
                  <View key={row.id} style={[styles.timelineRow, { width: timeline.length * CELL_WIDTH }]}>
                      {timeline.map(date => <View key={date.toISOString()} style={styles.gridCell} />)}
                      <TouchableOpacity
                        style={[styles.bar, { left, width: duration * CELL_WIDTH - 6, backgroundColor: statusColor(statusFor(row.task.taskId).status) }]}
                        onPress={() => setSelectedTask(row.task)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit Gantt task ${row.task.taskName}`}
                      >
                        <Text style={styles.barText}>{duration}D</Text>
                      </TouchableOpacity>
                  </View>
                );
              })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Modal visible={Boolean(selectedTask)} transparent animationType="fade" onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTask(null)}
              accessibilityRole="button"
              accessibilityLabel="Close task status dialog"
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={3}>{selectedTask?.taskName}</Text>
            <Text style={styles.modalMeta}>{selectedTask?.phase || 'Unassigned'} · {selectedTask?.durationDays || 1} days</Text>
            <Text style={styles.modalLabel}>CHANGE STATUS</Text>
            <View style={styles.statusOptions}>
              {selectedTask && STATUSES.map(option => {
                const selected = statusFor(selectedTask.taskId).status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.statusButton, selected && { borderColor: statusColor(option.value), backgroundColor: `${statusColor(option.value)}18` }]}
                    onPress={() => updateStatus(selectedTask, option.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set task status ${option.label}`}
                  >
                    <Text style={[styles.statusText, selected && { color: statusColor(option.value) }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: SPACING.md },
  headerCopy: { flex: 1, paddingRight: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { color: COLORS.ink, fontSize: FONT_SIZE.xxl, fontWeight: '900', lineHeight: 32 },
  errorBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.errorSubtle },
  errorText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
  chart: { flexDirection: 'row' },
  leftPanel: { width: LEFT_WIDTH },
  dateRow: { height: 47, flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border },
  leftHeader: { height: 47, padding: SPACING.sm, justifyContent: 'center', backgroundColor: COLORS.soft, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border },
  headerText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dateCell: { width: CELL_WIDTH, paddingVertical: SPACING.xs, alignItems: 'center', backgroundColor: COLORS.soft, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  dayName: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '800' },
  dayNumber: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
  empty: { width: LEFT_WIDTH, padding: SPACING.md, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  leftPhaseRow: { height: PHASE_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.sm, backgroundColor: COLORS.phaseSurface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  timelinePhaseRow: { height: PHASE_HEIGHT, backgroundColor: COLORS.phaseSurface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  collapsedChevron: { transform: [{ rotate: '-90deg' }] },
  phaseText: { flex: 1, color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  phaseCount: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800' },
  taskLabel: { height: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: SPACING.sm, backgroundColor: COLORS.surfaceSolid, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  taskName: { color: COLORS.ink, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  taskMeta: { marginTop: 3, color: COLORS.textSecondary, fontSize: 9, fontWeight: '700' },
  timelineRow: { height: ROW_HEIGHT, flexDirection: 'row', position: 'relative', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  gridCell: { width: CELL_WIDTH, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  bar: { position: 'absolute', top: 12, height: 28, justifyContent: 'center', paddingHorizontal: 6, borderRadius: 7 },
  barText: { color: COLORS.background, fontSize: 9, fontWeight: '900' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: SPACING.lg, backgroundColor: COLORS.modalScrim },
  modalCard: { padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border },
  closeButton: { alignSelf: 'flex-end', padding: SPACING.xs },
  modalTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  modalMeta: { marginTop: 6, color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  modalLabel: { marginTop: SPACING.lg, marginBottom: SPACING.sm, color: COLORS.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusOptions: { gap: SPACING.sm },
  statusButton: { padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  statusText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '800' },
});

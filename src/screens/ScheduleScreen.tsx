import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants';
import { apiFetch } from '../services/api';
import { getTasks } from '../services/offline-db';

const CELL_WIDTH = 52;
const TASK_WIDTH = 180;
const SYMBOLS = ['', '/', 'X', '0', '!'];

interface ScheduleScreenProps {
  route: any;
}

interface LookaheadTask {
  id: string;
  taskId: string;
  taskName: string;
  phase?: string | null;
  trade?: string | null;
  ownerCompany?: string | null;
}

interface LookaheadEntry {
  id?: string;
  projectId?: string;
  taskId: string;
  date: string;
  symbol: string;
  notes?: string | null;
}

type GridRow =
  | { kind: 'phase'; id: string; phase: string; count: number }
  | { kind: 'task'; id: string; task: LookaheadTask };

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ route }) => {
  const { projectId, phase: requestedPhase, filter } = route.params || {};
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [tasks, setTasks] = useState<LookaheadTask[]>([]);
  const [entries, setEntries] = useState<LookaheadEntry[]>([]);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [noteCell, setNoteCell] = useState<{ taskId: string; date: string } | null>(null);
  const [noteText, setNoteText] = useState('');

  const weekStart = useMemo(() => {
    const date = new Date();
    const day = date.getDay();
    date.setDate(date.getDate() - ((day + 6) % 7) + weekOffset * 7);
    return date.toISOString().slice(0, 10);
  }, [weekOffset]);

  const defaultWeekDates = useCallback(() => {
    const start = new Date(`${weekStart}T12:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }, [weekStart]);

  const mapTasks = (sourceTasks: any[]) => sourceTasks.map((task: any) => ({
    id: task.id || task.taskId,
    taskId: task.taskId || task.id,
    taskName: task.taskName || task.title || 'Untitled task',
    phase: task.phase || 'Unassigned',
    trade: task.trade,
    ownerCompany: task.ownerCompany,
  }));

  const fetchSchedule = useCallback(async () => {
    try {
      setError(null);
      const prefix = `/api/projects/${projectId || 'default'}`;
      const [lookaheadResult, tasksResult] = await Promise.all([
        apiFetch(`${prefix}/lookahead?weekStart=${weekStart}`),
        apiFetch(`${prefix}/tasks`),
      ]);
      setWeekDates(lookaheadResult?.weekDates || []);
      setEntries(lookaheadResult?.entries || []);
      setTasks(mapTasks(tasksResult?.tasks || tasksResult || []));
      setIsOffline(Boolean(lookaheadResult?.isOffline || tasksResult?.isOffline));
    } catch (err: any) {
      setError(err.message || 'Failed to load the lookahead.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, weekStart]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cachedTasks = await getTasks(projectId || 'default');
      if (cachedTasks.length) {
        setTasks(mapTasks(cachedTasks));
        setWeekDates(defaultWeekDates());
        setEntries([]);
        setIsOffline(true);
        setLoading(false);
      }
      await fetchSchedule();
    };
    load();
  }, [fetchSchedule]);

  const entryFor = useCallback(
    (taskId: string, date: string) => entries.find(entry => entry.taskId === taskId && entry.date === date),
    [entries],
  );

  const saveLookaheadEntry = async (taskId: string, date: string, symbol: string, notes?: string | null) => {
    const prefix = `/api/projects/${projectId || 'default'}`;
    const body = JSON.stringify({ taskId, date, symbol, notes });
    try {
      await apiFetch(`${prefix}/lookahead`, { method: 'POST', body });
    } catch (firstError: any) {
      if (firstError?.status !== 404 && firstError?.status !== 405) throw firstError;
      // Fallback: try legacy endpoint
      await apiFetch(`${prefix}/tasks/${taskId}/status`, {
        method: 'POST',
        body: JSON.stringify({ date, symbol, notes }),
      });
    }
  };

  const updateLocalEntry = (taskId: string, date: string, patch: Partial<LookaheadEntry>) => {
    setEntries(current => {
      const exists = current.some(entry => entry.taskId === taskId && entry.date === date);
      if (!exists) return [...current, { taskId, date, symbol: '', ...patch }];
      return current.map(entry => entry.taskId === taskId && entry.date === date ? { ...entry, ...patch } : entry);
    });
  };

  const cycleSymbol = async (taskId: string, date: string) => {
    const previous = entryFor(taskId, date);
    const nextSymbol = SYMBOLS[(SYMBOLS.indexOf(previous?.symbol || '') + 1) % SYMBOLS.length];
    updateLocalEntry(taskId, date, { symbol: nextSymbol });
    try {
      await saveLookaheadEntry(taskId, date, nextSymbol, previous?.notes);
    } catch (err: any) {
      updateLocalEntry(taskId, date, { symbol: previous?.symbol || '' });
      Alert.alert('Update failed', err?.message || 'The status could not be saved. Try again when your connection is stable.');
    }
  };

  const openNotes = (taskId: string, date: string) => {
    setNoteCell({ taskId, date });
    setNoteText(entryFor(taskId, date)?.notes || '');
  };

  const saveNotes = async () => {
    if (!noteCell) return;
    const previous = entryFor(noteCell.taskId, noteCell.date);
    const notes = noteText.trim();
    updateLocalEntry(noteCell.taskId, noteCell.date, { notes });
    setNoteCell(null);
    try {
      await saveLookaheadEntry(noteCell.taskId, noteCell.date, previous?.symbol || '', notes);
    } catch (err: any) {
      updateLocalEntry(noteCell.taskId, noteCell.date, { notes: previous?.notes });
      Alert.alert('Update failed', err?.message || 'The note could not be saved.');
    }
  };

  const rows = useMemo<GridRow[]>(() => {
    const grouped = tasks.reduce<Record<string, LookaheadTask[]>>((result, task) => {
      const phase = task.phase || 'Unassigned';
      if (!result[phase]) result[phase] = [];
      result[phase].push(task);
      return result;
    }, {});
    const phases = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    const ordered = requestedPhase
      ? [...phases.filter(phase => phase.toLowerCase() === requestedPhase.toLowerCase()), ...phases.filter(phase => phase.toLowerCase() !== requestedPhase.toLowerCase())]
      : phases;
    return ordered.flatMap(phase => [
      { kind: 'phase' as const, id: `phase-${phase}`, phase, count: grouped[phase].length },
      ...(collapsedPhases[phase] ? [] : grouped[phase].map(task => ({ kind: 'task' as const, id: task.taskId, task }))),
    ]);
  }, [collapsedPhases, requestedPhase, tasks]);

  const symbolColor = (symbol: string) => {
    if (symbol === '/') return COLORS.amber;
    if (symbol === 'X') return COLORS.ink;
    if (symbol === '0') return COLORS.rose;
    if (symbol === '!') return COLORS.info;
    return COLORS.textSecondary;
  };

  const renderRow = ({ item }: { item: GridRow }) => {
    if (item.kind === 'phase') {
      return (
        <TouchableOpacity
          style={styles.phaseRow}
          onPress={() => setCollapsedPhases(current => ({ ...current, [item.phase]: !current[item.phase] }))}
          accessibilityRole="button"
          accessibilityLabel={`${collapsedPhases[item.phase] ? 'Expand' : 'Collapse'} phase ${item.phase}`}
        >
          <ChevronDown
            size={16}
            color={COLORS.primary}
            style={collapsedPhases[item.phase] ? styles.collapsedChevron : undefined}
          />
          <Text style={styles.phaseText}>{item.phase.toUpperCase()}</Text>
          <Text style={styles.phaseCount}>{item.count}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.taskRow}>
        <View style={styles.taskLabel}>
          <Text style={styles.taskName} numberOfLines={2}>{item.task.taskName}</Text>
          <Text style={styles.taskMeta} numberOfLines={1}>{item.task.trade || item.task.ownerCompany || 'FIELD TASK'}</Text>
        </View>
        {weekDates.map(date => {
          const entry = entryFor(item.task.taskId, date);
          return (
            <TouchableOpacity
              key={`${item.task.taskId}-${date}`}
              style={[styles.cell, entry?.notes ? styles.cellWithNote : undefined]}
              activeOpacity={0.65}
              onPress={() => cycleSymbol(item.task.taskId, date)}
              onLongPress={() => openNotes(item.task.taskId, date)}
              delayLongPress={350}
              accessibilityRole="button"
              accessibilityLabel={`Update ${item.task.taskName} for ${date}`}
              accessibilityHint="Tap to cycle the lookahead symbol. Long press to edit the note."
            >
              <Text style={[styles.symbol, { color: symbolColor(entry?.symbol || '') }]}>{entry?.symbol || ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>TIMELINE</Text>
            <Text style={styles.title} numberOfLines={2}>Lookahead</Text>
            {filter && <Text style={styles.filterText}>VIEW: {String(filter).toUpperCase()}</Text>}
          </View>
          <View style={styles.weekNav}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setWeekOffset(value => value - 1)}
              accessibilityRole="button"
              accessibilityLabel="Show previous week"
            >
              <ChevronLeft size={18} color={COLORS.ink} />
            </TouchableOpacity>
            <Text style={styles.weekLabel} numberOfLines={1}>WEEK</Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setWeekOffset(value => value + 1)}
              accessibilityRole="button"
              accessibilityLabel="Show next week"
            >
              <ChevronRight size={18} color={COLORS.ink} />
            </TouchableOpacity>
          </View>
        </View>
        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={fetchSchedule}
            accessibilityRole="button"
            accessibilityLabel="Retry loading lookahead schedule"
          >
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>OFFLINE MODE - CACHED TASKS</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.dateRow}>
              <View style={styles.taskHeader}><Text style={styles.taskHeaderText}>TASK / PHASE</Text></View>
              {weekDates.map(date => {
                const parsed = new Date(`${date}T12:00:00`);
                return (
                  <View key={date} style={styles.dateCell}>
                    <Text style={styles.dayName}>{parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
                    <Text style={styles.dayNumber}>{parsed.getDate()}</Text>
                  </View>
                );
              })}
            </View>
            <FlatList
              data={rows}
              renderItem={renderRow}
              keyExtractor={item => item.id}
              contentContainerStyle={rows.length === 0 ? styles.emptyList : styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedule(); }} tintColor={COLORS.primary} />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Calendar size={48} color={COLORS.border} />
                  <Text style={styles.emptyTitle}>No Lookahead Tasks</Text>
                  <Text style={styles.emptySub}>Tasks will appear here when added to the project.</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
        <View style={styles.legend}>
          {[
            ['/', 'SCHEDULED'],
            ['X', 'DONE'],
            ['0', 'BEHIND'],
            ['!', 'INSPECTION'],
          ].map(([symbol, label]) => <Text key={symbol} style={[styles.legendText, { color: symbolColor(symbol) }]}>{symbol} {label}</Text>)}
        </View>
      </SafeAreaView>
      <Modal visible={Boolean(noteCell)} transparent animationType="fade" onRequestClose={() => setNoteCell(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cell Note</Text>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              autoFocus
              placeholder="Add field note..."
              placeholderTextColor={COLORS.textSecondary}
              accessibilityLabel="Lookahead cell note"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setNoteCell(null)} accessibilityRole="button" accessibilityLabel="Cancel lookahead note"><Text style={styles.secondaryText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveNotes} accessibilityRole="button" accessibilityLabel="Save lookahead note"><Text style={styles.primaryText}>Save Note</Text></TouchableOpacity>
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
  filterText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  weekNav: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  navButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border },
  weekLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  errorBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.errorSubtle },
  errorText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
  offlineBadge: { alignSelf: 'flex-start', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.warningSubtle, borderWidth: 1, borderColor: COLORS.warningBorder },
  offlineText: { color: COLORS.warning, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  dateRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border },
  taskHeader: { width: TASK_WIDTH, padding: SPACING.sm, justifyContent: 'center', backgroundColor: COLORS.soft },
  taskHeaderText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dateCell: { width: CELL_WIDTH, paddingVertical: SPACING.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.soft, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  dayName: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '800' },
  dayNumber: { color: COLORS.ink, fontSize: 14, fontWeight: '900', marginTop: 2 },
  listContent: { paddingBottom: 40 },
  emptyList: { flexGrow: 1 },
  phaseRow: { width: TASK_WIDTH + CELL_WIDTH * 7, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.sm, height: 36, backgroundColor: COLORS.phaseSurface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  collapsedChevron: { transform: [{ rotate: '-90deg' }] },
  phaseText: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1, flex: 1 },
  phaseCount: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800' },
  taskRow: { flexDirection: 'row', minHeight: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  taskLabel: { width: TASK_WIDTH, justifyContent: 'center', paddingHorizontal: SPACING.sm, backgroundColor: COLORS.surfaceSolid },
  taskName: { color: COLORS.ink, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  taskMeta: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '700', marginTop: 3 },
  cell: { width: CELL_WIDTH, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: COLORS.background },
  cellWithNote: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  symbol: { fontSize: 21, fontWeight: '900' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.soft },
  legendText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  empty: { width: TASK_WIDTH + CELL_WIDTH * 7, alignItems: 'center', paddingTop: 72 },
  emptyTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginTop: SPACING.md },
  emptySub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, marginTop: SPACING.xs },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: SPACING.lg, backgroundColor: COLORS.modalScrim },
  modalCard: { padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginBottom: SPACING.md },
  noteInput: { minHeight: 120, padding: SPACING.md, borderRadius: RADIUS.sm, color: COLORS.ink, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, textAlignVertical: 'top', fontSize: FONT_SIZE.md, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md },
  secondaryButton: { paddingHorizontal: SPACING.md, paddingVertical: 12 },
  secondaryText: { color: COLORS.textSecondary, fontWeight: '800' },
  primaryButton: { paddingHorizontal: SPACING.md, paddingVertical: 12, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary },
  primaryText: { color: COLORS.background, fontWeight: '900' },
});

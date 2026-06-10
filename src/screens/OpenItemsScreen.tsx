import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AlertTriangle, Calendar, CheckCircle, Circle, Clock, Plus, Trash2 } from 'lucide-react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants';
import { apiFetch } from '../services/api';
import { getOpenItems, saveOpenItems } from '../services/offline-db';
import { scheduleOpenItemFollowUp } from '../services/notifications';
import { OpenItem } from '../types';

const PRIORITIES = ['High', 'Medium', 'Low'];

interface OpenItemsScreenProps {
  route: any;
}

export const OpenItemsScreen: React.FC<OpenItemsScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};
  const [items, setItems] = useState<OpenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<OpenItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const prefix = `/api/projects/${projectId || 'default'}/open-items`;

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const result = await apiFetch(prefix);
      setItems(result?.items || result || []);
      setIsOffline(Boolean(result?.isOffline));
    } catch (err: any) {
      setError(err.message || 'Failed to load open items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [prefix]);

  useEffect(() => {
    const load = async () => {
      const cachedItems = await getOpenItems(projectId || 'default');
      if (cachedItems.length) {
        setItems(cachedItems);
        setIsOffline(true);
        setLoading(false);
      }
      await fetchItems();
    };
    load();
  }, [fetchItems]);

  const openForm = (item?: OpenItem) => {
    setEditingItem(item || null);
    setDescription(item?.description || '');
    setPriority(item?.priority || 'Medium');
    setDueDate(item?.dueDate ? new Date(`${item.dueDate.slice(0, 10)}T12:00:00`) : new Date());
    setShowDatePicker(false);
    setModalVisible(true);
  };

  const closeForm = () => {
    if (!saving) setModalVisible(false);
  };

  const showError = (title: string, err: any, fallback: string) => {
    Alert.alert(title, err?.message || fallback);
  };

  const saveItem = async () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Add a description before saving.');
      return;
    }
    setSaving(true);
    const payload = {
      description: description.trim(),
      priority,
      dueDate: dueDate.toISOString().slice(0, 10),
    };
    try {
      if (editingItem) {
        const result = await apiFetch(`${prefix}/${editingItem.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        const updated = result?.item || { ...editingItem, ...payload };
        setItems(current => current.map(item => item.id === editingItem.id ? updated : item));
        await saveOpenItems([updated], projectId || 'default');
        await scheduleOpenItemFollowUp(updated.id, updated.description, updated.dueDate);
      } else {
        const result = await apiFetch(prefix, { method: 'POST', body: JSON.stringify(payload) });
        const created = result?.item || result;
        if (created?.id) {
          setItems(current => [created, ...current]);
          await saveOpenItems([created], projectId || 'default');
          await scheduleOpenItemFollowUp(created.id, created.description, created.dueDate);
        }
        else await fetchItems();
      }
      setModalVisible(false);
    } catch (err: any) {
      showError('Save failed', err, 'The open item could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: OpenItem) => {
    const status = item.status === 'open' ? 'closed' : 'open';
    setItems(current => current.map(currentItem => currentItem.id === item.id ? { ...currentItem, status } : currentItem));
    try {
      if (status === 'closed') {
        try {
          await apiFetch(`${prefix}/${item.id}`, { method: 'POST', body: JSON.stringify({ status: 'completed' }) });
        } catch (postError: any) {
          if (postError?.status !== 404 && postError?.status !== 405) throw postError;
          await apiFetch(`${prefix}/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        }
      } else {
        await apiFetch(`${prefix}/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      }
      await fetchItems();
    } catch (err: any) {
      setItems(current => current.map(currentItem => currentItem.id === item.id ? item : currentItem));
      showError('Update failed', err, 'The item status could not be saved.');
    }
  };

  const deleteItem = (item: OpenItem) => {
    Alert.alert('Delete open item?', item.description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`${prefix}/${item.id}`, { method: 'DELETE' });
            setItems(current => current.filter(currentItem => currentItem.id !== item.id));
          } catch (err: any) {
            showError('Delete failed', err, 'The open item could not be deleted.');
          }
        },
      },
    ]);
  };

  const priorityColor = (value: string) => {
    if (value.toLowerCase() === 'high') return COLORS.rose;
    if (value.toLowerCase() === 'medium') return COLORS.amber;
    return COLORS.success;
  };

  const dueStatus = (value: string | null, closed: boolean) => {
    if (!value) return null;
    const today = new Date().toISOString().slice(0, 10);
    const formatted = new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: `${value.slice(0, 10) < today && !closed ? 'OVERDUE · ' : ''}${formatted}`, overdue: value.slice(0, 10) < today && !closed };
  };

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(a.status === 'closed') - Number(b.status === 'closed')),
    [items],
  );

  const renderItem = ({ item }: { item: OpenItem }) => {
    const closed = item.status === 'closed';
    const due = dueStatus(item.dueDate, closed);
    return (
      <TouchableOpacity
        style={[styles.card, closed && styles.cardClosed]}
        onPress={() => openForm(item)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Edit open item ${item.description}`}
      >
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => toggleStatus(item)}
          accessibilityRole="button"
          accessibilityLabel={`${closed ? 'Reopen' : 'Close'} open item ${item.description}`}
        >
          {closed ? <CheckCircle size={21} color={COLORS.success} /> : <Circle size={21} color={COLORS.textSecondary} />}
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={[styles.description, closed && styles.descriptionClosed]} numberOfLines={3}>{item.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.priorityBadge}>
              <AlertTriangle size={12} color={priorityColor(item.priority)} />
              <Text style={[styles.metaText, { color: priorityColor(item.priority) }]}>{item.priority.toUpperCase()}</Text>
            </View>
            {due && (
              <View style={styles.dueBadge}>
                <Clock size={12} color={due.overdue ? COLORS.rose : COLORS.textSecondary} />
                <Text style={[styles.metaText, due.overdue && styles.overdue]}>{due.label}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item)}
          accessibilityRole="button"
          accessibilityLabel={`Delete open item ${item.description}`}
        >
          <Trash2 size={17} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>TRACKING</Text>
            <Text style={styles.title} numberOfLines={2}>Open Items</Text>
          </View>
          <Text style={styles.count} numberOfLines={1}>{items.filter(item => item.status === 'open').length} OPEN</Text>
        </View>
        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={fetchItems}
            accessibilityRole="button"
            accessibilityLabel="Retry loading open items"
          >
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>OFFLINE MODE - CACHED ITEMS</Text>
          </View>
        )}
        {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
        ) : (
          <FlatList
            data={sortedItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={sortedItems.length === 0 ? styles.emptyList : styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <AlertTriangle size={50} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No Open Items</Text>
                <Text style={styles.emptySub}>Add field issues, decisions, and punch items here.</Text>
              </View>
            }
          />
        )}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openForm()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add open item"
        >
          <Plus size={28} color={COLORS.background} />
        </TouchableOpacity>
      </SafeAreaView>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeForm}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Open Item' : 'New Open Item'}</Text>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              multiline
              autoFocus
              placeholder="What needs attention?"
              placeholderTextColor={COLORS.textSecondary}
              accessibilityLabel="Open item description"
            />
            <Text style={styles.label}>PRIORITY</Text>
            <View style={styles.priorityOptions}>
              {PRIORITIES.map(value => (
                <TouchableOpacity
                  key={value}
                  style={[styles.priorityOption, priority === value && { borderColor: priorityColor(value), backgroundColor: `${priorityColor(value)}18` }]}
                  onPress={() => setPriority(value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set priority ${value}`}
                >
                  <Text style={[styles.priorityOptionText, priority === value && { color: priorityColor(value) }]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>DUE DATE</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose open item due date"
            >
              <Calendar size={17} color={COLORS.primary} />
              <Text style={styles.dateText}>{dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                minimumDate={new Date(2000, 0, 1)}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (event.type !== 'dismissed' && date) setDueDate(date);
                }}
              />
            )}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeForm} accessibilityRole="button" accessibilityLabel="Cancel open item"><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveItem} disabled={saving} accessibilityRole="button" accessibilityLabel="Save open item">
                {saving ? <ActivityIndicator size="small" color={COLORS.background} /> : <Text style={styles.saveText}>Save Item</Text>}
              </TouchableOpacity>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: SPACING.md },
  headerCopy: { flex: 1, paddingRight: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { color: COLORS.ink, fontSize: FONT_SIZE.xxl, fontWeight: '900', lineHeight: 32 },
  count: { flexShrink: 0, color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: COLORS.brandSubtle },
  errorBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.errorSubtle },
  errorText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
  offlineBadge: { alignSelf: 'flex-start', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.warningSubtle, borderWidth: 1, borderColor: COLORS.warningBorder },
  offlineText: { color: COLORS.warning, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 104 },
  emptyList: { flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceSolid },
  cardClosed: { opacity: 0.62 },
  statusButton: { width: 34, minHeight: 44, justifyContent: 'center' },
  cardContent: { flex: 1 },
  description: { color: COLORS.ink, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  descriptionClosed: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  overdue: { color: COLORS.rose },
  deleteButton: { width: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  fab: { position: 'absolute', right: SPACING.lg, bottom: SPACING.lg, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, elevation: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginTop: SPACING.md },
  emptySub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center', marginTop: SPACING.xs },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.modalScrim },
  modalCard: { padding: SPACING.lg, paddingBottom: SPACING.xl, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceSolid },
  modalTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '900', marginBottom: SPACING.lg },
  label: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { minHeight: 96, padding: SPACING.md, borderRadius: RADIUS.sm, color: COLORS.ink, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, textAlignVertical: 'top' },
  priorityOptions: { flexDirection: 'row', gap: SPACING.sm },
  priorityOption: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  priorityOptionText: { color: COLORS.textSecondary, fontWeight: '800' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  dateText: { flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelButton: { paddingHorizontal: SPACING.md, paddingVertical: 13 },
  cancelText: { color: COLORS.textSecondary, fontWeight: '800' },
  saveButton: { minWidth: 112, alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 13, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary },
  saveText: { color: COLORS.background, fontWeight: '900' },
});

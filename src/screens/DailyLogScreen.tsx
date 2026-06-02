import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Clock,
  FileText,
  ImagePlus,
  PlusCircle,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants';
import { apiFetch } from '../services/api';
import { DailyLogEntry, LogEntry } from '../types';

const PENDING_LOGS_KEY = 'pending_logs';
const DEFAULT_AUTHOR = 'Superintendent';

interface DailyLogScreenProps {
  route: any;
}

const getToday = () => new Date().toISOString().slice(0, 10);

const createEmptyEntry = (projectId: string): DailyLogEntry => ({
  projectId,
  date: getToday(),
  weather: '',
  workPerformed: '',
  manpower: '',
  equipment: '',
  issuesDelays: '',
  photos: [],
  author: DEFAULT_AUTHOR,
});

const buildContent = (entry: DailyLogEntry) => [
  `Weather: ${entry.weather}`,
  `Work Performed: ${entry.workPerformed}`,
  `Manpower: ${entry.manpower}`,
  `Equipment on Site: ${entry.equipment}`,
  `Issues/Delays: ${entry.issuesDelays || 'None reported'}`,
  `Photos: ${entry.photos.length}`,
].join('\n');

const buildPayload = (entry: DailyLogEntry) => ({
  ...entry,
  content: buildContent(entry),
});

export const DailyLogScreen: React.FC<DailyLogScreenProps> = ({ route }) => {
  const { projectId = 'default' } = route.params || {};
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [entry, setEntry] = useState<DailyLogEntry>(() => createEmptyEntry(projectId));

  const updatePendingCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_LOGS_KEY);
      const pending: DailyLogEntry[] = stored ? JSON.parse(stored) : [];
      setPendingCount(pending.length);
    } catch (err: any) {
      setError(err?.message || 'Failed to inspect offline daily logs.');
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const result = await apiFetch(`/api/projects/${projectId}/site-logs`);
      setLogs(result?.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  const syncPendingLogs = useCallback(async () => {
    const stored = await AsyncStorage.getItem(PENDING_LOGS_KEY);
    const pending: DailyLogEntry[] = stored ? JSON.parse(stored) : [];
    if (!pending.length) {
      setPendingCount(0);
      return;
    }

    const remaining: DailyLogEntry[] = [];
    for (const pendingEntry of pending) {
      try {
        await apiFetch(`/api/projects/${pendingEntry.projectId}/site-logs`, {
          method: 'POST',
          body: JSON.stringify(buildPayload(pendingEntry)),
        });
      } catch (err: any) {
        setError(err?.message || 'Some offline daily logs could not sync yet.');
        remaining.push(pendingEntry);
      }
    }

    await AsyncStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(remaining));
    setPendingCount(remaining.length);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await syncPendingLogs();
      } catch (err: any) {
        setError(err?.message || 'Offline daily logs could not sync yet.');
        await updatePendingCount();
      }
      await fetchLogs();
    };

    load();
  }, [fetchLogs, syncPendingLogs, updatePendingCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncPendingLogs();
    } finally {
      await fetchLogs();
    }
  };

  const updateEntry = (field: keyof DailyLogEntry, value: string | string[]) => {
    setEntry(current => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEntry(createEmptyEntry(projectId));
    setShowAddModal(false);
  };

  const addPickedPhotos = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const newPhotos = result.assets
      .map(asset => asset.base64)
      .filter((photo): photo is string => Boolean(photo));
    if (!newPhotos.length) {
      Alert.alert('Photo unavailable', 'The selected photo could not be prepared. Please try again.');
      return;
    }
    setEntry(current => ({ ...current, photos: [...current.photos, ...newPhotos] }));
  };

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Allow camera access to capture site photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
    });
    addPickedPhotos(result);
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.5,
    });
    addPickedPhotos(result);
  };

  const removePhoto = (index: number) => {
    setEntry(current => ({
      ...current,
      photos: current.photos.filter((_, photoIndex) => photoIndex !== index),
    }));
  };

  const isValidEntry = Boolean(
    entry.date.trim()
    && entry.weather.trim()
    && entry.workPerformed.trim()
    && entry.manpower.trim()
    && entry.equipment.trim(),
  );

  const handleAddLog = async () => {
    if (!isValidEntry || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/projects/${projectId}/site-logs`, {
        method: 'POST',
        body: JSON.stringify(buildPayload(entry)),
      });
      resetForm();
      await fetchLogs();
    } catch (err: any) {
      try {
        const stored = await AsyncStorage.getItem(PENDING_LOGS_KEY);
        const pending: DailyLogEntry[] = stored ? JSON.parse(stored) : [];
        const updated = [...pending, entry];
        await AsyncStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(updated));
        setPendingCount(updated.length);
        resetForm();
        Alert.alert('Saved offline', `${err?.message || 'The server could not save this log.'} This daily log will sync automatically when a connection is available.`);
      } catch (storageErr: any) {
        Alert.alert('Save failed', storageErr?.message || err?.message || 'The daily log could not be saved.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logHeaderLeft}>
          <Clock size={14} color={COLORS.textSecondary} />
          <Text style={styles.logDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.logAuthor}>{item.author}</Text>
      </View>
      <Text style={styles.logContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>JOURNAL</Text>
            <Text style={styles.title}>Daily Logs</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <PlusCircle size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {pendingCount > 0 && (
          <View style={styles.syncBadge}>
            <RefreshCw size={14} color={COLORS.warning} />
            <Text style={styles.syncBadgeText}>{pendingCount} LOG{pendingCount === 1 ? '' : 'S'} TO SYNC</Text>
          </View>
        )}

        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={fetchLogs}>
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FileText size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No Logs Yet</Text>
                <Text style={styles.emptySub}>Start documenting your daily progress.</Text>
              </View>
            }
          />
        )}

        <Modal visible={showAddModal} animationType="slide" onRequestClose={resetForm}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.greeting}>FIELD REPORT</Text>
                <Text style={styles.modalTitle}>New Daily Log</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={resetForm}>
                <X size={22} color={COLORS.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <FormField label="Date" value={entry.date} onChangeText={value => updateEntry('date', value)} />
              <FormField label="Weather" value={entry.weather} onChangeText={value => updateEntry('weather', value)} placeholder="Clear, 72F" />
              <FormField label="Work Performed" value={entry.workPerformed} onChangeText={value => updateEntry('workPerformed', value)} multiline placeholder="Completed activities and locations" />
              <FormField label="Manpower" value={entry.manpower} onChangeText={value => updateEntry('manpower', value)} placeholder="Crew counts by trade" />
              <FormField label="Equipment on Site" value={entry.equipment} onChangeText={value => updateEntry('equipment', value)} placeholder="Active equipment and deliveries" />
              <FormField label="Issues / Delays" value={entry.issuesDelays} onChangeText={value => updateEntry('issuesDelays', value)} multiline optional placeholder="Optional" />

              <Text style={styles.fieldLabel}>Photos</Text>
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoAction} onPress={handleCamera}>
                  <Camera size={18} color={COLORS.primary} />
                  <Text style={styles.photoActionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoAction} onPress={handleGallery}>
                  <ImagePlus size={18} color={COLORS.primary} />
                  <Text style={styles.photoActionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.photoGrid}>
                {entry.photos.map((photo, index) => (
                  <View key={`${photo.slice(0, 12)}-${index}`} style={styles.photoTile}>
                    <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.photo} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                      <Trash2 size={14} color={COLORS.ink} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!isValidEntry || submitting) && styles.submitBtnDisabled]}
                onPress={handleAddLog}
                disabled={!isValidEntry || submitting}
              >
                {submitting ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.submitText}>Save Log</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  optional?: boolean;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, value, onChangeText, multiline, optional, placeholder }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}{optional ? ' (Optional)' : ''}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: SPACING.md },
  greeting: { fontSize: FONT_SIZE.xs, fontWeight: '900', color: COLORS.primary, letterSpacing: 2, marginBottom: SPACING.xs },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '900', color: COLORS.ink },
  addBtn: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, paddingHorizontal: SPACING.sm, minHeight: 28, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.warning },
  syncBadgeText: { color: COLORS.warning, fontSize: FONT_SIZE.xs, fontWeight: '800' },
  errorBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surfaceSolid, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  logCard: { backgroundColor: COLORS.surfaceSolid, borderRadius: RADIUS.sm, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  logHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logDate: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  logAuthor: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  logContent: { fontSize: FONT_SIZE.md, color: COLORS.ink, lineHeight: 22 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '900', color: COLORS.ink, marginTop: SPACING.md },
  emptySub: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '900', color: COLORS.ink },
  closeBtn: { width: 44, height: 44, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border },
  formContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  field: { marginBottom: SPACING.md },
  fieldLabel: { marginBottom: SPACING.sm, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '800' },
  input: { minHeight: 44, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border, color: COLORS.ink, fontSize: FONT_SIZE.md },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  photoActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  photoAction: { flex: 1, minHeight: 44, flexDirection: 'row', gap: SPACING.sm, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border },
  photoActionText: { color: COLORS.ink, fontSize: FONT_SIZE.md, fontWeight: '700' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoTile: { width: '31%', aspectRatio: 1, borderRadius: RADIUS.sm, overflow: 'hidden', backgroundColor: COLORS.surfaceSolid },
  photo: { width: '100%', height: '100%' },
  removePhotoBtn: { position: 'absolute', top: SPACING.xs, right: SPACING.xs, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.sm, backgroundColor: COLORS.background },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surfaceSolid },
  cancelBtn: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  cancelText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  submitBtn: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.sm, backgroundColor: COLORS.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.background, fontSize: FONT_SIZE.md, fontWeight: '900' },
});

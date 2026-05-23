import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { LogEntry } from '../types';
import { apiFetch } from '../services/api';

interface DailyLogScreenProps {
  route: any;
}

export const DailyLogScreen: React.FC<DailyLogScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    if (!projectId) return;
    try {
      const data = await apiFetch(`/api/projects/${projectId}/site-logs`);
      if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      fetchLogs();
    }
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleAddLog = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      // For now using 'Field App' as author until user profiles are synced
      const res = await apiFetch(`/api/projects/${projectId}/site-logs`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          author: 'Field User',
        }),
      });

      if (res && res.log) {
        setLogs([res.log, ...logs]);
        setContent('');
        Alert.alert('Success', 'Daily Log synced to Notion.');
      }
    } catch (err) {
      console.error('Failed to add log', err);
      Alert.alert('Error', 'Failed to save log.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: LogEntry }) => (
    <Card title={`${new Date(item.date).toLocaleDateString()} - ${item.author}`}>
      <Text style={styles.entryText}>{item.content}</Text>
    </Card>
  );

  if (!projectId) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.header}>Daily Logs</Text>
        <Text style={styles.emptyText}>Select a project to view or add logs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Logs</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What happened on site today?"
          placeholderTextColor={COLORS.textSecondary}
          multiline
          value={content}
          onChangeText={setContent}
        />
        <CustomButton 
          title={submitting ? "Syncing..." : "Submit Log"} 
          onPress={handleAddLog}
          disabled={submitting || !content.trim()}
        />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No logs yet for this project.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: SPACING.lg,
  },
  inputContainer: {
    padding: SPACING.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    minHeight: 80,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  entryText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
});

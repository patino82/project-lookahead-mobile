import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, RefreshControl, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';
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
      const res = await apiFetch(`/api/projects/${projectId}/site-logs`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          author: 'Field Agent',
        }),
      });

      if (res && res.log) {
        setLogs([res.log, ...logs]);
        setContent('');
        Alert.alert('Operational Success', 'Intelligence synced to Notion.');
      }
    } catch (err) {
      console.error('Failed to add log', err);
      Alert.alert('Transmission Error', 'Failed to reach central server.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: LogEntry }) => (
    <Card variant="solid">
      <View style={styles.logHeader}>
        <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.logAuthor}>{item.author}</Text>
      </View>
      <Text style={styles.entryText}>{item.content}</Text>
    </Card>
  );

  if (!projectId) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>Kinetic Capture</Text>
          <Text style={styles.header}>Site Intelligence</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Project Unselected</Text>
          <Text style={styles.emptySub}>A project selection is required to transmit site logs.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>Daily Record</Text>
          <Text style={styles.header}>Site Intelligence</Text>
        </View>
        
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Document site events..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
          />
          <CustomButton 
            title={submitting ? "Transmitting..." : "Sync to Notion"} 
            onPress={handleAddLog}
            disabled={submitting || !content.trim()}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
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
                <Text style={styles.emptyText}>History Clear</Text>
                <Text style={styles.emptySub}>No site events recorded for this period.</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  header: {
    fontSize: 32,
    fontWeight: '950',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  inputCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    minHeight: 100,
    backgroundColor: COLORS.soft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.ink,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  logDate: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  logAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  entryText: {
    fontSize: 15,
    color: COLORS.ink,
    lineHeight: 22,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, RefreshControl, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { LogEntry } from '../types';
import { apiFetch } from '../services/api';
import { FileText, Send, Clock, User } from 'lucide-react-native';

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
    <Card variant="outline" style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logMeta}>
          <Clock size={12} color={COLORS.primary} />
          <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.logMeta}>
          <User size={12} color={COLORS.muted} />
          <Text style={styles.logAuthor}>{item.author}</Text>
        </View>
      </View>
      <Text style={styles.entryText}>{item.content}</Text>
    </Card>
  );

  if (!projectId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={styles.welcome}>KINETIC CAPTURE</Text>
          <Text style={styles.mainTitle}>Site Intelligence</Text>
        </View>
        <View style={styles.centered}>
          <FileText size={64} color={COLORS.border} strokeWidth={1} />
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
        <View style={styles.headerArea}>
          <Text style={styles.welcome}>DAILY RECORD</Text>
          <Text style={styles.mainTitle}>Site Intelligence</Text>
        </View>
        
        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Document site events..."
              placeholderTextColor={COLORS.muted}
              multiline
              value={content}
              onChangeText={setContent}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!content.trim() || submitting) && styles.sendButtonDisabled]}
              onPress={handleAddLog}
              disabled={submitting || !content.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  headerArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: SPACING.md,
  },
  welcome: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 4,
  },
  inputArea: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 8,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: COLORS.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  logCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logDate: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  logAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
  },
  entryText: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 22,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});

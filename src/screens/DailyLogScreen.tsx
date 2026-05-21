import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { LogEntry } from '../types';

const MOCK_LOGS: LogEntry[] = [
  { id: '1', projectId: '1', date: '2026-05-19', content: 'Completed foundation slab pour for zone A.', author: 'John Doe' },
  { id: '2', projectId: '1', date: '2026-05-18', content: 'Inspected rebar in zone B. Passed.', author: 'Jane Smith' },
  { id: '3', projectId: '2', date: '2026-05-17', content: 'Received shipment of structural steel beams.', author: 'John Doe' },
];

export const DailyLogScreen: React.FC = () => {
  const renderItem = ({ item }: { item: LogEntry }) => (
    <Card title={`${item.date} - ${item.author}`}>
      <Text style={styles.entryText}>{item.content}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Logs</Text>
      <FlatList
        data={MOCK_LOGS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    paddingBottom: SPACING.lg,
  },
  entryText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

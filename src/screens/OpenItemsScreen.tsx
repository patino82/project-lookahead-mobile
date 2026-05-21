import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { OpenItem } from '../types';

const MOCK_ITEMS: OpenItem[] = [
  { id: '1', projectId: '1', description: 'Clarify plumbing vent location in room 202', priority: 'high', dueDate: '2026-05-22', status: 'open' },
  { id: '2', projectId: '1', description: 'Update HVAC wiring diagram for server room', priority: 'medium', dueDate: '2026-05-25', status: 'open' },
  { id: '3', projectId: '2', description: 'Confirm window frame sizes for east wing', priority: 'low', dueDate: '2026-05-28', status: 'open' },
];

export const OpenItemsScreen: React.FC = () => {
  const renderItem = ({ item }: { item: OpenItem }) => (
    <Card title={item.description}>
      <Text>Priority: <Text style={{ fontWeight: 'bold', color: item.priority === 'high' ? COLORS.error : COLORS.text }}>{item.priority}</Text></Text>
      <Text>Due Date: {item.dueDate}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Open Items</Text>
      <FlatList
        data={MOCK_ITEMS}
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
});

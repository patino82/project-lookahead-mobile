import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { ScheduleItem } from '../types';

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: '1', projectId: '1', task: 'concrete pour', startTime: '08:00', endTime: '12:00', date: '2026-05-20' },
  { id: '2', projectId: '1', task: 'electrical rough-in', startTime: '13:00', endTime: '17:00', date: '2026-05-20' },
  { id: '3', projectId: '2', task: 'steel erection', startTime: '07:00', endTime: '15:00', date: '2026-05-21' },
];

export const ScheduleScreen: React.FC = () => {
  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <Card title={item.task}>
      <Text>Time: {item.startTime} - {item.endTime}</Text>
      <Text>Date: {item.date}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Project Schedule</Text>
      <FlatList
        data={MOCK_SCHEDULE}
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

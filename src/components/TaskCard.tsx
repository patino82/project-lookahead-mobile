import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  projectId?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return COLORS.rose;
      case 'medium': return COLORS.amber;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(task.priority) }]} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
        )}
        <View style={styles.footer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{task.status.toUpperCase()}</Text>
          </View>
          {task.estimatedTime && (
            <Text style={styles.timeText}>{task.estimatedTime}h est</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  priorityStrip: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.glass,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Alert } from 'react-native';
import { AlertTriangle, CheckCircle, Clock, PlusCircle, Circle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import { apiFetch } from '../services/api';
import { OpenItem } from '../types';

interface OpenItemsScreenProps {
  route: any;
}

export const OpenItemsScreen: React.FC<OpenItemsScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};
  const [items, setItems] = useState<OpenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const result = await apiFetch(`/api/open-items/${projectId || 'default'}`);
      setItems(result?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load open items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleToggleStatus = async (item: OpenItem) => {
    const newStatus = item.status === 'open' ? 'closed' : 'open';
    try {
      await apiFetch(`/api/open-items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update item status.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return COLORS.rose;
      case 'medium': return COLORS.amber;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getPriorityIcon = (priority: string) => {
    const color = getPriorityColor(priority);
    return <AlertTriangle size={14} color={color} />;
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays}d left`;
  };

  const openItems = items.filter(i => i.status === 'open');
  const closedItems = items.filter(i => i.status === 'closed');

  const renderItem = ({ item }: { item: OpenItem }) => {
    const isClosed = item.status === 'closed';
    const dueText = formatDueDate(item.dueDate);

    return (
      <TouchableOpacity
        style={[styles.itemCard, isClosed && styles.itemCardClosed]}
        activeOpacity={0.8}
        onPress={() => handleToggleStatus(item)}
      >
        <View style={styles.itemTop}>
          <View style={styles.itemLeft}>
            {isClosed ? (
              <CheckCircle size={20} color={COLORS.success} />
            ) : (
              <Circle size={20} color={COLORS.textSecondary} />
            )}
            <Text style={[styles.itemDescription, isClosed && styles.itemDescriptionClosed]}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.priorityBadge}>
            {getPriorityIcon(item.priority)}
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
          {dueText && (
            <View style={styles.dueBadge}>
              <Clock size={12} color={COLORS.textSecondary} />
              <Text style={styles.dueText}>{dueText}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, data: OpenItem[], emptyText: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{data.length}</Text>
      </View>
      {data.length === 0 ? (
        <Text style={styles.sectionEmpty}>{emptyText}</Text>
      ) : (
        data.map(item => <View key={item.id}>{renderItem({ item })}</View>)
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>TRACKING</Text>
            <Text style={styles.title}>Open Items</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{openItems.length} open</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={[{ key: 'content' }]}
            renderItem={() => (
              <View>
                {renderSection('OPEN', openItems, 'No open items. Tap an item to close it.')}
                {closedItems.length > 0 && renderSection('CLOSED', closedItems, '')}
              </View>
            )}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <AlertTriangle size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No Open Items</Text>
                <Text style={styles.emptySub}>Issues and punch list items will appear here.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: COLORS.ink,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(224, 123, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224, 123, 53, 0.2)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  errorBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  sectionEmpty: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemCardClosed: {
    opacity: 0.6,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
    lineHeight: 20,
  },
  itemDescriptionClosed: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: 28,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.glass,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: SPACING.md,
  },
  emptySub: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

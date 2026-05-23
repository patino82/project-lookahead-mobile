import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { OpenItem } from '../types';
import { apiFetch } from '../services/api';
import { AlertCircle, Plus, ChevronRight, ListTodo } from 'lucide-react-native';

interface OpenItemsScreenProps {
  route: any;
}

export const OpenItemsScreen: React.FC<OpenItemsScreenProps> = ({ route }) => {
  const { projectId } = route.params || {};
  const [items, setItems] = useState<OpenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    if (!projectId) return;
    try {
      const data = await apiFetch(`/api/projects/${projectId}/open-items`);
      if (data && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      fetchItems();
    }
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleAddItem = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/open-items`, {
        method: 'POST',
        body: JSON.stringify({
          description: description.trim(),
          priority: 'Medium',
        }),
      });

      if (res && res.item) {
        setItems([res.item, ...items]);
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to add item', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: OpenItem }) => (
    <Card variant="elevated" style={styles.itemCard}>
      <View style={styles.itemRow}>
        <View style={[styles.priorityTab, { backgroundColor: item.priority.toLowerCase() === 'high' ? COLORS.rose : COLORS.amber }]} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemDesc}>{item.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.priorityLabel}>{item.priority.toUpperCase()}</Text>
            {item.dueDate && (
              <Text style={styles.dateLabel}>• Due {new Date(item.dueDate).toLocaleDateString()}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.checkAction}>
          <View style={styles.checkCircle} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (!projectId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={styles.welcome}>COMMAND STACK</Text>
          <Text style={styles.mainTitle}>Project Blockers</Text>
        </View>
        <View style={styles.centered}>
          <AlertCircle size={64} color={COLORS.border} strokeWidth={1} />
          <Text style={styles.emptyText}>Horizon Clear</Text>
          <Text style={styles.emptySub}>Select a mission sequence to view or deploy project blockers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.welcome}>OPERATIONAL DEBT</Text>
        <Text style={styles.mainTitle}>Project Blockers</Text>
      </View>
      
      <View style={styles.inputArea}>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Log a new mission blocker..."
            placeholderTextColor={COLORS.muted}
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity 
            style={[styles.addButton, (!description.trim() || submitting) && styles.addBtnDisabled]}
            onPress={handleAddItem}
            disabled={submitting || !description.trim()}
          >
            {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={24} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ListTodo size={48} color={COLORS.border} strokeWidth={1} />
              <Text style={styles.emptyText}>Operational Flow Optimal</Text>
              <Text style={styles.emptySub}>No active blockers detected for this sequence.</Text>
            </View>
          }
        />
      )}
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
    paddingBottom: SPACING.md,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: 6,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.ink,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  itemCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityTab: {
    width: 6,
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    padding: 16,
  },
  itemDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  priorityLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },
  checkAction: {
    paddingHorizontal: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
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
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});

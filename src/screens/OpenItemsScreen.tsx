import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { OpenItem } from '../types';
import { apiFetch } from '../services/api';

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
        Alert.alert('Success', 'Open Item synced to Notion.');
      }
    } catch (err) {
      console.error('Failed to add item', err);
      Alert.alert('Error', 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: OpenItem }) => (
    <Card title={item.description}>
      <Text>Priority: <Text style={{ 
        fontWeight: 'bold', 
        color: item.priority.toLowerCase() === 'high' ? COLORS.error : COLORS.text 
      }}>{item.priority}</Text></Text>
      {item.dueDate && <Text>Due Date: {new Date(item.dueDate).toLocaleDateString()}</Text>}
      <Text style={styles.statusText}>Status: {item.status}</Text>
    </Card>
  );

  if (!projectId) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.header}>Open Items</Text>
        <Text style={styles.emptyText}>Select a project to view or add open items.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Open Items</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New open item / blocker..."
          placeholderTextColor={COLORS.textSecondary}
          value={description}
          onChangeText={setDescription}
        />
        <CustomButton 
          title={submitting ? "Syncing..." : "Add Item"} 
          onPress={handleAddItem}
          disabled={submitting || !description.trim()}
        />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No open items for this project.</Text>
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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

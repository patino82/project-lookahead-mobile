import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { Project } from '../types';
import { amplitude } from '../config/amplitude';
import { apiFetch } from '../services/api';

interface ProjectListScreenProps {
  navigation: any;
}

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/projects');
      if (data && data.projects) {
        // Map backend Project type to mobile Project type
        const mappedProjects: Project[] = data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location || 'No location',
          status: p.status,
          lastUpdated: new Date(p.updatedAt).toISOString().slice(0, 10),
        }));
        setProjects(mappedProjects);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Could not load projects. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        amplitude.track('Project Selected', {
          project_id: item.id,
          project_name: item.name,
          project_status: item.status,
        });
        navigation.navigate('Today', { projectId: item.id });
      }}
    >
      <Card title={item.name}>
        <Text style={styles.locationText}>{item.location}</Text>
        <Text style={styles.statusText}>Status: {item.status}</Text>
        <Text style={styles.dateText}>Last Updated: {item.lastUpdated}</Text>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Projects</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No projects found.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  itemContainer: {
    marginBottom: SPACING.sm,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});

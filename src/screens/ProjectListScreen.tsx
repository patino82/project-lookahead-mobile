import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants';
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
        const mappedProjects: Project[] = data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location || 'Unassigned Site',
          status: p.status,
          lastUpdated: new Date(p.updatedAt).toISOString().slice(0, 10),
        }));
        setProjects(mappedProjects);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Connection failed. Pulse check your server.');
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
      activeOpacity={0.8}
      style={styles.itemContainer}
      onPress={() => {
        amplitude.track('Project Selected', {
          project_id: item.id,
          project_name: item.name,
        });
        navigation.navigate('MainTabs', { 
          screen: 'Today', 
          params: { projectId: item.id } 
        });
      }}
    >
      <Card variant="solid">
        <View style={styles.cardHeader}>
          <Text style={styles.projectName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: item.status === 'active' ? COLORS.success + '20' : COLORS.border }]}>
            <Text style={[styles.badgeText, { color: item.status === 'active' ? COLORS.success : COLORS.textSecondary }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.locationText}>{item.location}</Text>
        <View style={styles.footer}>
          <Text style={styles.dateLabel}>Active Since</Text>
          <Text style={styles.dateText}>{item.lastUpdated}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.subtitle}>Active Portfolios</Text>
        <Text style={styles.header}>Project Lookahead</Text>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No project records found.</Text>
              <Text style={styles.emptySub}>Setup a project in Notion to begin.</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  itemContainer: {
    marginBottom: -8, // Tighter overlap
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
  }
});

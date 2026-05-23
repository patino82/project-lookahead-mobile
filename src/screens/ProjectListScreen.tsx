import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants';
import { Card } from '../components/Card';
import { Project } from '../types';
import { amplitude } from '../config/amplitude';
import { apiFetch } from '../services/api';
import { LayoutGrid, ChevronRight, MapPin, CalendarDays } from 'lucide-react-native';

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
          location: p.location || 'Site unmapped',
          status: p.status,
          lastUpdated: new Date(p.updatedAt).toISOString().slice(0, 10),
        }));
        setProjects(mappedProjects);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('System connection error. Manual refresh required.');
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
      activeOpacity={0.7}
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
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <LayoutGrid size={20} color={COLORS.primary} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.muted }]} />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.border} />
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <MapPin size={12} color={COLORS.muted} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <CalendarDays size={12} color={COLORS.muted} />
            <Text style={styles.detailText}>Refreshed {item.lastUpdated}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerArea}>
        <View>
          <Text style={styles.welcome}>COMMAND CENTER</Text>
          <Text style={styles.mainTitle}>Project Portfolios</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>DP</Text>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LayoutGrid size={48} color={COLORS.border} strokeWidth={1} />
              <Text style={styles.emptyText}>Zero Active Missions</Text>
              <Text style={styles.emptySub}>Deploy a project sequence in Notion to populate this field list.</Text>
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
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  itemContainer: {
    marginBottom: SPACING.md,
  },
  card: {
    padding: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 20,
  },
  emptySub: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  }
});

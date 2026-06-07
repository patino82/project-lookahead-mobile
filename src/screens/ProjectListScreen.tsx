import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { COLORS, SPACING } from '../constants';
import { Card } from '../components/Card';
import { Project } from '../types';
import { amplitude } from '../config/amplitude';
import { apiFetch } from '../services/api';
import { getProjects } from '../services/offline-db';
import { LayoutGrid, ChevronRight, MapPin, CalendarDays, Activity, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProjectListScreenProps } from '../navigation/types';

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const applyProjects = (sourceProjects: any[]) => {
    const mappedProjects: Project[] = sourceProjects.map((p: any) => ({
      id: p.id,
      name: p.name,
      location: p.location || 'Site unmapped',
      status: p.status,
      lastUpdated: p.lastUpdated || new Date(p.updatedAt || Date.now()).toISOString().slice(0, 10),
    }));
    setProjects(mappedProjects);
  };

  const fetchProjects = async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/projects');
      if (data && data.projects) {
        applyProjects(data.projects);
        setIsOffline(Boolean(data.isOffline));
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Operational connection lost.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const cachedProjects = await getProjects();
      if (cachedProjects.length) {
        applyProjects(cachedProjects);
        setIsOffline(true);
        setLoading(false);
      }
      await fetchProjects();
    };
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.itemContainer}
      accessibilityRole="button"
      accessibilityLabel={`Open project ${item.name}`}
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
            <Activity size={20} color={COLORS.primary} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.projectName}>{item.name.toUpperCase()}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.pulse, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.muted }]} />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.border} />
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <MapPin size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <CalendarDays size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>SEQ {item.lastUpdated}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.heroOverlay}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerArea}>
          <View>
            <Text style={styles.welcome}>COMMAND CENTER</Text>
            <Text style={styles.mainTitle}>Mission Control</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>DP</Text>
          </View>
        </View>

        <View style={styles.searchArea}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>OFFLINE MODE</Text>
            </View>
          )}
          <View style={styles.searchBox}>
            <Search size={16} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search missions by name"
              placeholderTextColor={COLORS.textSecondary}
              accessibilityLabel="Search projects"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
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
                <Text style={styles.emptyText}>{searchQuery.trim() ? 'No Matching Missions' : 'Zero Active Missions'}</Text>
                <Text style={styles.emptySub}>
                  {searchQuery.trim()
                    ? 'Adjust the search query to find another project.'
                    : 'Deploy a project sequence in Notion to populate this field list.'}
                </Text>
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
  headerArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '900',
  },
  searchArea: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.warningSubtle,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
  },
  offlineText: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchBox: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 10,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  }
});

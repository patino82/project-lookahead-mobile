import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZE } from '../constants';
import { CustomButton } from '../components/CustomButton';
import { Project } from '../types';
import { amplitude } from '../config/amplitude';
import { apiFetch, ApiError } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

import { LayoutGrid, ChevronRight, MapPin, Calendar, Search, FolderOpen } from 'lucide-react-native';
interface ProjectListScreenProps {
  navigation: any;
}

export const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/projects');
      if (data && data.projects) {
        const mappedProjects: Project[] = data.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location || 'No location set',
          status: p.status || 'active',
          lastUpdated: new Date(p.updatedAt).toISOString().slice(0, 10),
          _count: p._count,
        }));
        setProjects(mappedProjects);
        setFilteredProjects(mappedProjects);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredProjects(
        projects.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'completed': return '#3b82f6';
      case 'on-hold': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
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
          params: { projectId: item.id },
        });
      }}
    >
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <FolderOpen size={20} color={COLORS.primary} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.textSecondary} />
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <MapPin size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar size={12} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Updated {item.lastUpdated}</Text>
          </View>
        </View>

        {item._count && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>{item._count.tasks} tasks</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(224, 123, 53, 0.05)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerArea}>
          <View>
            <Text style={styles.welcome}>PORTFOLIO</Text>
            <Text style={styles.mainTitle}>Projects</Text>
            <Text style={styles.subtitle}>{projects.length} ACTIVE PROJECTS</Text>
          </View>
        </View>

        <View style={styles.searchArea}>
          <View style={styles.searchWrapper}>
            <Search size={16} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={fetchProjects} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              filteredProjects.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <LayoutGrid size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No Matching Projects' : 'No Projects Yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Create a project in the web dashboard to get started.'}
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
    paddingBottom: SPACING.md,
  },
  welcome: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  searchArea: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.ink,
    fontWeight: '500',
    paddingVertical: SPACING.sm,
  },
  errorBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  retryBtnText: {
    color: COLORS.error,
    fontSize: 12,
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
  listContentEmpty: {
    flexGrow: 1,
  },
  itemContainer: {
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
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
    backgroundColor: 'rgba(224, 123, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  countRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  countText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: SPACING.lg,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  },
});

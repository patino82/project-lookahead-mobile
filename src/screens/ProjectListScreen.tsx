import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import { Project } from '../types';
import { amplitude } from '../config/amplitude';
import { apiFetch } from '../services/api';
import { LayoutGrid, ChevronRight, MapPin, Calendar, Search } from 'lucide-react-native';

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

  const getPillColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'completed': return '#3b82f6';
      case 'on-hold': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getPillBg = (status: string) => {
    switch (status) {
      case 'active': return 'rgba(16, 185, 129, 0.12)';
      case 'completed': return 'rgba(59, 130, 246, 0.12)';
      case 'on-hold': return 'rgba(245, 158, 11, 0.12)';
      default: return 'rgba(122, 129, 153, 0.12)';
    }
  };

  const renderItem = ({ item }: { item: Project }) => {
    const itemHeight = 44;
    const progressPercent = item._count ? 50 : 15; // placeholder since no completion %

    return (
      <TouchableOpacity
        activeOpacity={0.8}
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
        style={styles.cardTouchable}
      >
        <View style={styles.card}>
          {/* Top row: name + status pill + chevron */}
          <View style={styles.cardTopRow}>
            <Text style={styles.projectName} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: getPillBg(item.status) },
              ]}
            >
              <Text
                style={[styles.statusPillText, { color: getPillColor(item.status) }]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </View>

          {/* Details row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MapPin size={12} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar size={12} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>Updated {item.lastUpdated}</Text>
            </View>
          </View>

          {/* Task count */}
          {item._count && (
            <Text style={styles.taskCountText}>
              {item._count.tasks} task{item._count.tasks !== 1 ? 's' : ''}
            </Text>
          )}

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: getPillColor(item.status),
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>
            {projects.length} ACTIVE PROJECTS
          </Text>
        </View>

        {/* Search bar */}
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

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={fetchProjects} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading state */}
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* List */}
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
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LayoutGrid size={64} color={COLORS.border} />
                  <Text style={styles.emptyText}>No Projects Found</Text>
                  <Text style={styles.emptySub}>
                    Create your first project in the web dashboard
                  </Text>
                </View>
              }
            />
          </>
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: SPACING.xs,
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
    minHeight: 44,
    justifyContent: 'center',
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
  cardTouchable: {
    marginBottom: SPACING.md,
    minHeight: 44,
  },
  card: {
    backgroundColor: COLORS.surfaceSolid,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 44,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
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
  taskCountText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.ink,
    fontSize: 20,
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

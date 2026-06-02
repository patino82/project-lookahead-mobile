import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, FileText, FolderOpen, Link as LinkIcon } from 'lucide-react-native';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants';
import { apiFetch } from '../services/api';

interface DocumentsScreenProps {
  route: any;
}

interface ProjectDocument {
  id: string;
  title?: string;
  name?: string;
  type?: string | null;
  category?: string | null;
  url?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

const unwrapDocuments = (value: any): ProjectDocument[] => (
  value?.documents || value?.files || value || []
);

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ route }) => {
  const { projectId = 'default' } = route.params || {};
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const result = await apiFetch(`/api/projects/${projectId}/documents`);
      setDocuments(unwrapDocuments(result));
    } catch (err: any) {
      setError(err?.message || 'Failed to load project documents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const counts = useMemo(() => {
    const plans = documents.filter(doc => String(doc.category || doc.type || '').toLowerCase().includes('plan')).length;
    const linked = documents.filter(doc => doc.url).length;
    return { plans, linked };
  }, [documents]);

  const formatDate = (value?: string | null) => {
    if (!value) return 'No date';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: ProjectDocument }) => {
    const label = item.title || item.name || 'Untitled document';
    const category = item.category || item.type || 'Field document';
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.82}>
        <View style={styles.docIcon}>
          <FileText size={22} color={COLORS.primary} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.docTitle} numberOfLines={2}>{label}</Text>
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{String(category).toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Calendar size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Updated {formatDate(item.updatedAt || item.createdAt)}</Text>
            {item.url && <LinkIcon size={12} color={COLORS.success} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>FILES</Text>
            <Text style={styles.title}>Documents</Text>
          </View>
          <Text style={styles.countPill}>{documents.length} FILES</Text>
        </View>

        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={fetchDocuments}>
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={documents}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || `${item.title || item.name}-${index}`}
            contentContainerStyle={documents.length ? styles.listContent : styles.emptyList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchDocuments();
                }}
                tintColor={COLORS.primary}
              />
            }
            ListHeaderComponent={
              documents.length ? (
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{counts.plans}</Text>
                    <Text style={styles.statLabel}>PLAN SETS</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{counts.linked}</Text>
                    <Text style={styles.statLabel}>LINKED</Text>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.icon}>
                  <FolderOpen size={34} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Documents Yet</Text>
                <Text style={styles.emptySub}>Plans, reports, and field files will appear here once they are added to the project.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: FONT_SIZE.xs, fontWeight: '900', letterSpacing: 2, marginBottom: SPACING.xs },
  title: { color: COLORS.ink, fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  countPill: { color: COLORS.primary, fontSize: FONT_SIZE.xs, fontWeight: '900', letterSpacing: 1, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: 'rgba(224,123,53,0.1)', borderWidth: 1, borderColor: 'rgba(224,123,53,0.2)' },
  errorBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  emptyList: { flexGrow: 1, paddingHorizontal: SPACING.lg },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.ink, fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  card: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, marginBottom: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSolid, borderWidth: 1, borderColor: COLORS.border },
  docIcon: { width: 48, height: 48, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,123,53,0.1)', borderWidth: 1, borderColor: 'rgba(224,123,53,0.18)' },
  cardBody: { flex: 1 },
  cardTop: { gap: SPACING.sm },
  docTitle: { color: COLORS.ink, fontSize: FONT_SIZE.md, fontWeight: '900', lineHeight: 20 },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.border },
  typeText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm },
  metaText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '700', flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  icon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,123,53,0.1)', borderWidth: 1, borderColor: 'rgba(224,123,53,0.2)' },
  emptyTitle: { color: COLORS.ink, fontSize: FONT_SIZE.xl, fontWeight: '900', marginTop: SPACING.lg },
  emptySub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 20, textAlign: 'center', marginTop: SPACING.sm },
});

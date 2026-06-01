import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING } from '../constants';

export const DocumentsScreen: React.FC = () => (
  <View style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>FILES</Text>
        <Text style={styles.title}>Documents</Text>
      </View>
      <View style={styles.empty}>
        <View style={styles.icon}>
          <FileText size={34} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Coming Soon</Text>
        <Text style={styles.emptySub}>Project plans, reports, and field documents will be available here.</Text>
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: SPACING.md },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { color: COLORS.ink, fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingBottom: 80 },
  icon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,123,53,0.1)', borderWidth: 1, borderColor: 'rgba(224,123,53,0.2)' },
  emptyTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '900', marginTop: SPACING.lg },
  emptySub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 20, textAlign: 'center', marginTop: SPACING.sm },
});
